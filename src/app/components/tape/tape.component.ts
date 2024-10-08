import {Component, OnDestroy, OnInit} from '@angular/core';
import {saveAs} from 'file-saver';
import {TI994A} from '../../emulator/classes/ti994a';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Subscription} from 'rxjs';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {Tape} from '../../emulator/classes/tape';
import {Log} from '../../classes/log';
import { faUpload, faDownload, faCircle, faPlay, faBackward, faStop } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'tape',
    templateUrl: './tape.component.html',
    styleUrls: ['./tape.component.css']
})
export class TapeComponent implements OnInit, OnDestroy {

    canRecord = true;
    canPlay = false;
    canRewind = false;
    canStop = false;

    private subscription: Subscription;
    private tape: Tape;
    private log: Log = Log.getLog();

    openTapeIcon = faUpload;
    saveTapeIcon = faDownload;
    recordIcon = faCircle;
    playIcon = faPlay;
    rewindIcon = faBackward;
    stopIcon = faStop;

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                const ti994A: TI994A = event.data;
                this.tape = ti994A.getTape();
                break;
            case ConsoleEventType.TAPE_OPENED:
                this.canRecord = true;
                this.canPlay = event.data;
                this.canRewind = false;
                this.canStop = false;
                break;
            case ConsoleEventType.TAPE_RECORDING:
                this.canRecord = false;
                this.canPlay = false;
                this.canRewind = false;
                this.canStop = true;
                break;
            case ConsoleEventType.TAPE_PLAYING:
                this.canRecord = false;
                this.canPlay = false;
                this.canRewind = false;
                this.canStop = true;
                break;
            case ConsoleEventType.TAPE_STOPPED:
                this.canRecord = true;
                this.canPlay = event.data.playEnabled;
                this.canRewind = event.data.rewindEnabled;
                this.canStop = false;
                break;
            case ConsoleEventType.TAPE_REWOUND:
                this.canRecord = true;
                this.canPlay = true;
                this.canRewind = false;
                this.canStop = false;
                break;
        }
    }

    openTape(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files && files.length) {
            const reader = new FileReader();
            const that = this;
            reader.onload = function () {
                that.commandDispatcherService.openTape(reader.result as ArrayBuffer);
            };
            reader.onerror = function () {
                if (reader.error) {
                    that.log.error(reader.error.name);
                }
            };
            reader.readAsArrayBuffer(files[0]);
            fileInput.value = "";
        }
    }

    saveTape() {
        if (this.tape.isRecordingAvailable()) {
            const tapeFile: ArrayBuffer = this.tape.getRecording();
            const blob = new Blob([tapeFile], {type: "application/octet-stream"});
            saveAs(blob, "tape.wav");
        } else {
            this.log.info("No recording available");
        }
    }

    record() {
        this.commandDispatcherService.recordTape();
    }

    play() {
        this.commandDispatcherService.playTape();
    }

    rewind() {
        this.commandDispatcherService.rewindTape();
    }

    stop() {
        this.commandDispatcherService.stopTape();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
