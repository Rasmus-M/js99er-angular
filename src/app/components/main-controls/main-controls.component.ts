import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {
    faArrowCircleLeft,
    faArrowCircleRight,
    faCamera,
    faCircle,
    faCreditCard,
    faEye,
    faEyeSlash,
    faFastForward,
    faForward,
    faLock,
    faMousePointer,
    faPlay,
    faSave,
    faStepForward,
    faStop,
    faSyncAlt,
    faUnlock
} from '@fortawesome/free-solid-svg-icons';
import {Util} from "../../classes/util";

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements OnInit, OnDestroy {

    running = false;
    runningFast = false;
    recording = false;
    sidePanelVisible = true;
    pointerLocked = false;

    driveIndex = 0;

    recIcon = faCircle;
    startIcon = faPlay;
    fastIcon = faForward;
    frameIcon = faFastForward;
    stepIcon = faStepForward;
    stopIcon = faStop;
    resetIcon = faSyncAlt;
    openModuleIcon = faCreditCard;
    openDiskIcon = faSave;
    screenshotIcon = faCamera;
    saveStateIcon = faArrowCircleRight;
    restoreStateIcon = faArrowCircleLeft;
    showSidePanelIcon = faEye;
    hideSidePanelIcon = faEyeSlash;
    pointerLockIcon = faLock;
    pointerUnlockIcon = faUnlock;
    mousePointerIcon = faMousePointer;

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
        if (files && files.length) {
            this.commandDispatcherService.loadModule(files);
            fileInput.value = "";
        }
    }

    openDisk(fileInput: HTMLInputElement) {
        const files = Util.fileListToFileArray(fileInput.files);
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

    toggleSidePanel() {
        this.sidePanelVisible = !this.sidePanelVisible;
        this.commandDispatcherService.toggleSidePanel(this.sidePanelVisible);
    }

    togglePointerLock() {
        this.commandDispatcherService.requestPointerLock();
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
            case ConsoleEventType.POINTER_LOCKED:
                this.pointerLocked = true;
                break;
            case ConsoleEventType.POINTER_UNLOCKED:
                this.pointerLocked = false;
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

    download(url: string, fileName: string) {
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
