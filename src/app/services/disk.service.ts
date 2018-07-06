import {Injectable} from '@angular/core';
import {Log} from '../classes/log';
import {DiskDrive} from '../emulator/classes/diskdrive';
import {ZipService} from './zip.service';
import {CommandDispatcherService} from './command-dispatcher.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {ObjectLoaderService} from './object-loader.service';
import {DiskImage, DiskImageEvent} from '../emulator/classes/diskimage';
import {EventDispatcherService} from './event-dispatcher.service';
import {saveAs} from 'file-saver';

@Injectable()
export class DiskService {

    private log: Log = Log.getLog();

    constructor(
        private zipService: ZipService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private objectLoaderService: ObjectLoaderService) {
    }

    createDefaultDiskImages(): DiskImage[] {
        return [
            this.createDiskImage('Floppy disk A'),
            this.createDiskImage('Floppy disk B'),
            this.createDiskImage('Floppy disk C')
        ];
    }

    createDiskImage(name: string): DiskImage {
        return new DiskImage(name, this.onDiskImageChanged.bind(this));
    }

    onDiskImageChanged(event: DiskImageEvent) {
       this.eventDispatcherService.diskImageChanged(event.diskImage);
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
                    // Single file (DSK image, TIFILE, V9T9)
                    service.loadDiskFile(file.name, file, diskDrive).subscribe(subject);
                }
            }
        }
        return subject.asObservable();
    }

    loadDiskFile(filename, file: File, diskDrive: DiskDrive): Observable<DiskImage> {
        const subject = new Subject<DiskImage>();
        const reader = new FileReader();
        const service = this;
        reader.onload = function () {
            // reader.result contains the contents of blob as a typed array
            const fileBuffer = new Uint8Array(this.result);
            let diskImage;
            if (fileBuffer.length >= 16 && fileBuffer[0x0D] === 0x44 && fileBuffer[0x0E] === 0x53 && fileBuffer[0x0F] === 0x4B) {
                diskImage = diskDrive.loadDSKFile(filename, fileBuffer, service.onDiskImageChanged.bind(service));
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

    addDisk() {
    }

    insertDisk(index: number) {
    }

    removeDisk(index: number) {
    }

    deleteFiles() {
    }

    saveDiskImage(diskImage: DiskImage) {
        const imageFile = diskImage.getBinaryImage();
        const blob = new Blob([imageFile], { type: "application/octet-stream" });
        saveAs(blob, diskImage.getName() + ".dsk");
    }
}
