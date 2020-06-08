import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../services/settings.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

    enableSound: boolean;
    enableSpeech: boolean;
    enable32KRAM: boolean;
    enableF18A: boolean;
    enableFlicker: boolean;
    enablePCKeyboard: boolean;
    enableMapArrowKeys: boolean;
    enableGoogleDrive: boolean;
    enableAMS: boolean;
    enableGRAM: boolean;
    enablePixelated: boolean;
    enablePauseOnFocusLost: boolean;
    enableTIPI: boolean;

    private subscription: Subscription;

    constructor(
        private settingsService: SettingsService,
        private eventDispatcherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.readSettings();
    }

    readSettings() {
        this.enableSound = this.settingsService.isSoundEnabled();
        this.enableSpeech = this.settingsService.isSpeechEnabled();
        this.enable32KRAM = this.settingsService.is32KRAMEnabled();
        this.enableF18A = this.settingsService.isF18AEnabled();
        this.enableFlicker = this.settingsService.isFlickerEnabled();
        this.enablePCKeyboard = this.settingsService.isPCKeyboardEnabled();
        this.enableMapArrowKeys = this.settingsService.isMapArrowKeysToFctnSDEXEnabled();
        this.enableGoogleDrive = this.settingsService.isGoogleDriveEnabled();
        this.enableAMS = this.settingsService.isAMSEnabled();
        this.enableGRAM = this.settingsService.isGRAMEnabled();
        this.enablePixelated = this.settingsService.isPixelatedEnabled();
        this.enablePauseOnFocusLost = this.settingsService.isPauseOnFocusLostEnabled();
        this.enableTIPI = this.settingsService.isTIPIEnabled();
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.SETTINGS_RESTORED:
                this.readSettings();
                break;
        }
    }

    onEnableSoundChanged(value) {
        this.settingsService.setSoundEnabled(value);
    }

    onEnableSpeechChanged(value) {
        this.settingsService.setSpeechEnabled(value);
    }

    onEnable32KRAMChanged(value) {
        this.settingsService.set32KRAMEnabled(value);
    }

    onEnableAMSChanged(value) {
        this.settingsService.setAMSEnabled(value);
    }

    onEnableF18AChanged(value) {
        this.settingsService.setF18AEnabled(value);
    }

    onEnableFlickerChanged(value) {
        this.settingsService.setFlickerEnabled(value);
    }

    onEnablePCKeyboardChanged(value) {
        this.settingsService.setPCKeyboardEnabled(value);
    }

    onEnableMapArrowKeysChanged(value) {
        this.settingsService.setMapArrowKeysEnabled(value);
    }

    onEnableGoogleDriveChanged(value) {
        this.settingsService.setGoogleDriveEnabled(value);
    }

    onEnabledAMSChanged(value) {
        this.settingsService.setAMSEnabled(value);
    }

    onEnableGRAMChanged(value) {
        this.settingsService.setGRAMEnabled(value);
    }

    onEnablePixelatedChanged(value) {
        this.settingsService.setPixelatedEnabled(value);
    }

    onEnablePauseOnFocusLostChanged(value) {
        this.settingsService.setPauseOnFocusLostEnabled(value);
    }

    onEnableTIPIChanged(value) {
        this.settingsService.setTIPIEnabled(value);
    }
}
