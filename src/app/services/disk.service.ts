import {Injectable} from '@angular/core';
import {Log} from '../classes/log';
import {DiskDrive} from '../emulator/classes/diskdrive';
import {CommandDispatcherService} from './command-dispatcher.service';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs';
import {ObjectLoaderService} from './object-loader.service';
import {DiskImage, DiskImageEvent} from '../emulator/classes/diskimage';
import {EventDispatcherService} from './event-dispatcher.service';
import saveAs from 'file-saver';
import {Command, CommandType} from '../classes/command';
import {ConsoleEvent, ConsoleEventType} from '../classes/consoleevent';
import {DiskFile} from '../emulator/classes/diskfile';
import {DatabaseService} from "./database.service";
import {forkJoin} from "rxjs";
import {BlobReader, BlobWriter, Entry, ZipReader} from "@zip.js/zip.js";

@Injectable()
export class DiskService {

    private diskImages: DiskImage[] = [];
    private diskImageCharCode = 65;
    private log: Log = Log.getLog();

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private objectLoaderService: ObjectLoaderService,
        private databaseService: DatabaseService
    ) {
        this.commandDispatcherService.subscribe(this.onCommand.bind(this));
        this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    createDefaultDiskImages(): DiskImage[] {
        for (let i = 0; i < 3; i++) {
            this.createDiskImage('Disk ' + String.fromCharCode(this.diskImageCharCode++));
        }
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

    loadDiskFiles(files: FileList, diskDrive: DiskDrive): Observable<DiskImage | null> {
        const subject = new Subject<DiskImage | null>();
        const service = this;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file != null) {
                const extension = file.name.split('.').pop();
                if (extension != null && extension.toLowerCase() === 'zip') {
                    // Zip file
                    new ZipReader(new BlobReader(file)).getEntries().then(
                        (entries: Entry[]) => {
                            const observables: Observable<DiskImage>[] = [];
                            entries.forEach(entry => {
                                if (!entry.directory) {
                                    observables.push(service.loadDiskFileFromZipEntry(entry, diskDrive));
                                }
                            });
                            forkJoin(observables).subscribe(
                                (diskImages: DiskImage[]) => {
                                    subject.next(diskImages.length ? diskImages[0] : null);
                                },
                                (message) => {
                                    this.log.error(message);
                                    subject.error(message);
                                }
                            );
                        }
                    ).catch(
                        (message) => {
                            this.log.error(message);
                            subject.error(message);
                        }
                    );
                } else if (extension != null && extension.toLowerCase() === 'obj') {
                    // Object file
                    this.log.info('Loading object file.');
                    const reader = new FileReader();
                    reader.onload = function () {
                        service.objectLoaderService.loadObjFile(reader.result as string);
                        service.commandDispatcherService.loadSoftware(
                            service.objectLoaderService.getSoftware()
                        );
                        subject.next(null);
                    };
                    reader.onerror = function () {
                        subject.error(reader.error?.name);
                    };
                    reader.readAsText(file);
                } else {
                    // Single file (DSK image, TIFILE, V9T9)
                    service.loadDiskFile(file.name, file, diskDrive, true).subscribe(subject);
                }
            }
        }
        return subject.asObservable();
    }

    loadDiskFileFromZipEntry(entry: Entry, diskDrive: DiskDrive): Observable<DiskImage> {
        const subject = new Subject<DiskImage>();
        entry.getData!(new BlobWriter()).then(
            (blob: Blob) => {
                this.loadDiskFile(entry.filename.split('/').pop() || '', blob, diskDrive, false).subscribe(subject);
            }
        );
        return subject.asObservable();
    }

    loadDiskFile(filename: string, file: Blob, diskDrive: DiskDrive, acceptDiskImage: boolean): Observable<DiskImage> {
        const subject = new Subject<DiskImage>();
        const reader = new FileReader();
        const service = this;
        reader.onload = function () {
            // reader.result contains the contents of blob as a typed array
            const fileBuffer = new Uint8Array(this.result as ArrayBuffer);
            let diskImage: DiskImage | null;
            if (acceptDiskImage && fileBuffer.length >= 16 && fileBuffer[0x0D] === 0x44 && fileBuffer[0x0E] === 0x53 && fileBuffer[0x0F] === 0x4B) {
                diskImage = diskDrive.loadDSKFile(filename, fileBuffer, service.onDiskImageChanged.bind(service));
            } else {
                diskImage = diskDrive.getDiskImage();
                if (!diskImage) {
                    diskImage = service.addDisk();
                    diskDrive.setDiskImage(diskImage);
                    service.eventDispatcherService.diskInserted(diskDrive, diskImage);
                }
                diskImage.loadTIFile(filename, fileBuffer, false);
            }
            subject.next(diskImage);
        };
        reader.onerror = function () {
            subject.error(reader.error?.name);
        };
        reader.readAsArrayBuffer(file);
        return subject.asObservable();
    }

    addDisk(): DiskImage {
        const diskImage: DiskImage = this.createDiskImage('Disk ' + String.fromCharCode(this.diskImageCharCode++));
        this.eventDispatcherService.diskAdded(diskImage);
        return diskImage;
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

    saveFiles(diskImage: DiskImage, diskFiles: DiskFile[]) {
        for (const diskFile of diskFiles) {
            const tiFile = diskImage.createTIFile(diskFile.getName());
            if (tiFile) {
                const blob = new Blob([tiFile], { type: "application/octet-stream" });
                saveAs(blob, diskFile.getName() + ".tifiles");
            }
        }
    }

    saveDiskImageAs(diskImage: DiskImage) {
        const imageFile = diskImage.createBinaryImage();
        const blob = new Blob([imageFile], { type: "application/octet-stream" });
        saveAs(blob, diskImage.getName() + ".dsk");
    }

    onCommand(command: Command) {
        switch (command.type) {
            case CommandType.ADD_DISK:
                this.addDisk();
                break;
            case CommandType.SAVE_DISK_FILES:
                this.saveFiles(command.data.diskImage, command.data.diskFiles);
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

    saveDiskImages(diskImages: DiskImage[]): Observable<void[]> {
        const observables: Observable<void>[] = [];
        diskImages.forEach((diskImage: DiskImage) => {
            observables.push(this.databaseService.putDiskImage(diskImage));
        });
        return forkJoin(observables);
    }

    saveDiskDrives(diskDrives: DiskDrive[]): Observable<void[]> {
        const observables: Observable<void>[] = [];
        diskDrives.forEach((diskDrive: DiskDrive) => {
            observables.push(this.databaseService.putDiskDrive(diskDrive));
        });
        return forkJoin(observables);
    }

    restoreDiskDrives(diskDrives: DiskDrive[], diskImages: DiskImage[]): Observable<void[]> {
        const observables: Observable<void>[] = [];
        diskDrives.forEach((diskDrive: DiskDrive) => {
            observables.push(this.restoreDiskDrive(diskDrive, diskImages));
        });
        return forkJoin(observables);
    }

    restoreDiskDrive(diskDrive: DiskDrive, diskImages: DiskImage[]): Observable<void> {
        const subject = new Subject<void>();
        this.databaseService.getDiskDrive(diskDrive.getName()).subscribe(
            (diskDriveState: any) => {
                if (diskDriveState) {
                    if (diskDriveState.diskImage) {
                        let diskImage: DiskImage | null = null;
                        for (let i = 0; i < diskImages.length && !diskImage; i++) {
                            if (diskImages[i].getName() === diskDriveState.diskImage) {
                                diskImage = diskImages[i];
                            }
                        }
                        diskDrive.setDiskImage(diskImage);
                        this.log.info("Disk image " + diskDrive.getDiskImage()?.getName() + " restored to " + diskDrive.getName() + ".");
                    } else {
                        diskDrive.setDiskImage(null);
                    }
                    subject.next();
                } else {
                    subject.error("Failed to restore disk drive " + diskDrive.getName());
                }
            }
        );
        return subject.asObservable();
    }
}
