import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {DiskImage} from '../classes/diskimage';
import {Setting} from '../../classes/settings';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../../classes/command';
import {ModuleService} from '../../services/module.service';
import {Log} from '../../classes/log';
import {DiskService} from '../../services/disk.service';
import {SettingsService} from '../../services/settings.service';
import * as $ from 'jquery';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {CPU} from '../interfaces/cpu';
import {DiskDrive} from '../classes/diskdrive';
import {Tape} from '../classes/tape';
import {Software} from '../../classes/software';
import {ConsoleFactoryService} from "../services/console-factory.service";
import {Console} from "../interfaces/console";
import {AudioService} from "../../services/audio.service";

@Component({
    selector: 'app-console',
    templateUrl: './console.component.html',
    styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() diskImages: DiskImage[];

    private ti994A: Console;
    private canvas: HTMLCanvasElement;
    // @ts-ignore
    private mediaRecorder: MediaRecorder;
    private recordings: Blob[];
    private subscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private softwareService: ModuleService,
        private diskService: DiskService,
        private settingsService: SettingsService,
        private consoleFactoryService: ConsoleFactoryService,
        private audioService: AudioService
    ) {
    }

    ngOnInit() {
        this.subscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
    }

    ngAfterViewInit() {
        this.canvas = this.element.nativeElement.querySelector('canvas');
        $(this.canvas).toggleClass("pixelated", this.settingsService.isPixelatedEnabled());
        this.ti994A = this.consoleFactoryService.create(document, this.canvas, this.diskImages, this.settingsService.getSettings(), this.onBreakpoint.bind(this));
        this.eventDispatcherService.ready(this.ti994A);
    }

    reset() {
        this.ti994A.reset(true);
        this.ti994A.start(false);
        this.eventDispatcherService.started(false);
    }

    start(fast: boolean) {
        this.ti994A.start(fast);
        this.eventDispatcherService.started(fast);
    }

    frame() {
        this.ti994A.frame();
        this.eventDispatcherService.stopped();
    }

    step() {
        this.ti994A.step();
        this.eventDispatcherService.stopped();
    }

    stepOver() {
        this.ti994A.stepOver();
        this.eventDispatcherService.stopped();
    }

    stop() {
        this.ti994A.stop();
        this.eventDispatcherService.stopped();
    }

    onCommand(command: Command) {
        switch (command.type) {
            case CommandType.START:
                this.start(false);
                break;
            case CommandType.FAST:
                this.start(true);
                break;
            case CommandType.FRAME:
                this.frame();
                break;
            case CommandType.STEP:
                this.step();
                break;
            case CommandType.STEP_OVER:
                this.stepOver();
                break;
            case CommandType.STOP:
                this.stop();
                break;
            case CommandType.RESET:
                this.reset();
                break;
            case CommandType.LOAD_MODULE:
                this.softwareService.loadModuleFromFile(command.data).subscribe(
                    (module) => {
                        this.ti994A.loadSoftware(module);
                    },
                    (error) => {
                        this.log.error(error);
                    }
                );
                break;
            case CommandType.LOAD_DISK: {
                    const data = command.data;
                    const diskDrive = this.ti994A.getDiskDrives()[data.driveIndex];
                    this.diskService.loadDiskFiles(data.files, diskDrive).subscribe(
                        (disk: DiskImage) => {
                            if (disk) {
                                this.eventDispatcherService.diskInserted(diskDrive, disk);
                                this.log.info(disk.getName() + " loaded to " + diskDrive.getName());
                            }
                        },
                        (error) => {
                            this.log.error(error);
                        }
                    );
                }
                break;
            case CommandType.LOAD_SOFTWARE: {
                    const software: Software = command.data.software;
                    this.ti994A.loadSoftware(software);
                    this.ti994A.getMemory().setPADWord(0x83C0, Math.floor(Math.random() * 0xFFFF));
                    this.ti994A.start(false);
                    this.eventDispatcherService.started(false);
                }
                break;
            case CommandType.UNLOAD_SOFTWARE:
                this.ti994A.loadSoftware(new Software());
                break;
            case CommandType.CHANGE_SETTING:
                const setting: Setting = command.data.setting;
                const value: boolean = command.data.value;
                let resetRequired = false;
                switch (setting) {
                    case Setting.SOUND:
                        // Handled by parent
                        break;
                    case Setting.SPEECH:
                        this.ti994A.getSpeech().setSpeechEnabled(value);
                        break;
                    case Setting.RAM32K:
                        this.ti994A.getMemory().set32KRAMEnabled(value);
                        break;
                    case Setting.F18A:
                        this.ti994A.setVDP();
                        resetRequired = true;
                        break;
                    case Setting.FLICKER:
                        this.ti994A.getVDP().setFlicker(value);
                        break;
                    case Setting.PC_KEYBOARD:
                        this.ti994A.getKeyboard().setPCKeyboardEnabled(value);
                        break;
                    case Setting.MAP_ARROW_KEYS:
                        this.ti994A.getKeyboard().setMapArrowKeysToFctnSDEXEnabled(value);
                        break;
                    case Setting.GOOGLE_DRIVE:
                        this.ti994A.setGoogleDrive();
                        resetRequired = true;
                        break;
                    case Setting.AMS:
                        this.ti994A.getMemory().setAMSEnabled(value);
                        resetRequired = true;
                        break;
                    case Setting.GRAM:
                        this.ti994A.getMemory().setGRAMEnabled(value);
                        break;
                    case Setting.PIXELATED:
                        $(this.canvas).toggleClass("pixelated", value);
                        break;
                    case Setting.PAUSE_ON_FOCUS_LOST:
                        // Handled by main component
                        break;
                    case Setting.TIPI:
                        this.ti994A.getMemory().setTIPIEnabled(value);
                        this.ti994A.setTIPI();
                        resetRequired = true;
                        break;
                    case Setting.TIPI_WEBSOCKET_URI:
                        this.ti994A.setTIPI();
                        resetRequired = this.settingsService.isTIPIEnabled();
                        break;
                }
                if (resetRequired) {
                    this.reset();
                }
                break;
            case CommandType.PRESS_KEY:
                this.ti994A.getKeyboard().virtualKeyPress(command.data);
                break;
            case CommandType.TAKE_SCREENSHOT:
                this.eventDispatcherService.screenshot(this.canvas.toDataURL());
                break;
            case CommandType.SET_BREAKPOINT:
                const addr = command.data;
                this.ti994A.getCPU().setBreakpoint(addr);
                const gpu = this.ti994A.getVDP().getGPU();
                if (gpu) {
                    gpu.setBreakpoint(addr);
                }
                break;
            case CommandType.INSERT_DISK: {
                    const diskDrive: DiskDrive = this.ti994A.getDiskDrives()[command.data.driveIndex];
                    const diskImage: DiskImage = command.data.diskImage;
                    diskDrive.setDiskImage(diskImage);
                    this.eventDispatcherService.diskInserted(diskDrive, diskImage);
                }
                break;
            case CommandType.REMOVE_DISK: {
                    const diskDrive: DiskDrive = this.ti994A.getDiskDrives()[command.data];
                    const diskImage = diskDrive.getDiskImage();
                    diskDrive.setDiskImage(null);
                    this.eventDispatcherService.diskRemoved(diskDrive, diskImage);
                }
                break;
            case CommandType.OPEN_TAPE: {
                    const tape: Tape = this.ti994A.getTape();
                    tape.loadTapeFile(command.data, () => {
                        this.eventDispatcherService.tapeOpened(tape.isPlayEnabled());
                    });
                }
                break;
            case CommandType.RECORD_TAPE: {
                    const tape: Tape = this.ti994A.getTape();
                    tape.record();
                    this.eventDispatcherService.tapeRecording();
                }
                break;
            case CommandType.PLAY_TAPE: {
                    const tape: Tape = this.ti994A.getTape();
                    tape.play();
                    this.eventDispatcherService.tapePlaying();
                }
                break;
            case CommandType.STOP_TAPE: {
                    const tape: Tape = this.ti994A.getTape();
                    tape.stop();
                    this.eventDispatcherService.tapeStopped(tape.isPlayEnabled(), tape.isRewindEnabled());
                }
                break;
            case CommandType.REWIND_TAPE: {
                    const tape: Tape = this.ti994A.getTape();
                    tape.rewind();
                    this.eventDispatcherService.tapeRewound();
                }
                break;
            case CommandType.STOP_KEYBOARD:
                this.ti994A.getKeyboard().stop();
                break;
            case CommandType.START_KEYBOARD:
                this.ti994A.getKeyboard().start();
                break;
            case CommandType.START_RECORDING:
                // @ts-ignore
                const stream = this.canvas.captureStream();
                const audioStream = this.audioService.getMediaStream();
                if (audioStream) {
                    stream.addTrack(audioStream.getTracks()[0]);
                }
                this.recordings = [];
                let mimeType = 'video/webm; codecs=vp9';
                // @ts-ignore
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm; codecs=vp8';
                }
                // @ts-ignore
                this.mediaRecorder = new MediaRecorder(stream, {mimeType: mimeType});
                this.mediaRecorder.ondataavailable = this.onMediaRecorderDataAvailable.bind(this);
                this.mediaRecorder.onstop = this.onMediaRecorderStopped.bind(this);
                this.mediaRecorder.start();
                this.eventDispatcherService.recordingStarted();
                break;
            case CommandType.STOP_RECORDING:
                this.mediaRecorder.stop();
                break;
        }
    }

    // @ts-ignore
    onMediaRecorderDataAvailable(event: BlobEvent) {
        this.recordings.push(event.data);
    }

    onMediaRecorderStopped(event: Event) {
        this.eventDispatcherService.recordingStopped(this.recordings);
    }

    onCanvasClick(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.clientHeight / 240;
        const tiX = Math.floor((evt.clientX - rect.left) / scale);
        const tiY = Math.floor((evt.clientY - rect.top) / scale);
        let charCode = this.ti994A.getVDP().getCharAt(tiX, tiY);
        if (charCode > 0) {
            charCode = charCode >= 128 ? charCode - 96 : charCode;
            this.log.info("Click at (" + tiX + "," + tiY + "). Simulated keypress: " + String.fromCharCode(charCode));
            this.ti994A.getKeyboard().simulateKeyPress(charCode, null);
        }
    }

    onBreakpoint(cpu: CPU) {
        this.stop();
    }

    ngOnDestroy() {
        this.ti994A.stop();
        this.subscription.unsubscribe();
    }
}
