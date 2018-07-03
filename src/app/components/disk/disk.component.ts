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

    diskImageIndex = 0;
    driveIndex = 0;
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
        this.onDiskImageChanged(this.diskImageIndex);
    }

    ngAfterViewInit() {
        const select = this.element.nativeElement.querySelector(".selectpicker");
        $(select).selectpicker({iconBase: 'fa'});
    }

    onDiskImageChanged(index) {
        const filesObject = this.diskImages[index].getFiles();
        const files = [];
        for (const name in filesObject) {
            if (filesObject.hasOwnProperty(name)) {
                files.push(filesObject[name]);
            }
        }
        console.log(files);
        this.diskFiles = files;
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                break;
            case ConsoleEventType.DISK_IMAGE_CHANGED:
                const diskImage = event.data;
                const index = this.diskImages.indexOf(diskImage);
                if (index !== -1) {
                    this.onDiskImageChanged(index);
                }
                break;
        }
    }

    save() {
        this.diskService.saveDiskImage(this.diskImages[this.diskImageIndex]);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
