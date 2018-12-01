import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements OnInit, OnDestroy {

    running = false;
    runningFast = false;
    recording = false;

    driveIndex = 0;

    private subscription: Subscription;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {}

    ngOnInit(): void {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    start() {
        this.commandDispatcherService.start();
    }

    fast() {
        this.commandDispatcherService.fast();
    }

    frame() {
        this.commandDispatcherService.frame();
    }

    step(event: MouseEvent) {
        if (event.shiftKey) {
            this.commandDispatcherService.stepOver();
        } else {
            this.commandDispatcherService.step();
        }
    }

    stop() {
        this.commandDispatcherService.stop();
        if (this.recording) {
            this.commandDispatcherService.stopRecording();
        }
    }

    reset() {
        this.commandDispatcherService.reset();
    }

    openModule(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {
            this.commandDispatcherService.loadModule(files[0]);
            fileInput.value = "";
        }
    }

    openDisk(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {
            this.commandDispatcherService.loadDisk(this.driveIndex, files);
            fileInput.value = "";
        }
    }

    screenshot() {
        this.commandDispatcherService.screenshot();
    }

    saveState() {
        this.commandDispatcherService.saveState();
    }

    restoreState() {
        this.commandDispatcherService.restoreState();
    }

    record() {
        this.commandDispatcherService.startRecording();
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.STARTED:
                this.running = true;
                this.runningFast = event.data;
                break;
            case ConsoleEventType.STOPPED:
                this.running = false;
                break;
            case ConsoleEventType.SCREENSHOT_TAKEN:

                this.download(event.data, "js99er-" + this.getDateTime() + ".png");
                break;
            case ConsoleEventType.DISK_DRIVE_CHANGED:
                this.driveIndex = event.data;
                break;
            case ConsoleEventType.RECORDING_STARTED:
                this.recording = true;
                break;
            case ConsoleEventType.RECORDING_STOPPED:
                this.recording = false;
                const recordings: Blob[] = event.data;
                const blob = new Blob(recordings, {
                    type: 'video/webm'
                });
                const url = URL.createObjectURL(blob);
                this.download(url, "js99er-" + this.getDateTime() + ".webm");
                break;
        }
    }

    getDateTime() {
        const date = new Date();
        return date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, "0") +
            date.getDate().toString().padStart(2, "0") +
            date.getHours().toString().padStart(2, "0") +
            date.getMinutes().toString().padStart(2, "0") +
            date.getSeconds().toString().padStart(2, "0");
    }

    download(url, fileName) {
        const a = this.element.nativeElement.querySelector("#download-link");
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
