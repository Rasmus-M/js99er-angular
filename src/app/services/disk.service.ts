import {Injectable} from '@angular/core';
import {Log} from '../classes/log';
import {DiskDrive, DiskImage} from '../emulator/classes/disk';
import {ZipService} from './zip.service';
import {CommandDispatcherService} from './command-dispatcher.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {ObjectLoaderService} from './object-loader.service';

@Injectable()
export class DiskService {

    private log: Log = Log.getLog();

    constructor(
        private zipService: ZipService,
        private commandDispatcherService: CommandDispatcherService,
        private objectLoaderService: ObjectLoaderService) {
    }

    loadDiskFiles(files: FileList, diskDrive: DiskDrive): Observable<DiskImage> {
        const subject = new Subject<DiskImage>();
        const log = this.log;
        const service = this;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file != null) {
                const extension = file.name.split('.').pop();
                if (extension != null && extension.toLowerCase() === 'zip') {
                    // Zip file
                    this.zipService.createReader(this.zipService.createBlobReader(file), function (zipReader) {
                        zipReader.getEntries(function (entries) {
                            entries.forEach(entry => {
                                if (!entry.directory) {
                                    const blobWriter = service.zipService.createBlobWriter();
                                    entry.getData(blobWriter, function (blob) {
                                        service.loadDiskFile(entry.filename, blob, diskDrive).subscribe(subject);
                                    });
                                }
                            });
                        });
                    }, function (message) {
                        log.error(message);
                        subject.error(message);
                    });
                } else if (extension != null && extension.toLowerCase() === 'obj') {
                    // Object file
                    log.info('Loading object file.');
                    const reader = new FileReader();
                    reader.onload = function () {
                        service.objectLoaderService.loadObjFile(reader.result);
                        service.commandDispatcherService.openSoftware(
                            service.objectLoaderService.getSoftware()
                        );
                        subject.next();
                    };
                    reader.onerror = function () {
                        subject.error(reader.error.name);
                    };
                    reader.readAsText(file);
                } else {
                    // Single file
                    service.loadDiskFile(file.name, file, diskDrive).subscribe(subject);
                }
            }
        }
        return subject.asObservable();
    }

    loadDiskFile(filename, file: File, diskDrive: DiskDrive): Observable<DiskImage> {
        const subject = new Subject<DiskImage>();
        const reader = new FileReader();
        reader.onload = function () {
            // reader.result contains the contents of blob as a typed array
            const fileBuffer = new Uint8Array(this.result);
            let diskImage;
            if (fileBuffer.length >= 16 && fileBuffer[0x0D] === 0x44 && fileBuffer[0x0E] === 0x53 && fileBuffer[0x0F] === 0x4B) {
                diskImage = diskDrive.loadDSKFile(filename, fileBuffer);
            } else {
                diskImage = diskDrive.getDiskImage();
                if (diskImage != null) {
                    diskImage.loadTIFile(filename, fileBuffer, false);
                }
            }
            subject.next(diskImage);
        };
        reader.onerror = function () {
            subject.error(reader.error.name);
        };
        reader.readAsArrayBuffer(file);
        return subject.asObservable();
    }
}
