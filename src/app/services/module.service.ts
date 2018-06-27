import {MemoryBlock, Software} from '../classes/software';
import {Log} from '../classes/log';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {ZipService} from './zip.service';
import {Util} from '../classes/util';

@Injectable()
export class ModuleService {

    private httpClient: HttpClient;
    private zipService: ZipService;
    private log: Log = Log.getLog();

    constructor(httpClient: HttpClient, zipService: ZipService) {
        this.httpClient = httpClient;
        this.zipService = zipService;
    }

    loadModuleFromFile(file): Observable<Software> {
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

    loadRPKModuleFromFile(file): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createBlobReader(file));
    }

    loadRPKModuleFromURL(url): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createHttpReader(url));
    }

    loadRPKOrZipModule(reader): Observable<Software> {
        const subject = new Subject<Software>();
        const self = this;
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

    loadRPKModule(layoutEntry, entries: any[], subject: Subject<Software>) {
        const log = Log.getLog();
        const zipService = this.zipService;
        const writer = zipService.createTextWriter('ISO-8859-1');
        layoutEntry.getData(writer, function (txt) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(txt, 'text/xml');
            const module: Software = new Software();
            const pcb = xmlDoc.getElementsByTagName('pcb')[0];
            const pcbType = pcb.getAttribute('type').toLowerCase();
            module.inverted = pcbType === 'paged379i';
            const roms = xmlDoc.getElementsByTagName('rom');
            const sockets = xmlDoc.getElementsByTagName('socket');
            let filesToLoad = roms.length;
            for (let i = 0; i < roms.length; i++) {
                const rom = roms[i];
                const romId = rom.getAttribute('id');
                const filename = rom.getAttribute('file');
                let socketId = null;
                for (let j = 0; j < sockets.length; j++) {
                    if (sockets[j].getAttribute('uses') === romId) {
                        socketId = sockets[j].getAttribute('id');
                    }
                }
                loadRPKFile(entries, filename, romId, socketId, pcbType);
            }

            function loadRPKFile(_entries, filename, romId, socketId, _pcbType) {
                _entries.forEach(function (entry) {
                    if (entry.filename === filename) {
                        const blobWriter = zipService.createBlobWriter();
                        entry.getData(blobWriter, function (blob) {
                            const reader2 = new FileReader();
                            reader2.onload = function () {
                                // reader.result contains the contents of blob as a typed array
                                const byteArray = new Uint8Array(this.result);
                                const plainArray = [];
                                for (let i = 0; i < byteArray.length; i++) {
                                    plainArray[i] = byteArray[i];
                                }
                                if (socketId.substr(0, 3).toLowerCase() === 'rom') {
                                    log.info('ROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + plainArray.length + ' bytes');
                                    const addr = (socketId === 'rom2_socket') ? 0x2000 : 0;
                                    const rom = [];
                                    for (let i = 0; i < Math.min(plainArray.length, _pcbType === "paged" ? 0x2000 : plainArray.length); i++) {
                                        rom[addr + i] = plainArray[i];
                                    }
                                    for (let i = plainArray.length; i < 0x2000; i++) {
                                        rom[addr + i] = 0;
                                    }
                                    module.rom = new Uint8Array(rom);
                                } else if (socketId.substr(0, 4).toLowerCase() === 'grom') {
                                    log.info('GROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + plainArray.length + ' bytes');
                                    module.grom = byteArray;
                                }
                                filesToLoad--;
                                if (filesToLoad === 0) {
                                    console.log(module);
                                    subject.next(module);
                                    subject.complete();
                                }
                            };
                            reader2.readAsArrayBuffer(blob);
                        });
                    }
                });
            }
        });
    }

    loadZipModule(entries: any[], subject: Subject<Software>) {
        const log = Log.getLog();
        const zipService = this.zipService;
        const module: Software = new Software();
        let filesToLoad = 0;
        entries.forEach(function (entry) {
            log.info(entry.filename);
            const baseFileName = entry.filename.split('.')[0];
            const extension = entry.filename.split('.')[1];
            if (extension === 'bin') {
                filesToLoad++;
                const grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g';
                module.inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
                const blobWriter = zipService.createBlobWriter();
                entry.getData(blobWriter, function (blob) {
                    const reader2 = new FileReader();
                    reader2.onload = function () {
                        // reader.result contains the contents of blob as a typed array
                        const byteArray = new Uint8Array(this.result);
                        if (grom) {
                            module.grom = byteArray;
                        } else {
                            module.rom = byteArray;
                        }
                        filesToLoad--;
                        if (filesToLoad <= 0) {
                            subject.next(module);
                        }
                    };
                    reader2.readAsArrayBuffer(blob);
                });
            }
        });
    }

    loadBinModuleFromFile(file: File): Observable<Software> {
        const subject = new Subject<Software>();
        const baseFileName = file.name.split('.')[0];
        const inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
        const grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g';
        const reader = new FileReader();
        reader.onload = function () {
            const byteArray = new Uint8Array(this.result);
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

    loadJSONModuleFromURL(url): Observable<Software> {
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

    private static hexArrayToByteArray(hexArray) {
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
}
