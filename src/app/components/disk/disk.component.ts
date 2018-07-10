import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import * as $ from "jquery";
import 'bootstrap';
import 'bootstrap-select';
import {DiskImage} from '../../emulator/classes/diskimage';
import {DiskFile} from '../../emulator/classes/diskfile';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {DiskService} from '../../services/disk.service';
import {TI994A} from '../../emulator/classes/ti994a';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {DiskDrive} from '../../emulator/classes/diskdrive';

@Component({
    selector: 'app-disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css']
})
export class DiskComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() diskImages: DiskImage[];

    diskDrives: DiskDrive[];
    diskImageDrives: string[] = [];
    driveIndex = 0;
    diskImageIndex = 0;
    diskFiles: DiskFile[];

    private subscription: Subscription;
    private ti994A: TI994A;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private diskService: DiskService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    ngAfterViewInit() {
        const select = this.element.nativeElement.querySelector(".selectpicker");
        $(select).selectpicker({iconBase: 'fa'});
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                this.diskDrives = this.ti994A.getDiskDrives();
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

    onDriveIndexChanged(index) {
        this.eventDispatcherService.diskDriveChanged(this.driveIndex);
    }

    onDiskImageChanged(index) {
        this.diskImageIndex = index;
        const filesObject = this.diskImages[index].getFiles();
        const files = [];
        for (const name in filesObject) {
            if (filesObject.hasOwnProperty(name)) {
                files.push(filesObject[name]);
            }
        }
        this.diskFiles = files;
        this.updateAllDiskImageDrives();
    }

    private updateAllDiskImageDrives() {
        for (let i = 0; i < this.diskImages.length; i++) {
            this.diskImageDrives[i] = this.updateDiskImageDrives(this.diskImages[i]);
        }
    }

    private updateDiskImageDrives(diskImage: DiskImage): string {
        let s = "";
        if (this.ti994A) {
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

    addDisk() {
        this.commandDispatcherService.addDisk();
    }

    insertDisk(index: number) {
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
}
