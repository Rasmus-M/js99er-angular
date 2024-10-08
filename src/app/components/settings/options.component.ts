import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../services/settings.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {RAMType, PSGType, TIPIType, VDPType} from "../../classes/settings";

@Component({
    selector: 'options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.css']
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
    enableDisk: boolean;

    constructor(
        private settingsService: SettingsService,
        private commandDispatcherService: CommandDispatcherService
    ) {
    }

    ngOnInit() {
        this.readSettings();
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
        this.enableDisk = this.settingsService.isDiskEnabled();
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

    onEnableDiskChanged(value: boolean) {
        this.settingsService.setDiskEnabled(value);
    }
}
