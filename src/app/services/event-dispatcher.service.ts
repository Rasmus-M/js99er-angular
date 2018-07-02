import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ControlEvent, ControlEventType} from '../classes/controlEvent';
import {TI994A} from '../emulator/classes/ti994a';
import index from '@angular/cli/lib/cli';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';

@Injectable({
    providedIn: 'root'
})
export class EventDispatcherService {

    private eventSubject: Subject<ControlEvent> = new Subject<ControlEvent>();

    private eventObservable: Observable<ControlEvent> = this.eventSubject.asObservable();

    constructor() {
    }

    subscribe(handler: (event: ControlEvent) => void): Subscription {
        return this.eventObservable.subscribe(handler);
    }

    ready(ti994A: TI994A) {
        this.eventSubject.next(new ControlEvent(ControlEventType.READY, ti994A));
    }

    started() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STARTED, {}));
    }

    stopped() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STOPPED, {}));
    }

    screenshot(dataURL: string) {
        this.eventSubject.next(new ControlEvent(ControlEventType.SCREENSHOT, dataURL));
    }

    diskImageChanged(diskImage: DiskImage) {
        this.eventSubject.next(new ControlEvent(ControlEventType.DISK_IMAGE_CHANGED, diskImage));
    }

    diskDriveChanged(diskDrive: DiskDrive, diskImage: DiskImage) {
        this.eventSubject.next(new ControlEvent(ControlEventType.DISK_DRIVE_CHANGED, {diskDrive: diskDrive, diskImage: diskImage}));
    }
}
