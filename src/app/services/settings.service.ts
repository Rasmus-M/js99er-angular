import {Injectable} from '@angular/core';
import {Setting, Settings} from '../classes/settings';
import {CommandDispatcherService} from './command-dispatcher.service';
import {EventDispatcherService} from './event-dispatcher.service';

@Injectable()
export class SettingsService {

    private settings: Settings;
    private persistent = true;
    private storage: Storage;

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {
        this.settings = new Settings();
        this.loadState();
    }

    loadState() {
        if (this.persistent && window.localStorage) {
            const storage = window.localStorage;
            if (storage.getItem('enableSound') != null) {
                this.settings.setSoundEnabled(storage.getItem('enableSound') === 'true');
            }
            if (storage.getItem('enableSpeech') != null) {
                this.settings.setSpeechEnabled(storage.getItem('enableSpeech') === 'true');
            }
            if (storage.getItem('enable32KRAM') != null) {
                this.settings.set32KRAMEnabled(storage.getItem('enable32KRAM') === 'true');
            }
            if (storage.getItem('enableF18A') != null) {
                this.settings.setF18AEnabled(storage.getItem('enableF18A') === 'true');
            }
            if (storage.getItem('enableFlicker') != null) {
                this.settings.setFlickerEnabled(storage.getItem('enableFlicker') === 'true');
            }
            if (storage.getItem('enablePCKeyboard') != null) {
                this.settings.setPCKeyboardEnabled(storage.getItem('enablePCKeyboard') === 'true');
            }
            if (storage.getItem('enableMapArrowKeysToFctnSDEX') != null) {
                this.settings.setMapArrowKeysEnabled(storage.getItem('enableMapArrowKeysToFctnSDEX') === 'true');
            }
            if (storage.getItem('enableGoogleDrive') != null) {
                this.settings.setGoogleDriveEnabled(storage.getItem('enableGoogleDrive') === 'true');
            }
            if (storage.getItem('enableAMS') != null) {
                this.settings.setAMSEnabled(storage.getItem('enableAMS') === 'true');
            }
            if (storage.getItem('enableGRAM') != null) {
                this.settings.setGRAMEnabled(storage.getItem('enableGRAM') === 'true');
            }
            if (storage.getItem('enablePixelated') != null) {
                this.settings.setPixelatedEnabled(storage.getItem('enablePixelated') === 'true');
            }
            if (storage.getItem('enablePauseOnFocusLost') != null) {
                this.settings.setPauseOnFocusLostEnabled(storage.getItem('enablePauseOnFocusLost') === 'true');
            }
            this.storage = storage;
        }
    }

    getSettings(): Settings {
        return this.settings;
    }

    getPersistent(): boolean {
        return this.persistent;
    }

    setPersistent(value: boolean) {
        this.persistent = value;
    }

    isSoundEnabled() {
        return this.settings.isSoundEnabled();
    }

    setSoundEnabled(enabled) {
        if (enabled !== this.settings.isSoundEnabled()) {
            this.settings.setSoundEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableSound', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.SOUND, enabled);
        }
    }

    isSpeechEnabled() {
        return this.settings.isSpeechEnabled();
    }

    setSpeechEnabled(enabled) {
        if (enabled !== this.settings.isSpeechEnabled()) {
            this.settings.setSpeechEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableSpeech', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.SPEECH, enabled);
        }
    }

    is32KRAMEnabled() {
        return this.settings.is32KRAMEnabled();
    }

    set32KRAMEnabled(enabled) {
        if (enabled !== this.settings.is32KRAMEnabled()) {
            this.settings.set32KRAMEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enable32KRAM', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.RAM32K, enabled);
        }
    }

    isF18AEnabled() {
        return this.settings.isF18AEnabled();
    }

    setF18AEnabled(enabled) {
        if (enabled !== this.settings.isF18AEnabled()) {
            this.settings.setF18AEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableF18A', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.F18A, enabled);
        }
    }

    isFlickerEnabled() {
        return this.settings.isFlickerEnabled();
    }

    setFlickerEnabled(enabled) {
        if (enabled !== this.settings.isFlickerEnabled()) {
            this.settings.setFlickerEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableFlicker', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.FLICKER, enabled);
        }
    }

    isPCKeyboardEnabled() {
        return this.settings.isPCKeyboardEnabled();
    }

    setPCKeyboardEnabled(enabled) {
        if (enabled !== this.settings.isPCKeyboardEnabled()) {
            this.settings.setPCKeyboardEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePCKeyboard', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.PC_KEYBOARD, enabled);
        }
    }

    isMapArrowKeysToFctnSDEXEnabled() {
        return this.settings.isMapArrowKeysEnabled();
    }

    setMapArrowKeysEnabled(enabled) {
        if (enabled !== this.settings.isMapArrowKeysEnabled()) {
            this.settings.setMapArrowKeysEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableMapArrowKeysToFctnSDEX', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.MAP_ARROW_KEYS, enabled);
        }
    }

    isGoogleDriveEnabled() {
        return this.settings.isGoogleDriveEnabled();
    }

    setGoogleDriveEnabled(enabled) {
        if (enabled !== this.settings.isGoogleDriveEnabled()) {
            this.settings.setGoogleDriveEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableGoogleDrive', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.GOOGLE_DRIVE, enabled);
        }
    }

    isAMSEnabled() {
        return this.settings.isAMSEnabled();
    }

    setAMSEnabled(enabled) {
        if (enabled !== this.settings.isAMSEnabled()) {
            this.settings.setAMSEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableAMS', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.AMS, enabled);
        }
    }

    isGRAMEnabled() {
        return this.settings.isGRAMEnabled();
    }

    setGRAMEnabled(enabled) {
        if (enabled !== this.settings.isGRAMEnabled()) {
            this.settings.setGRAMEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableGRAM', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.GRAM, enabled);
        }
    }

    isPixelatedEnabled() {
        return this.settings.isPixelatedEnabled();
    }

    setPixelatedEnabled(enabled) {
        if (enabled !== this.settings.isPixelatedEnabled()) {
            this.settings.setPixelatedEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePixelated', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.PIXELATED, enabled);
        }
    }

    isPauseOnFocusLostEnabled() {
        return this.settings.isPauseOnFocusLostEnabled();
    }

    setPauseOnFocusLostEnabled(enabled) {
        if (enabled !== this.settings.isPauseOnFocusLostEnabled()) {
            this.settings.setPauseOnFocusLostEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePauseOnFocusLost', enabled);
            }
            this.commandDispatcherService.changeSetting(Setting.PAUSE_ON_FOCUS_LOST, enabled);
        }
    }

    restoreSettings(settings: Settings) {
        this.settings.copyFrom(settings);
        this.eventDispatcherService.settingsRestored();
    }
}
