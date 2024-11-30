import {Injectable} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {ConsoleEvent, ConsoleEventType} from '../classes/console-event';
import {DiskImage} from '../emulator/classes/disk-image';
import {DiskDrive} from '../emulator/classes/disk-drive';
import {Console} from "../emulator/interfaces/console";

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

    ready(ti994A: Console) {
        this.sendAsyncEvent(ConsoleEventType.READY, ti994A);
    }

    started(fast: boolean) {
        this.sendAsyncEvent(ConsoleEventType.STARTED, fast);
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

    tapeOpened(playEnabled: boolean) {
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

    settingsRestored() {
        this.sendAsyncEvent(ConsoleEventType.SETTINGS_RESTORED, null);
    }

    stateRestored() {
        this.sendAsyncEvent(ConsoleEventType.STATE_RESTORED, null);
    }

    recordingStarted() {
        this.sendAsyncEvent(ConsoleEventType.RECORDING_STARTED, null);
    }

    recordingStopped(recordings: Blob[]) {
        this.sendAsyncEvent(ConsoleEventType.RECORDING_STOPPED, recordings);
    }

    pointerLocked() {
        this.sendAsyncEvent(ConsoleEventType.POINTER_LOCKED, null);
    }

    pointerUnlocked() {
        this.sendAsyncEvent(ConsoleEventType.POINTER_UNLOCKED, null);
    }

    sendAsyncEvent(eventType: ConsoleEventType, data: any) {
        window.setTimeout(
            () => {
                this.eventSubject.next(new ConsoleEvent(eventType, data));
            }
        );
    }
}
