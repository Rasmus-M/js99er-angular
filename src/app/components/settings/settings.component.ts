import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../services/settings.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

    enableSound: boolean;
    enableSpeech: boolean;
    enableF18A: boolean;
    enablePCKeyboard: boolean;
    enableMapArrowKeys: boolean;
    enableGoogleDrive: boolean;
    enableGRAM: boolean;
    enablePixelated: boolean;
    enablePauseOnFocusLost: boolean;
    tipiWebsocketURI: string;
    enableDebugReset: boolean;
    enableH264Codec: boolean;
    ramExpansion: string;
    tipiEmulation: string;
    enableDisk: boolean;

    private subscription: Subscription;

    constructor(
        private settingsService: SettingsService,
        private eventDispatcherService: EventDispatcherService,
        private commandDispatcherService: CommandDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.readSettings();
    }

    readSettings() {
        this.enableSound = this.settingsService.isSoundEnabled();
        this.enableSpeech = this.settingsService.isSpeechEnabled();
        this.enableF18A = this.settingsService.isF18AEnabled();
        this.enablePCKeyboard = this.settingsService.isPCKeyboardEnabled();
        this.enableMapArrowKeys = this.settingsService.isMapArrowKeysToFctnSDEXEnabled();
        this.enableGoogleDrive = this.settingsService.isGoogleDriveEnabled();
        this.enableGRAM = this.settingsService.isGRAMEnabled();
        this.enablePixelated = this.settingsService.isPixelatedEnabled();
        this.enablePauseOnFocusLost = this.settingsService.isPauseOnFocusLostEnabled();
        this.tipiWebsocketURI = this.settingsService.getTIPIWebsocketURI();
        this.enableDebugReset = this.settingsService.isDebugResetEnabled();
        this.enableH264Codec = this.settingsService.isH264CodecEnabled();
        this.ramExpansion = "none";
        if (this.settingsService.is32KRAMEnabled()) {
            this.ramExpansion = "32K";
        } else if (this.settingsService.isSAMSEnabled()) {
            this.ramExpansion = "sams";
        }
        if (this.settingsService.isTIPIEnabled()) {
            this.tipiEmulation = "full";
        } else if (this.settingsService.isFastTIPIMouseEnabled()) {
            this.tipiEmulation = "mouse";
        } else {
            this.tipiEmulation = "none";
        }
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

    onEnableSpeechChanged(value: boolean) {
        this.settingsService.setSpeechEnabled(value);
    }

    onEnableF18AChanged(value: boolean) {
        this.settingsService.setF18AEnabled(value);
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

    onRAMExpansionChanged(value: string) {
        if (value === "32K") {
            this.settingsService.set32KRAMEnabled(true);
            this.settingsService.setSAMSEnabled(false);
        } else if (value === "sams") {
            this.settingsService.set32KRAMEnabled(false);
            this.settingsService.setSAMSEnabled(true);
        } else {
            this.settingsService.set32KRAMEnabled(false);
            this.settingsService.setSAMSEnabled(false);
        }
    }

    onTIPIEmulationChanged(value: string) {
        if (value === "full") {
            this.settingsService.setTIPIEnabled(true);
            this.settingsService.setFastTIPIMouseEnabled(false);
        } else if (value === "mouse") {
            this.settingsService.setTIPIEnabled(false);
            this.settingsService.setFastTIPIMouseEnabled(true);
        } else {
            this.settingsService.setTIPIEnabled(false);
            this.settingsService.setFastTIPIMouseEnabled(false);
        }
    }

    onEnableDiskChanged(value: boolean) {
        this.settingsService.setDiskEnabled(value);
    }
}
