import {MemoryBlock, Software} from '../classes/software';
import {Log} from '../classes/log';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs';
import {Util} from '../classes/util';
import {forkJoin} from "rxjs";
import {BlobReader, BlobWriter, Entry, HttpReader, Reader, TextWriter, URLString, ZipEntry, ZipReader} from "@zip.js/zip.js";
@Injectable()
export class ModuleService {

    private log = Log.getLog();

    constructor(
        private httpClient: HttpClient
    ) {}

    private static hexArrayToByteArray(hexArray: string[]) {
        const binArray = [];
        let n = 0;
        for (let i = 0; i < hexArray.length; i++) {
            const row = hexArray[i];
            for (let j = 0; j < row.length; j += 2) {
                binArray[n++] = parseInt(row.substr(j, 2), 16);
            }
        }
        return new Uint8Array(binArray);
    }

    private static insertROM(romArray: number[], rom: Uint8Array, offset: number) {
        if (romArray.length < offset) {
            for (let i = 0; i < offset; i++) {
                romArray[i] = 0;
            }
        }
        for (let i = 0; i < rom.length; i++) {
            romArray[offset + i] = rom[i];
        }
        const length = romArray.length;
        const paddedLength = Math.max(Math.pow(2, Math.ceil(Math.log2(length))), 0x2000);
        for (let i = length; i < paddedLength; i++) {
            romArray[i] = 0;
        }
    }

    private static padROM(rom: Uint8Array): Uint8Array {
        const length = rom.length;
        const paddedLength = Math.max(Math.pow(2, Math.ceil(Math.log2(length))), 0x2000);
        if (length !== paddedLength) {
            const paddedRom = new Uint8Array(paddedLength);
            for (let i = 0; i < length; i++) {
                paddedRom[i] = rom[i];
            }
            return paddedRom;
        } else {
            return rom;
        }
    }

    loadModuleFromFiles(files: FileList): Observable<Software> {
        if (files.length === 1) {
            return this.loadModuleFromFile(files[0]);
        } else {
            const observables: Observable<Software>[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const extension = this.getExtension(file.name);
                if (extension === "bin") {
                    observables.push(this.loadBinModuleFromFile(file, true));
                }
            }
            return this.combineSoftwareIntoModule(observables);
        }
    }

    loadModuleFromFile(file: File): Observable<Software> {
        const extension = this.getExtension(file.name);
        if (extension !== "rpk" && extension !== "zip" && extension !== "bin") {
            const subject = new Subject<Software>();
            subject.error("File name extension '" + extension + "' not supported.");
            return subject.asObservable();
        }
        if (extension === "bin") {
            return this.loadBinModuleFromFile(file, false);
        } else {
            return this.loadRPKOrZipModuleFromFile(file);
        }
    }

    loadModuleFromURL(url: string): Observable<Software> {
        if (url.substr(url.length - 3).toLowerCase() === 'rpk') {
            return this.loadRPKOrZipModuleFromURL('assets/' + url);
        } else if (url.substr(url.length - 3).toLowerCase() === 'bin') {
            return this.loadBinModuleFromURL('assets/' + url);
        } else if (url.substr(url.length - 4).toLowerCase() === 'json') {
            return this.loadJSONModuleFromURL('assets/' + url);
        } else {
            const subject = new Subject<Software>();
            subject.error("Invalid url: " + url);
            return subject.asObservable();
        }
    }

    loadRPKOrZipModuleFromFile(file: File): Observable<Software> {
        return this.loadRPKOrZipModule(new BlobReader(file));
    }

    loadRPKOrZipModuleFromURL(url: string): Observable<Software> {
        return this.loadRPKOrZipModule(new HttpReader(url));
    }

    loadRPKOrZipModule(reader: Reader<Blob | URLString>): Observable<Software> {
        const subject = new Subject<Software>();
        new ZipReader(reader).getEntries().then(
            (entries: Entry[]) => {
                let layoutEntry = null;
                entries.forEach((entry) => {
                    // this.log.info(entry.filename);
                    if (entry.filename === 'layout.xml') {
                        // this.log.info("Layout file found");
                        layoutEntry = entry;
                    }
                });
                if (layoutEntry != null) {
                    this.loadRPKModule(layoutEntry, entries, subject);
                } else {
                    this.loadZipModule(entries, subject);
                }
            }
        ).catch(
            (error) => {
                subject.error(error);
            }
        );
        return subject.asObservable();
    }

    loadRPKModule(layoutEntry: Entry, entries: Entry[], subject: Subject<Software>) {
        layoutEntry.getData!(
            new TextWriter('ISO-8859-1')
        ).then(
            (txt: string) => {
                const
                    parser = new DOMParser(),
                    xmlDoc = parser.parseFromString(txt, 'text/xml'),
                    pcb = xmlDoc.getElementsByTagName('pcb')[0],
                    pcbType = pcb && pcb.getAttribute('type')?.toLowerCase(),
                    roms = xmlDoc.getElementsByTagName('rom'),
                    sockets = xmlDoc.getElementsByTagName('socket'),
                    module: Software = new Software(),
                    observables = [];
                module.inverted = pcbType === 'paged379i';
                module.cruBankSwitched = pcbType === 'pagedcru' || pcbType === 'super';
                module.ramAt7000 = pcbType === 'minimem';
                for (let i = 0; i < roms.length; i++) {
                    const rom = roms[i];
                    const romId = rom.getAttribute('id');
                    if (romId) {
                        const filename = rom.getAttribute('file');
                        let socketId = null;
                        for (let j = 0; j < sockets.length && !socketId; j++) {
                            if (sockets[j].getAttribute('uses') === romId) {
                                socketId = sockets[j].getAttribute('id');
                            }
                        }
                        if (filename && socketId) {
                            let entry: Entry | null = null;
                            for (let j = 0; j < entries.length && entry == null; j++) {
                                if (entries[j].filename === filename) {
                                    entry = entries[j];
                                }
                            }
                            if (entry) {
                                observables.push(this.loadRPKEntry(entry, filename, romId, socketId));
                            }
                        }
                    }
                }
                forkJoin(observables).subscribe(
                    (softwares: Software[]) => {
                        const romArray: number[] = [];
                        softwares.forEach((software: Software) => {
                            if (software.grom) {
                                module.grom = software.grom;
                            } else if (software.rom) {
                                const offset = (software.socketId === 'rom2_socket') ? 0x2000 : 0;
                                ModuleService.insertROM(romArray, software.rom, offset);
                            }
                        });
                        if (romArray.length) {
                            module.rom = new Uint8Array(romArray);
                        }
                        subject.next(module);
                        subject.complete();
                    },
                    subject.error
                );
            }
        ).catch(
            (error: any) => {
                subject.error(error);
            }
        );
    }

    private loadRPKEntry(entry: Entry, filename: string, romId: string, socketId: string): Observable<Software> {
        const subject = new Subject<Software>();
        entry.getData!(
            new BlobWriter()
        ).then(
            (blob: Blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                // reader.result contains the contents of blob as a typed array
                const byteArray = new Uint8Array(reader.result as ArrayBuffer);
                const software = new Software();
                if (socketId.substr(0, 3).toLowerCase() === 'rom') {
                    this.log.info('ROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + byteArray.length + ' bytes');
                    software.rom = byteArray;
                    software.socketId = socketId;
                } else if (socketId.substr(0, 4).toLowerCase() === 'grom') {
                    this.log.info('GROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + byteArray.length + ' bytes');
                    software.grom = byteArray;
                }
                subject.next(software);
                subject.complete();
            };
            reader.readAsArrayBuffer(blob);
            }
        );
        return subject.asObservable();
    }

    loadZipModule(entries: Entry[], subject: Subject<Software>) {
        const observables: Observable<Software>[] = [];
        entries.forEach((entry) => {
            this.log.info(entry.filename);
            if (this.getExtension(entry.filename) === 'bin') {
                observables.push(this.loadZipEntry(entry));
            }
        });
        this.combineSoftwareIntoModule(observables).subscribe(
            (module) => {
                subject.next(module);
                subject.complete();
            }
        );
    }

    loadZipEntry(entry: Entry): Observable<Software> {
        const
            subject = new Subject<Software>(),
            software = new Software(),
            baseFileName: string = this.getBaseFilename(entry.filename),
            grom = baseFileName && (baseFileName.endsWith('g') || baseFileName.endsWith('G'));
        software.inverted = baseFileName !== undefined && (baseFileName.endsWith('3') || baseFileName.endsWith('9'));
        entry.getData!(
            new BlobWriter()
        ).then(
            (blob: Blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // reader.result contains the contents of blob as a typed array
                    const result: ArrayBuffer = reader.result as ArrayBuffer;
                    const byteArray = new Uint8Array(result);
                    const ramFG99Paged = (byteArray[3] === 0x52);
                    software.ramAt7000 = ramFG99Paged;
                    software.ramFG99Paged = ramFG99Paged;
                    if (grom) {
                        software.grom = byteArray;
                    } else {
                        software.rom = byteArray;
                    }
                    subject.next(software);
                    subject.complete();
                };
                reader.readAsArrayBuffer(blob);
            }
        ).catch(
            (error: any) => {
                subject.error(error);
            }
        );
        return subject.asObservable();
    }

    loadBinModuleFromFile(file: File, considerExtensionForSecondBank: boolean): Observable<Software> {
        const
            subject = new Subject<Software>(),
            baseFileName = this.getBaseFilename(file.name),
            inverted = baseFileName !== undefined && (baseFileName.endsWith('3') || baseFileName.endsWith('9')),
            grom = baseFileName && (baseFileName.endsWith('g') || baseFileName.endsWith('G')),
            secondBank = considerExtensionForSecondBank && (baseFileName.endsWith('d') || baseFileName.endsWith('D')),
            reader = new FileReader();
        reader.onload = () => {
            const byteArray = new Uint8Array(reader.result as ArrayBuffer);
            const module: Software = new Software();
            const ramFG99Paged = (byteArray[3] === 0x52);
            module.ramAt7000 = ramFG99Paged;
            module.ramFG99Paged = ramFG99Paged;
            if (grom) {
                module.grom = byteArray;
            } else {
                module.inverted = inverted;
                module.rom = ModuleService.padROM(byteArray);
                module.secondBank = secondBank;
            }
            subject.next(module);
            subject.complete();
        };
        reader.onerror = () => {
            subject.error(reader.error);
        };
        reader.readAsArrayBuffer(file);
        return subject.asObservable();
    }

    loadBinModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        const baseFileName = url.split('.')[0];
        const inverted = baseFileName !== undefined && (baseFileName.endsWith('3') || baseFileName.endsWith('9'));
        this.httpClient.get(url, {responseType: 'arraybuffer'}).subscribe(
            (data: ArrayBuffer) => {
                const byteArray = new Uint8Array(data);
                const module = new Software();
                module.inverted = inverted;
                module.rom = ModuleService.padROM(byteArray);
                subject.next(module);
                subject.complete();
            },
            (error) => {
                subject.error(error);
            }
        );
        return subject.asObservable();
    }

    loadJSONModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        this.httpClient.get(url, {responseType: 'json'}).subscribe(
            (data: any) => {
                const software = new Software();
                software.inverted = data.inverted;
                software.cruBankSwitched = data.cruBankSwitched;
                if (data.startAddress) {
                    software.startAddress = Util.parseNumber(data.startAddress);
                }
                if (data.rom != null) {
                    software.rom = ModuleService.hexArrayToByteArray(data.rom);
                }
                if (data.grom != null) {
                    software.grom = ModuleService.hexArrayToByteArray(data.grom);
                }
                if (data.groms != null) {
                    software.groms = [];
                    for (let g = 0; g < data.groms.length; g++) {
                        software.groms[g] = ModuleService.hexArrayToByteArray(data.groms[g]);
                    }
                }
                if (data.memoryBlocks != null) {
                    software.memoryBlocks = [];
                    for (let i = 0; i < data.memoryBlocks.length; i++) {
                        software.memoryBlocks[i] = new MemoryBlock(
                            Util.parseNumber(data.memoryBlocks[i].address),
                            ModuleService.hexArrayToByteArray(data.memoryBlocks[i].data)
                        );
                    }
                }
                software.ramAt6000 = data.ramAt6000;
                software.ramAt7000 = data.ramAt7000;
                subject.next(software);
                subject.complete();
            },
            (error) => {
                subject.error(error.error);
            }
        );
        return subject.asObservable();
    }

    combineSoftwareIntoModule(observables: Observable<Software>[]): Observable<Software> {
        const subject = new Subject<Software>();
        const module: Software = new Software();
        forkJoin(observables).subscribe(
            (softwares: Software[]) => {
                softwares.forEach((software: Software) => {
                    if (software.grom) {
                        module.grom = software.grom;
                    } else if (software.rom) {
                        if (!software.secondBank) {
                            module.rom = ModuleService.padROM(software.rom);
                            module.inverted = software.inverted;
                        } else {
                            // 2nd bank
                            if (!module.rom) {
                                module.rom = new Uint8Array(0x4000);
                                this.copyArray(software.rom, module.rom, 0, 0x2000, 0x2000);
                            } else if (module.rom && module.rom.length === 0x2000) {
                                const rom = new Uint8Array(0x4000);
                                this.copyArray(module.rom, rom, 0, 0, 0x2000);
                                this.copyArray(software.rom, rom, 0, 0x2000, 0x2000);
                                module.rom = rom;
                            } else if (module.rom && module.rom.length === 0x4000) {
                                this.copyArray(software.rom, module.rom, 0, 0x2000, 0x2000);
                            }
                            module.inverted = false;
                        }
                    }
                    if (software.ramAt6000) {
                        module.ramAt6000 = true;
                    }
                    if (software.ramAt7000) {
                        module.ramAt7000 = true;
                    }
                    if (software.ramFG99Paged) {
                        module.ramFG99Paged = true;
                    }
                });
                subject.next(module);
                subject.complete();
            },
            subject.error
        );
        return subject.asObservable();
    }

    copyArray(from: Uint8Array, to: Uint8Array, fromIndex: number, toIndex: number, length: number) {
        for (let i = 0; i < length; i++) {
            to[toIndex + i] = from[fromIndex + i];
        }
    }

    getBaseFilename(filename: string): string {
        const parts = filename.split('.');
        const baseParts = parts.slice(0, parts.length - 1);
        return baseParts.join(".");
    }

    getExtension(filename: string): string {
        let extension = filename.split('.').pop();
        extension = extension ? extension.toLowerCase() : "";
        return extension;
    }
}
