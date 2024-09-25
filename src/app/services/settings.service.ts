import {Injectable} from '@angular/core';
import {RAMType, Setting, Settings, PSGType, TIPIType, VDPType} from '../classes/settings';
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
            if (storage.getItem('psg') != null) {
                this.settings.setPSG(storage.getItem('psg') as PSGType);
            }
            if (storage.getItem('ram') != null) {
                this.settings.setRAM(storage.getItem('ram') as RAMType);
            }
            if (storage.getItem('vdp') != null) {
                this.settings.setVDP(storage.getItem('vdp') as VDPType);
            }
            if (storage.getItem('enableSound') != null) {
                this.settings.setSoundEnabled(storage.getItem('enableSound') === 'true');
            }
            if (storage.getItem('enableSpeech') != null) {
                this.settings.setSpeechEnabled(storage.getItem('enableSpeech') === 'true');
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
            if (storage.getItem('enableGRAM') != null) {
                this.settings.setGRAMEnabled(storage.getItem('enableGRAM') === 'true');
            }
            if (storage.getItem('enablePixelated') != null) {
                this.settings.setPixelatedEnabled(storage.getItem('enablePixelated') === 'true');
            }
            if (storage.getItem('enablePauseOnFocusLost') != null) {
                this.settings.setPauseOnFocusLostEnabled(storage.getItem('enablePauseOnFocusLost') === 'true');
            }
            if (storage.getItem('tipi') != null) {
                this.settings.setTIPI(storage.getItem('tipi') as TIPIType);
            }
            if (storage.getItem('TIPIWebsocketURI') != null) {
                this.settings.setTIPIWebsocketURI(storage.getItem('TIPIWebsocketURI'));
            }
            if (storage.getItem('enableDebugReset') != null) {
                this.settings.setDebugResetEnabled(storage.getItem('enableDebugReset') === 'true');
            }
            if (storage.getItem('enableH264Codec') != null) {
                this.settings.setH264CodecEnabled(storage.getItem('enableH264Codec') === 'true');
            }
            if (storage.getItem('enableDisk') != null) {
                this.settings.setDiskEnabled(storage.getItem('enableDisk') === 'true');
            }
            this.storage = storage;
        }
    }

    getSettings(): Settings {
        return this.settings;
    }

    setSettings(settings: any) {
        for (const setting of Object.getOwnPropertyNames(settings)) {
            const setterName = 'set' + setting.charAt(0).toUpperCase() + setting.substring(1);
            if (this.settings[setterName]) {
                this.settings[setterName](settings[setting]);
            }
        }
    }

    getPersistent(): boolean {
        return this.persistent;
    }

    setPersistent(value: boolean) {
        this.persistent = value;
    }

    getPSG(): PSGType {
        return this.settings.getPSG();
    }

    setPSG(psg: PSGType) {
        if (psg !== this.settings.getPSG()) {
            this.settings.setPSG(psg);
            if (this.persistent && this.storage) {
                this.storage.setItem('psg', psg);
            }
            this.commandDispatcherService.changeSetting(Setting.PSG, psg);
        }
    }

    isSoundEnabled() {
        return this.settings.isSoundEnabled();
    }

    setSoundEnabled(enabled: boolean) {
        if (enabled !== this.settings.isSoundEnabled()) {
            this.settings.setSoundEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableSound', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.SOUND, enabled);
        }
    }

    isSpeechEnabled() {
        return this.settings.isSpeechEnabled();
    }

    setSpeechEnabled(enabled: boolean) {
        if (enabled !== this.settings.isSpeechEnabled()) {
            this.settings.setSpeechEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableSpeech', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.SPEECH, enabled);
        }
    }

    getRAM(): RAMType {
        return this.settings.getRAM();
    }

    setRAM(ram: RAMType) {
        if (ram !== this.settings.getRAM()) {
            this.settings.setRAM(ram);
            if (this.persistent && this.storage) {
                this.storage.setItem('ram', ram);
            }
            this.commandDispatcherService.changeSetting(Setting.RAM, ram);
        }
    }

    getVDP(): VDPType {
        return this.settings.getVDP();
    }

    setVDP(vdp: VDPType) {
        if (vdp !== this.settings.getVDP()) {
            this.settings.setVDP(vdp);
            if (this.persistent && this.storage) {
                this.storage.setItem('vdp', vdp);
            }
            this.commandDispatcherService.changeSetting(Setting.VDP, vdp);
        }
    }

    isPCKeyboardEnabled() {
        return this.settings.isPCKeyboardEnabled();
    }

    setPCKeyboardEnabled(enabled: boolean) {
        if (enabled !== this.settings.isPCKeyboardEnabled()) {
            this.settings.setPCKeyboardEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePCKeyboard', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.PC_KEYBOARD, enabled);
        }
    }

    isMapArrowKeysToFctnSDEXEnabled() {
        return this.settings.isMapArrowKeysEnabled();
    }

    setMapArrowKeysEnabled(enabled: boolean) {
        if (enabled !== this.settings.isMapArrowKeysEnabled()) {
            this.settings.setMapArrowKeysEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableMapArrowKeysToFctnSDEX', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.MAP_ARROW_KEYS, enabled);
        }
    }

    isGoogleDriveEnabled() {
        return this.settings.isGoogleDriveEnabled();
    }

    setGoogleDriveEnabled(enabled: boolean) {
        if (enabled !== this.settings.isGoogleDriveEnabled()) {
            this.settings.setGoogleDriveEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableGoogleDrive', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.GOOGLE_DRIVE, enabled);
        }
    }

    isGRAMEnabled() {
        return this.settings.isGRAMEnabled();
    }

    setGRAMEnabled(enabled: boolean) {
        if (enabled !== this.settings.isGRAMEnabled()) {
            this.settings.setGRAMEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableGRAM', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.GRAM, enabled);
        }
    }

    isPixelatedEnabled() {
        return this.settings.isPixelatedEnabled();
    }

    setPixelatedEnabled(enabled: boolean) {
        if (enabled !== this.settings.isPixelatedEnabled()) {
            this.settings.setPixelatedEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePixelated', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.PIXELATED, enabled);
        }
    }

    isPauseOnFocusLostEnabled() {
        return this.settings.isPauseOnFocusLostEnabled();
    }

    setPauseOnFocusLostEnabled(enabled: boolean) {
        if (enabled !== this.settings.isPauseOnFocusLostEnabled()) {
            this.settings.setPauseOnFocusLostEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enablePauseOnFocusLost', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.PAUSE_ON_FOCUS_LOST, enabled);
        }
    }

    getTIPI(): TIPIType {
        return this.settings.getTIPI();
    }

    setTIPI(tipi: TIPIType) {
        if (tipi !== this.settings.getTIPI()) {
            this.settings.setTIPI(tipi);
            if (this.persistent && this.storage) {
                this.storage.setItem('tipi', tipi);
            }
            this.commandDispatcherService.changeSetting(Setting.TIPI, tipi);
        }
    }

    getTIPIWebsocketURI() {
        return this.settings.getTIPIWebsocketURI();
    }

    setTIPIWebsocketURI(value: string) {
        this.settings.setTIPIWebsocketURI(value);
        if (this.persistent && this.storage) {
            this.storage.setItem('TIPIWebsocketURI', value);
        }
        this.commandDispatcherService.changeSetting(Setting.TIPI_WEBSOCKET_URI, value);
    }

    restoreSettings(settings: Settings) {
        this.settings.copyFrom(settings);
        this.eventDispatcherService.settingsRestored();
    }

    isDebugResetEnabled() {
        return this.settings.isDebugResetEnabled();
    }

    setDebugResetEnabled(enabled: boolean) {
        if (enabled !== this.settings.isDebugResetEnabled()) {
            this.settings.setDebugResetEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableDebugReset', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.DEBUG_RESET, enabled);
        }
    }

    isH264CodecEnabled() {
        return this.settings.isH264CodexEnabled();
    }

    setH264CodecEnabled(enabled: boolean) {
        if (enabled !== this.settings.isH264CodexEnabled()) {
            this.settings.setH264CodecEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableH264Codec', enabled ? 'true' : 'false');
            }
            this.commandDispatcherService.changeSetting(Setting.H264_CODEC, enabled);
        }
    }

    isDiskEnabled() {
        return this.settings.isDiskEnabled();
    }

    setDiskEnabled(enabled: boolean) {
        if (enabled !== this.settings.isDiskEnabled()) {
            this.settings.setDiskEnabled(enabled);
            if (this.persistent && this.storage) {
                this.storage.setItem('enableDisk', enabled ? 'true' : 'false');
                this.commandDispatcherService.changeSetting(Setting.DISK, enabled);
            }
        }
    }
}
