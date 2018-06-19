import {Injectable} from '@angular/core';
import {Log} from '../classes/log';
import { zip } from 'beta-dev-zip';
import {DiskDrive} from '../emulator/classes/disk';
import {ObjLoader} from '../classes/obj-loader';

@Injectable()
export class DiskService {

    private log: Log = Log.getLog();

    constructor() {
    }

    loadDiskFiles(files, diskDrive: DiskDrive) {
        const log = this.log;
        const service = this;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file != null) {
                const extension = file.name.split('.').pop();
                if (extension != null && extension.toLowerCase() === 'zip') {
                    zip.createReader(new zip.BlobReader(file), function (zipReader) {
                        zipReader.getEntries(function (entries) {
                            entries.forEach(function (entry) {
                                if (!entry.directory) {
                                    loadFile(entry);
                                }
                            });

                            function loadFile(entry) {
                                const blobWriter = new zip.BlobWriter();
                                entry.getData(blobWriter, function (blob) {
                                    service.loadTIFile(entry.filename, blob, diskDrive);
                                });
                            }
                        });
                    }, function (message) {
                        log.error(message);
                    });
                } else if (extension != null && extension.toLowerCase() === 'obj') {
                    log.info('Loading object file.');
                    const reader = new FileReader();
                    reader.onload = function () {
                        const objLoader = new ObjLoader();
                        objLoader.loadObjFile(this.result);
                        // ti994a.loadSoftware(objLoader.getSoftware());
                        // ti994a.memory.setPADWord(0x83C0, Math.floor(Math.random() * 0xFFFF));
                    };
                    reader.onerror = function () {
                        alert(reader.error.name);
                    };
                    reader.readAsText(file);
                } else {
                    service.loadTIFile(file.name, file, diskDrive);
                }
            }
        }
        // updateDiskImageList();
    }

    loadTIFile(filename, file, diskDrive: DiskDrive) {
        const reader = new FileReader();
        reader.onload = function () {
            // reader.result contains the contents of blob as a typed array
            const fileBuffer = new Uint8Array(this.result);
            let diskImage;
            if (fileBuffer.length >= 16 && fileBuffer[0x0D] === 0x44 && fileBuffer[0x0E] === 0x53 && fileBuffer[0x0F] === 0x4B) {
                diskImage = diskDrive.loadDSKFile(filename, fileBuffer);
                if (diskImage) {
                    // diskImages[diskImage.getName()] = diskImage;
                    // updateDiskImageList(diskImage.getName());
                    diskImage.setEventHandler(
                        function (event) {
                            // updateDiskImageList(diskImage.getName());
                        }
                    );
                }
            } else {
                diskImage = diskDrive.getDiskImage();
                if (diskImage != null) {
                    diskImage.loadTIFile(filename, fileBuffer, false);
                }
            }
        };
        reader.onerror = function () {
            alert(reader.error.name);
        };
        reader.readAsArrayBuffer(file);
    }
}
