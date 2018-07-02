import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {DiskImage} from '../../emulator/classes/diskimage';
import * as $ from "jquery";
import {DiskFile} from '../../emulator/classes/diskfile';
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../../classes/command';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ControlEvent, ControlEventType} from '../../classes/controlEvent';
import {DiskService} from '../../services/disk.service';

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

    onEvent(event: ControlEvent) {
        switch (event.type) {
            case ControlEventType.DISK_IMAGE_CHANGED:
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
