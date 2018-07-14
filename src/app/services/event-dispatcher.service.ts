import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../classes/consoleevent';
import {TI994A} from '../emulator/classes/ti994a';
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
        this.sendAsyncEvent(ConsoleEventType.READY, ti994A);
    }

    started() {
        this.sendAsyncEvent(ConsoleEventType.STARTED, null);
    }

    stopped() {
        this.sendAsyncEvent(ConsoleEventType.STOPPED, null);
    }

    screenshot(dataURL: string) {
        this.sendAsyncEvent(ConsoleEventType.SCREENSHOT_TAKEN, dataURL);
    }

    diskChanged(diskImage: DiskImage) {
        this.sendAsyncEvent(ConsoleEventType.DISK_MODIFIED, diskImage);
    }

    diskAdded(diskImage: DiskImage) {
        this.sendAsyncEvent(ConsoleEventType.DISK_ADDED, {diskImage: diskImage});
    }

    diskInserted(diskDrive: DiskDrive, diskImage: DiskImage) {
        this.sendAsyncEvent(ConsoleEventType.DISK_INSERTED, {diskDrive: diskDrive, diskImage: diskImage});
    }

    diskRemoved(diskDrive: DiskDrive, diskImage: DiskImage) {
        this.sendAsyncEvent(ConsoleEventType.DISK_REMOVED, {diskDrive: diskDrive, diskImage: diskImage});
    }

    diskDeleted(diskImage: DiskImage) {
        this.sendAsyncEvent(ConsoleEventType.DISK_DELETED, {diskImage: diskImage});
    }

    diskDriveChanged(diskDriveIndex: number) {
        this.sendAsyncEvent(ConsoleEventType.DISK_DRIVE_CHANGED, diskDriveIndex);
    }

    tapeOpened(playEnabled) {
        this.sendAsyncEvent(ConsoleEventType.TAPE_OPENED, playEnabled);
    }

    tapeRecording() {
        this.sendAsyncEvent(ConsoleEventType.TAPE_RECORDING, null);
    }

    tapeStopped(playEnabled: boolean, rewindEnabled: boolean) {
        this.sendAsyncEvent(ConsoleEventType.TAPE_STOPPED, {playEnabled: playEnabled, rewindEnabled: rewindEnabled});
    }

    tapePlaying() {
        this.sendAsyncEvent(ConsoleEventType.TAPE_PLAYING, null);
    }

    tapeRewound() {
        this.sendAsyncEvent(ConsoleEventType.TAPE_REWOUND, null);
    }

    sendAsyncEvent(eventType: ConsoleEventType, data: any) {
        window.setTimeout(
            () => {
                this.eventSubject.next(new ConsoleEvent(eventType, data));
            }
        );
    }
}
