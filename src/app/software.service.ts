import {MemoryBlock, Software, SoftwareType} from './classes/software';
import {Log} from './classes/log';
import {HttpClient} from '@angular/common/http';
import { zip } from 'beta-dev-zip';
import {Injectable} from '@angular/core';

@Injectable()
export class SoftwareService {

    private httpClient: HttpClient;
    private log: Log = Log.getLog();

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    getProgram(path, onReady) {
        const log = this.log;
        const pathParts = path.split('.');
        let programs = Software.PROGRAMS;
        for (let i = 0; i < pathParts.length && programs != null; i++) {
            if (i < pathParts.length - 1) {
                programs = programs[pathParts[i]].programs;
            } else {
                const program = programs[pathParts[i]];
                if (program != null) {
                    if (program.url != null) {
                        if (program.url.substr(program.url.length - 3).toLowerCase() === 'rpk') {
                            this.loadRPKModuleFromURL(program.url, onReady, function (msg) {
                                log.error(msg);
                            });
                        } else if (program.url.substr(program.url.length - 3).toLowerCase() === 'bin') {
                            this.loadBinModuleFromURL(program.url, onReady, function (msg) {
                                log.error(msg);
                            });
                        } else {
                            this.loadProgram(program.url, program, function (prg) {
                                program.url = null; // Mark as loaded
                                onReady(prg);
                            });
                        }
                    } else {
                        onReady(program);
                    }
                    return;
                }
            }
        }
        onReady(null);
    }

    loadProgram(url, program: Software, onReady) {
        const log = this.log;
        const self = this;
        this.httpClient.get(url).subscribe(
            (data: any) => {
                if (program == null) {
                    program = new Software({});
                }
                if (program.type == null) {
                    program.type = (data.inverted === 'true' ? SoftwareType.INVERTED_CART : SoftwareType.CART);
                } else if (program.type === SoftwareType.MEMORY_DUMP) {
                    program.startAddress = data.startAddress ? parseInt(data.startAddress, 10) : 0xA000;
                }
                if (data.rom != null) {
                    program.rom = self.hexArrayToByteArray(data.rom);
                }
                if (data.grom != null) {
                    program.grom = self.hexArrayToByteArray(data.grom);
                }
                if (data.groms != null) {
                    program.groms = [];
                    for (let g = 0; g < data.groms.length; g++) {
                        program.groms[g] = self.hexArrayToByteArray(data.groms[g]);
                    }
                }
                if (data.memoryBlocks != null) {
                    program.memoryBlocks = [];
                    for (let i = 0; i < data.memoryBlocks.length; i++) {
                        program.memoryBlocks[i] = new MemoryBlock(
                            parseInt(data.memoryBlocks[i].address, 10),
                            self.hexArrayToByteArray(data.memoryBlocks[i].data)
                        );
                    }
                }
                program.ramAt6000 = data.ramAt6000 === 'true';
                program.ramAt7000 = data.ramAt7000 === 'true';
                onReady(program);
            },
            error => {
                log.error(error);
                onReady(null);
            }
        );
    }

    private hexArrayToByteArray(hexArray) {
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

    loadRPKModuleFromFile(file, onSuccess, onError) {
        this.loadRPKModule(new zip.BlobReader(file), onSuccess, onError);
    }

    loadRPKModuleFromURL(url, onSuccess, onError) {
        this.loadRPKModule(new zip.HttpReader(url), onSuccess, onError);
    }

    loadRPKModule(reader, onSuccess, onError) {
        const log = Log.getLog();
        zip.createReader(reader, function (zipReader) {
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
                    const writer = new zip.TextWriter('ISO-8859-1');
                    layoutEntry.getData(writer, function (txt) {
                        // log.info(txt);
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(txt, 'text/xml');
                        const sw: Software = new Software({
                            ramAt6000: false,
                            ramAt7000: false
                        });
                        const pcb = xmlDoc.getElementsByTagName('pcb')[0];
                        const pcbType = pcb.getAttribute('type').toLowerCase();
                        sw.type = pcbType === 'paged379i' ? SoftwareType.INVERTED_CART : SoftwareType.CART;
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
                            // log.info("ROM " + romId + " (" + socketId + "): " + filename);
                            loadFile(entries, filename, romId, socketId, pcbType);
                        }

                        function loadFile(_entries, filename, romId, socketId, _pcbType) {
                            _entries.forEach(function (entry) {
                                if (entry.filename === filename) {
                                    const blobWriter = new zip.BlobWriter();
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
                                                sw.rom = new Uint8Array(rom);
                                            } else if (socketId.substr(0, 4).toLowerCase() === 'grom') {
                                                log.info('GROM ' + romId + ' (' + socketId + '): \'' + filename + '\', ' + plainArray.length + ' bytes');
                                                sw.grom = byteArray;
                                            }
                                            filesToLoad--;
                                            if (filesToLoad === 0) {
                                                onSuccess(sw);
                                            }
                                        };
                                        reader2.readAsArrayBuffer(blob);
                                    });
                                }
                            });
                        }
                    });
                } else {
                    // Plain zip file
                    const sw: Software = new Software({
                        ramAt6000: false,
                        ramAt7000: false
                    });
                    let filesToLoad = 0;
                    entries.forEach(function (entry) {
                        log.info(entry.filename);
                        const baseFileName = entry.filename.split('.')[0];
                        const extension = entry.filename.split('.')[1];
                        if (extension === 'bin') {
                            filesToLoad++;
                            const grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g';
                            const inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
                            sw.type = inverted ? SoftwareType.INVERTED_CART : SoftwareType.CART;
                            const blobWriter = new zip.BlobWriter();
                            entry.getData(blobWriter, function (blob) {
                                const reader2 = new FileReader();
                                reader2.onload = function () {
                                    // reader.result contains the contents of blob as a typed array
                                    const byteArray = new Uint8Array(this.result);
                                    if (grom) {
                                        sw.grom = byteArray;
                                    } else {
                                        sw.rom = byteArray;
                                    }
                                    filesToLoad--;
                                    if (filesToLoad <= 0) {
                                        onSuccess(sw);
                                    }
                                };
                                reader2.readAsArrayBuffer(blob);
                            });
                        }
                    });
                }
            });
        }, function (message) {
            if (onError) {
                onError(message);
            }
        });
    }

    loadBinModuleFromURL(url, onSuccess, onError) {
        const baseFileName = url.split('.')[0];
        const inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            const byteArray = new Uint8Array(xhr.response);
            const cart = {
                type: inverted ? SoftwareType.INVERTED_CART : SoftwareType.CART,
                rom: byteArray
            };
            onSuccess(cart);
        };
        xhr.send();
    }

    loadModuleFromBinFile(file, onSuccess, onError) {
        const baseFileName = file.name.split('.')[0];
        const inverted = baseFileName && baseFileName.charAt(baseFileName.length - 1) === '3';
        const grom = baseFileName && baseFileName.charAt(baseFileName.length - 1) === 'g';
        const reader = new FileReader();
        reader.onload = function () {
            const byteArray = new Uint8Array(this.result);
            let cart;
            if (grom) {
                cart = {
                    type: SoftwareType.CART,
                    grom: byteArray,
                    ramAt6000: false,
                    ramAt7000: false
                };
            } else {
                const ramPaged = (byteArray[3] === 0x52);
                cart = {
                    type: inverted ? SoftwareType.INVERTED_CART : SoftwareType.CART,
                    rom: byteArray,
                    ramAt6000: false,
                    ramAt7000: ramPaged,
                    ramPaged: ramPaged
                };
            }
            onSuccess(cart);
        };
        reader.onerror = function () {
            if (onError) {
                onError(reader.error);
            }
        };
        reader.readAsArrayBuffer(file);
    }
}
