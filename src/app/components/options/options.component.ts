import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../services/settings.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/console-event';
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {RAMType, PSGType, TIPIType, VDPType, DiskType, RAMDiskType} from "../../classes/settings";
import {EventDispatcherService} from "../../services/event-dispatcher.service";

@Component({
    selector: 'options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.css'],
    standalone: false
})
export class OptionsComponent implements OnInit {

    vdp: VDPType;
    ram: RAMType;
    tipi: TIPIType;
    psg: PSGType;
    enableSound: boolean;
    enableSpeech: boolean;
    enablePCKeyboard: boolean;
    enableMapArrowKeys: boolean;
    enableGoogleDrive: boolean;
    enableGRAM: boolean;
    enablePixelated: boolean;
    enablePauseOnFocusLost: boolean;
    tipiWebsocketURI: string;
    enableDebugReset: boolean;
    enableH264Codec: boolean;
    disk: DiskType;
    enablePCode: boolean;
    ramDisk: RAMDiskType;

    constructor(
        private settingsService: SettingsService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.readSettings();
        this.eventDispatherService.subscribe((event) => {
            this.onEvent(event);
        });
    }

    readSettings() {
        this.vdp = this.settingsService.getVDP();
        this.ram = this.settingsService.getRAM();
        this.tipi = this.settingsService.getTIPI();
        this.psg = this.settingsService.getPSG();
        this.enableSound = this.settingsService.isSoundEnabled();
        this.enableSpeech = this.settingsService.isSpeechEnabled();
        this.enablePCKeyboard = this.settingsService.isPCKeyboardEnabled();
        this.enableMapArrowKeys = this.settingsService.isMapArrowKeysToFctnSDEXEnabled();
        this.enableGoogleDrive = this.settingsService.isGoogleDriveEnabled();
        this.enableGRAM = this.settingsService.isGRAMEnabled();
        this.enablePixelated = this.settingsService.isPixelatedEnabled();
        this.enablePauseOnFocusLost = this.settingsService.isPauseOnFocusLostEnabled();
        this.tipiWebsocketURI = this.settingsService.getTIPIWebsocketURI() || '';
        this.enableDebugReset = this.settingsService.isDebugResetEnabled();
        this.enableH264Codec = this.settingsService.isH264CodecEnabled();
        this.disk = this.settingsService.getDisk();
        this.enablePCode = this.settingsService.isPCodeEnabled();
        this.ramDisk = this.settingsService.getRAMDisk();
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.SETTINGS_RESTORED:
                this.readSettings();
                break;
        }
    }

    onEnableSoundChanged(value: boolean) {
        this.settingsService.setSoundEnabled(value);
    }

    onPSGChanged(value: PSGType) {
        this.settingsService.setPSG(value);
    }

    onEnableSpeechChanged(value: boolean) {
        this.settingsService.setSpeechEnabled(value);
    }

    onEnablePCKeyboardChanged(value: boolean) {
        this.settingsService.setPCKeyboardEnabled(value);
    }

    onEnableMapArrowKeysChanged(value: boolean) {
        this.settingsService.setMapArrowKeysEnabled(value);
    }

    onEnableGoogleDriveChanged(value: boolean) {
        this.settingsService.setGoogleDriveEnabled(value);
    }

    onEnableGRAMChanged(value: boolean) {
        this.settingsService.setGRAMEnabled(value);
    }

    onEnablePixelatedChanged(value: boolean) {
        this.settingsService.setPixelatedEnabled(value);
    }

    onEnablePauseOnFocusLostChanged(value: boolean) {
        this.settingsService.setPauseOnFocusLostEnabled(value);
    }

    onTIPIWebsocketURIChanged(value: string) {
        this.settingsService.setTIPIWebsocketURI(value);
    }

    onEnableDebugResetChanged(value: boolean) {
        this.settingsService.setDebugResetEnabled(value);
    }

    onEnableH264CodecChanged(value: boolean) {
        this.settingsService.setH264CodecEnabled(value);
    }

    onTextFocus() {
        this.commandDispatcherService.stopKeyboard();
    }

    onTextBlur() {
        this.commandDispatcherService.startKeyboard();
    }

    onVDPChanged(value: VDPType) {
        this.settingsService.setVDP(value);
    }

    onRAMExpansionChanged(value: RAMType) {
        this.settingsService.setRAM(value);
    }

    onTIPIEmulationChanged(value: TIPIType) {
        this.settingsService.setTIPI(value);
    }

    onDiskChanged(value: DiskType) {
        this.settingsService.setDisk(value);
    }

    onEnablePCodeChanged(value: boolean) {
        this.settingsService.setPCodeEnabled(value);
    }

    onRAMDiskChanged(value: RAMDiskType) {
        this.settingsService.setRAMDisk(value);
    }
}
