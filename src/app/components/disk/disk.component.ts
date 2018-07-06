import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {DiskImage} from '../../emulator/classes/diskimage';
import * as $ from "jquery";
import {DiskFile} from '../../emulator/classes/diskfile';
import {Subscription} from 'rxjs/Subscription';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {DiskService} from '../../services/disk.service';
import {TI994A} from '../../emulator/classes/ti994a';

@Component({
    selector: 'app-disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css']
})
export class DiskComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() diskImages: DiskImage[];

    diskImageDrives: string[] = [];
    diskImageIndex = 0;
    diskFiles: DiskFile[];

    private subscription: Subscription;
    private ti994A: TI994A;

    constructor(
        private element: ElementRef,
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
                this.onDiskImageChanged(this.diskImageIndex);
                break;
            case ConsoleEventType.DISK_IMAGE_CHANGED: {
                    const diskImage = event.data;
                    const index = this.diskImages.indexOf(diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                }
                break;
            case ConsoleEventType.DISK_DRIVE_CHANGED: {
                    const index = this.diskImages.indexOf(event.data.diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                    this.updateAllDiskImageDrives();
                }
                break;
        }
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
            this.ti994A.getDiskDrives().forEach((diskDrive) => {
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
    }

    insertDisk(index: number) {
    }

    removeDisk() {
    }

    deleteFiles() {
    }

    saveDisk() {
        this.diskService.saveDiskImage(this.diskImages[this.diskImageIndex]);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
