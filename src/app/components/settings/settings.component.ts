import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../services/settings.service';

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


    constructor(private settingsService: SettingsService) {
    }

    ngOnInit() {
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
}
