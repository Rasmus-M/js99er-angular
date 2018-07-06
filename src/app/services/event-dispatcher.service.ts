import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../classes/consoleevent';
import {TI994A} from '../emulator/classes/ti994a';
import index from '@angular/cli/lib/cli';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';

@Injectable({
    providedIn: 'root'
})
export class EventDispatcherService {

    private eventSubject: Subject<ConsoleEvent> = new Subject<ConsoleEvent>();

    private eventObservable: Observable<ConsoleEvent> = this.eventSubject.asObservable();

    constructor() {
    }

    subscribe(handler: (event: ConsoleEvent) => void): Subscription {
        return this.eventObservable.subscribe(handler);
    }

    ready(ti994A: TI994A) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.READY, ti994A));
    }

    started() {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.STARTED, {}));
    }

    stopped() {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.STOPPED, {}));
    }

    screenshot(dataURL: string) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.SCREENSHOT_TAKEN, dataURL));
    }

    diskChanged(diskImage: DiskImage) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.DISK_MODIFIED, diskImage));
    }

    diskAdded(diskImage: DiskImage) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.DISK_ADDED, {diskImage: diskImage}));
    }

    diskInserted(diskDrive: DiskDrive, diskImage: DiskImage) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.DISK_INSERTED, {diskDrive: diskDrive, diskImage: diskImage}));
    }

    diskRemoved(diskImage: DiskImage) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.DISK_REMOVED, {diskImage: diskImage}));
    }

    diskDeleted(diskImage: DiskImage) {
        this.eventSubject.next(new ConsoleEvent(ConsoleEventType.DISK_DELETED, {diskImage: diskImage}));
    }
}
