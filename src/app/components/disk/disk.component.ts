import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {DiskImage} from '../../emulator/classes/diskimage';
import {DiskFile} from '../../emulator/classes/diskfile';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {TI994A} from '../../emulator/classes/ti994a';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {DiskDrive} from '../../emulator/classes/diskdrive';

@Component({
    selector: 'app-disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css']
})
export class DiskComponent implements OnInit, OnDestroy {

    @Input() diskImages: DiskImage[];

    diskDrives: DiskDrive[];
    diskImageDrives: string[] = [];
    driveIndex = 0;
    diskImageIndex = 0;
    diskFiles: DiskFile[];
    displayedColumns = ['fileName', 'fileType', 'dataType', 'recordType', 'recordLength', 'fileSize'];

    private subscription: Subscription;

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                const ti994A: TI994A = event.data;
                this.diskDrives = ti994A.getDiskDrives();
                this.onDiskImageChanged(this.diskImageIndex);
                break;
            case ConsoleEventType.DISK_MODIFIED: {
                    const diskImage = event.data;
                    const index = this.diskImages.indexOf(diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                }
                break;
            case ConsoleEventType.DISK_INSERTED: {
                    const index = this.diskImages.indexOf(event.data.diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                    this.updateAllDiskImageDrives();
                }
                break;
            case ConsoleEventType.DISK_ADDED:
                this.updateAllDiskImageDrives();
                break;
            case ConsoleEventType.DISK_REMOVED:
                this.updateAllDiskImageDrives();
                break;
            case ConsoleEventType.DISK_DELETED:
                this.updateAllDiskImageDrives();
                break;
        }
    }

    onDriveIndexChanged(index: number) {
        this.driveIndex = index;
        console.log("driveIndex=" + this.driveIndex);
        this.eventDispatcherService.diskDriveChanged(this.driveIndex);
    }

    onDiskImageChanged(index: number) {
        this.diskImageIndex = index;
        console.log("diskImageIndex=" + this.diskImageIndex);
        const files = [];
        if (index >= 0) {
            const filesObject = this.diskImages[index].getFiles();
            for (const name in filesObject) {
                if (filesObject.hasOwnProperty(name)) {
                    files.push(filesObject[name]);
                }
            }
        }
        this.diskFiles = files;
        this.updateAllDiskImageDrives();
    }

    addDisk() {
        this.commandDispatcherService.addDisk();
    }

    insertDisk() {
        const index = this.diskImageIndex;
        if (index >= 0) {
            this.commandDispatcherService.insertDisk(this.diskDrives[index], this.diskImages[this.diskImageIndex]);
        } else {
            this.commandDispatcherService.removeDisk(this.diskDrives[index], this.diskImages[this.diskImageIndex]);
        }
    }

    deleteDisk() {
        this.commandDispatcherService.deleteDisk(this.diskImages[this.diskImageIndex]);
    }

    deleteFiles() {
    }

    saveDisk() {
        this.commandDispatcherService.saveDisk(this.diskImages[this.diskImageIndex]);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private updateAllDiskImageDrives() {
        for (let i = 0; i < this.diskImages.length; i++) {
            this.diskImageDrives[i] = this.updateDiskImageDrives(this.diskImages[i]);
        }
    }

    private updateDiskImageDrives(diskImage: DiskImage): string {
        let s = "";
        if (this.diskDrives) {
            this.diskDrives.forEach((diskDrive) => {
                if (diskDrive.getDiskImage() === diskImage) {
                    s += (s.length > 0 ? ", " : "") + diskDrive.getName();
                }
            });
            if (s.length > 0) {
                s = "(in " + s + ")";
            }
        }
        return s;
    }
}
