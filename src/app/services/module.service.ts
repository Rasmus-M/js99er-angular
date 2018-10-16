import {MemoryBlock, Software} from '../classes/software';
import {Log} from '../classes/log';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {ZipService} from './zip.service';
import {Util} from '../classes/util';
import {forkJoin} from "rxjs";
import * as zip from 'zip-js/WebContent/zip.js';
import Entry = zip.Entry;
import Reader = zip.Reader;

@Injectable()
export class ModuleService {

    private httpClient: HttpClient;
    private zipService: ZipService;
    private log: Log = Log.getLog();

    constructor(httpClient: HttpClient, zipService: ZipService) {
        this.httpClient = httpClient;
        this.zipService = zipService;
    }

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

    loadModuleFromFile(file: File): Observable<Software> {
        let extension = file.name.split('.').pop();
        extension = extension ? extension.toLowerCase() : "";
        if (extension != null && extension !== "rpk" && extension !== "zip" && extension !== "bin") {
            const subject = new Subject<Software>();
            subject.error("File name extension '" + extension + "' not supported.");
            return subject.asObservable();
        }
        if (extension === "bin") {
            return this.loadBinModuleFromFile(file);
        } else {
            return this.loadRPKModuleFromFile(file);
        }
    }

    loadModuleFromURL(url: string): Observable<Software> {
        if (url.substr(url.length - 3).toLowerCase() === 'rpk') {
            return this.loadRPKModuleFromURL('assets/' + url);
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

    loadRPKModuleFromFile(file: File): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createBlobReader(file));
    }

    loadRPKModuleFromURL(url: string): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createHttpReader(url));
    }

    loadRPKOrZipModule(reader: Reader): Observable<Software> {
        const
            subject = new Subject<Software>(),
            self = this;
        this.zipService.createReader(reader, (zipReader) => {
            zipReader.getEntries(function (entries) {
                let layoutEntry = null;
                entries.forEach(function (entry) {
                    // log.info(entry.filename);
                    if (entry.filename === 'layout.xml') {
                        // log.info("Layout file found");
                        layoutEntry = entry;
                    }
                });
                if (layoutEntry != null) {
                    self.loadRPKModule(layoutEntry, entries, subject);
                } else {
                    self.loadZipModule(entries, subject);
                }
            });
        }, (error) => {
            subject.error(error);
        });
        return subject.asObservable();
    }

    loadRPKModule(layoutEntry: Entry, entries: Entry[], subject: Subject<Software>) {
        const
            self = this,
            zipService = this.zipService,
            writer = zipService.createTextWriter('ISO-8859-1');
        layoutEntry.getData(writer, function (txt) {
            const
                parser = new DOMParser(),
                xmlDoc = parser.parseFromString(txt, 'text/xml'),
                pcb = xmlDoc.getElementsByTagName('pcb')[0],
                pcbType = pcb.getAttribute('type').toLowerCase(),
                roms = xmlDoc.getElementsByTagName('rom'),
                sockets = xmlDoc.getElementsByTagName('socket'),
                module: Software = new Software(),
                observables = [];
            module.inverted = pcbType === 'paged379i';
            module.cruBankSwitched = pcbType === "pagedcru";
            for (let i = 0; i < roms.length; i++) {
                const rom = roms[i];
                const romId = rom.getAttribute('id');
                const filename = rom.getAttribute('file');
                let socketId = null;
                for (let j = 0; j < sockets.length && !socketId; j++) {
                    if (sockets[j].getAttribute('uses') === romId) {
                        socketId = sockets[j].getAttribute('id');
                    }
                }
                let entry: Entry = null;
                for (let j = 0; j < entries.length && entry == null; j++) {
                    if (entries[j].filename === filename) {
                        entry = entries[j];
                    }
                }
                observables.push(self.loadRPKEntry(entry, filename, romId, socketId));
            }
            forkJoin(observables).subscribe(
                (softwares: Software[]) => {
                    const romArray: number[] = [];
                    softwares.forEach((software: Software) => {
                        if (software.grom) {
                            module.grom = software.grom;
                        } else if (software.rom) {
                            const offset = (software.socketId === 'rom2_socket') ? 0x2000 : 0;
                            self.insertROM(romArray, software.rom, offset);
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
        }, function (progress, total) {
            // On progress
        }, function (error) {
            subject.error(error);
        });
    }

    private loadRPKEntry(entry: Entry, filename: string, romId: string, socketId: string): Observable<Software> {
        const
            subject = new Subject<Software>(),
            zipService = this.zipService,
            blobWriter = zipService.createBlobWriter(),
            log = Log.getLog();
        entry.getData(blobWriter, function (blob) {
            const reader = new FileReader();
            reader.onload = function () {
                // reader.result contains the contents of blob as a typed array
                const byteArray = new Uint8Array(reader.result);
                const software = new Software();
                if (socketId.substr(0, 3).toLowerCase() === 'rom') {
                    log.info('ROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + byteArray.length + ' bytes');
                    software.rom = byteArray;
                    software.socketId = socketId;
                } else if (socketId.substr(0, 4).toLowerCase() === 'grom') {
                    log.info('GROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + byteArray.length + ' bytes');
                    software.grom = byteArray;
                }
                subject.next(software);
                subject.complete();
            };
            reader.readAsArrayBuffer(blob);
        });
        return subject.asObservable();
    }

    private insertROM(romArray: number[], rom: Uint8Array, offset: number) {
        if (romArray.length < offset) {
            for (let i = 0; i < offset; i++) {
                romArray[i] = 0;
            }
        }
        for (let i = 0; i < Math.max(rom.length, 0x2000); i++) {
            romArray[offset + i] = i < rom.length ? rom[i] : 0;
        }
    }

    loadZipModule(entries: Entry[], subject: Subject<Software>) {
        const
            self = this,
            log = Log.getLog(),
            zipService = this.zipService,
            module: Software = new Software(),
            observables: Observable<Software>[] = [];
        entries.forEach(function (entry) {
            log.info(entry.filename);
            observables.push(self.loadZipEntry(entry));
        });
        forkJoin(observables).subscribe(
            (softwares: Software[]) => {
                softwares.forEach((software: Software) => {
                    if (software.grom) {
                        module.grom = software.grom;
                    } else if (software.rom) {
                        module.rom = software.rom;
                        module.inverted = software.inverted;
                    }
                });
                subject.next(module);
                subject.complete();
            },
            subject.error
        );
    }

    loadZipEntry(entry: Entry): Observable<Software> {
        const
            subject = new Subject<Software>(),
            software = new Software(),
            baseFileName = entry.filename.split('.')[0],
            extension = entry.filename.split('.')[1],
            zipService = this.zipService;
        if (extension === 'bin') {
            const grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g';
            software.inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
            const blobWriter = zipService.createBlobWriter();
            entry.getData(blobWriter, function (blob) {
                const reader = new FileReader();
                reader.onload = function () {
                    // reader.result contains the contents of blob as a typed array
                    const byteArray = new Uint8Array(reader.result);
                    if (grom) {
                        software.grom = byteArray;
                    } else {
                        software.rom = byteArray;
                    }
                    subject.next(software);
                    subject.complete();
                };
                reader.readAsArrayBuffer(blob);
            }, function () {
                // On progress
            }, function (error) {
                subject.error(error);
            });
        }
        return subject.asObservable();
    }

    loadBinModuleFromFile(file: File): Observable<Software> {
        const
            subject = new Subject<Software>(),
            baseFileName = file.name.split('.')[0],
            inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3',
            grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g',
            reader = new FileReader();
        reader.onload = function () {
            const byteArray = new Uint8Array(reader.result);
            const module: Software = new Software();
            if (grom) {
                module.grom = byteArray;
            } else {
                const ramPaged = (byteArray[3] === 0x52);
                module.inverted = inverted;
                module.rom = byteArray;
                module.ramAt7000 = ramPaged;
                module.ramPaged = ramPaged;
            }
            subject.next(module);
        };
        reader.onerror = function () {
            subject.error(reader.error);
        };
        reader.readAsArrayBuffer(file);
        return subject.asObservable();
    }

    loadBinModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        const baseFileName = url.split('.')[0];
        const inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
        this.httpClient.get(url, {responseType: 'arraybuffer'}).subscribe(
            (data: ArrayBuffer) => {
                const byteArray = new Uint8Array(data);
                const module = new Software();
                module.inverted = inverted;
                module.rom = byteArray;
                subject.next(module);
            },
            (error) => {
                subject.error(error);
            }
        );
        return subject.asObservable();
    }

    loadJSONModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        const self = this;
        this.httpClient.get(url, {responseType: 'json'}).subscribe(
            (data: any) => {
                const software = new Software();
                software.inverted = data.inverted;
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
                software.ramAt6000 = data.ramAt6000 === 'true';
                software.ramAt7000 = data.ramAt7000 === 'true';
                subject.next(software);
            },
            (error) => {
                subject.error(error.error);
            }
        );
        return subject.asObservable();
    }
}
