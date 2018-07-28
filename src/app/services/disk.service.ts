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
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../classes/command';
import {ConsoleEvent, ConsoleEventType} from '../classes/consoleevent';
import {DiskFile} from '../emulator/classes/diskfile';
import {DatabaseService} from "./database.service";

@Injectable()
export class DiskService {

    private diskImages: DiskImage[] = [];
    private commandSubscription: Subscription;
    private eventSubscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private zipService: ZipService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private objectLoaderService: ObjectLoaderService,
        private databaseService: DatabaseService
    ) {
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    createDefaultDiskImages(): DiskImage[] {
        this.createDiskImage('Floppy disk A');
        this.createDiskImage('Floppy disk B');
        this.createDiskImage('Floppy disk C');
        return this.diskImages;
    }

    createDiskImage(name: string): DiskImage {
        const diskImage = new DiskImage(name, this.onDiskImageChanged.bind(this));
        this.diskImages.push(diskImage);
        return diskImage;
    }

    onDiskImageChanged(event: DiskImageEvent) {
       this.eventDispatcherService.diskChanged(event.diskImage);
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
                        service.commandDispatcherService.loadSoftware(
                            service.objectLoaderService.getSoftware(), false
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
        const diskImage: DiskImage = this.createDiskImage("New disk");
        this.eventDispatcherService.diskAdded(diskImage);
    }

    deleteDisk(diskImage: DiskImage) {
        const index = this.diskImages.indexOf(diskImage);
        if (index !== -1) {
            this.diskImages.splice(index, 1);
            this.eventDispatcherService.diskDeleted(diskImage);
        }
    }

    deleteFiles(diskImage: DiskImage, diskFiles: DiskFile[]) {
        diskFiles.forEach((diskFile: DiskFile) => {
            diskImage.deleteFile(diskFile.getName());
        });
        this.eventDispatcherService.diskChanged(diskImage);
    }

    saveDiskImageAs(diskImage: DiskImage) {
        const imageFile = diskImage.getBinaryImage();
        const blob = new Blob([imageFile], { type: "application/octet-stream" });
        saveAs(blob, diskImage.getName() + ".dsk");
    }

    onCommand(command: Command) {
        switch (command.type) {
            case CommandType.ADD_DISK:
                this.addDisk();
                break;
            case CommandType.SAVE_DISK:
                this.saveDiskImageAs(command.data);
                break;
            case CommandType.DELETE_DISK:
                this.deleteDisk(command.data);
                break;
            case CommandType.DELETE_DISK_FILES:
                this.deleteFiles(command.data.diskImage, command.data.diskFiles);
                break;
        }
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.DISK_INSERTED:
                const diskImage: DiskImage = event.data.diskImage;
                if (this.diskImages.indexOf(diskImage) === -1) {
                    this.diskImages.push(diskImage);
                }
                break;
        }
    }

    saveDiskImages(diskImages: DiskImage[], index: number, callback: (boolean) => void) {
        const that = this;
        if (index === diskImages.length) {
            callback(true);
            return;
        }
        const diskImage = diskImages[index];
        this.databaseService.putDiskImage(diskImage, function (ok) {
            if (ok) {
                that.saveDiskImages(diskImages, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }

    saveDiskDrives(diskDrives: DiskDrive[], index: number, callback) {
        const that = this;
        if (index === diskDrives.length) {
            callback(true);
            return;
        }
        const diskDrive = diskDrives[index];
        this.databaseService.putDiskDrive(diskDrive, function (ok) {
            if (ok) {
                that.saveDiskDrives(diskDrives, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }

    restoreDiskDrives(diskDrives: DiskDrive[], diskImages: DiskImage[], index: number, callback: (boolean) => void) {
        const that = this;
        if (index === diskDrives.length) {
            callback(true);
            return;
        }
        const diskDriveName = diskDrives[index].getName();
        this.databaseService.getDiskDrive(diskDriveName, function (diskDriveState) {
            if (diskDriveState) {
                if (diskDriveState.diskImage) {
                    let diskImage: DiskImage = null;
                    for (let i = 0; i < diskImages.length && !diskImage; i++) {
                        if (diskImages[i].getName() === diskDriveState.diskImage) {
                            diskImage = diskImages[i];
                        }
                    }
                    diskDrives[index].setDiskImage(diskImage);
                    that.log.info("Disk image " + diskDrives[index].getDiskImage().getName() + " restored to " + diskDrives[index].getName() + ".");
                } else {
                    diskDrives[index].setDiskImage(null);
                }
                that.restoreDiskDrives(diskDrives, diskImages, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }
}
