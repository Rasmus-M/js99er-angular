export class Settings {

    private persistent: boolean;
    private enableSound: boolean;
    private enableSpeech: boolean;
    private enable32KRAM: boolean;
    private enableF18A: boolean;
    private enableFlicker: boolean;
    private enablePCKeyboard: boolean;
    private enableMapArrowKeysToFctnSDEX: boolean;
    private enableGoogleDrive: boolean;
    private enableAMS: boolean;
    private enableGRAM: boolean;
    private enablePixelated: boolean;
    private storage: Storage;

    constructor(persistent) {

        this.persistent = persistent;
        this.enableSound = true;
        this.enableSpeech = false;
        this.enable32KRAM = true;
        this.enableF18A = false;
        this.enableFlicker = false;
        this.enablePCKeyboard = false;
        this.enableMapArrowKeysToFctnSDEX = true;
        this.enableGoogleDrive = false;
        this.enableAMS = false;
        this.enableGRAM = false;
        this.enablePixelated = false;

        if (persistent && window.localStorage) {
            const storage = window.localStorage;
            if (storage.getItem("enableSound") != null) {
                this.enableSound = storage.getItem("enableSound") === "true";
            }
            if (storage.getItem("enableSpeech") != null) {
                this.enableSpeech = storage.getItem("enableSpeech") === "true";
            }
            if (storage.getItem("enable32KRAM") != null) {
                this.enable32KRAM = storage.getItem("enable32KRAM") === "true";
            }
            if (storage.getItem("enableF18A") != null) {
                this.enableF18A = storage.getItem("enableF18A") === "true";
            }
            if (storage.getItem("enableFlicker") != null) {
                this.enableFlicker = storage.getItem("enableFlicker") === "true";
            }
            if (storage.getItem("enablePCKeyboard") != null) {
                this.enablePCKeyboard = storage.getItem("enablePCKeyboard") === "true";
            }
            if (storage.getItem("enableMapArrowKeysToFctnSDEX") != null) {
                this.enableMapArrowKeysToFctnSDEX = storage.getItem("enableMapArrowKeysToFctnSDEX") === "true";
            }
            if (storage.getItem("enableGoogleDrive") != null) {
                this.enableGoogleDrive = storage.getItem("enableGoogleDrive") === "true";
            }
            if (storage.getItem("enableAMS") != null) {
                this.enableAMS = storage.getItem("enableAMS") === "true";
            }
            if (storage.getItem("enableGRAM") != null) {
                this.enableGRAM = storage.getItem("enableGRAM") === "true";
            }
            if (storage.getItem("enablePixelated") != null) {
                this.enablePixelated = storage.getItem("enablePixelated") === "true";
            }
            this.storage = storage;
        }
    }

    isSoundEnabled() {
        return this.enableSound;
    }

    setSoundEnabled(enabled) {
        this.enableSound = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableSound", enabled);
        }
    }

    isSpeechEnabled() {
        return this.enableSpeech;
    }

    setSpeechEnabled(enabled) {
        this.enableSpeech = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableSpeech", enabled);
        }
    }

    is32KRAMEnabled() {
        return this.enable32KRAM;
    }

    set32KRAMEnabled(enabled) {
        this.enable32KRAM = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enable32KRAM", enabled);
        }
    }

    isF18AEnabled() {
        return this.enableF18A;
    }

    setF18AEnabled(enabled) {
        this.enableF18A = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableF18A", enabled);
        }
    }

    isFlickerEnabled() {
        return this.enableFlicker;
    }

    setFlickerEnabled(enabled) {
        this.enableFlicker = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableFlicker", enabled);
        }
    }

    isPCKeyboardEnabled() {
        return this.enablePCKeyboard;
    }

    setPCKeyboardEnabled(enabled) {
        this.enablePCKeyboard = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enablePCKeyboard", enabled);
        }
    }

    isMapArrowKeysToFctnSDEXEnabled() {
        return this.enableMapArrowKeysToFctnSDEX;
    }

    setMapArrowKeysToFctnSDEXEnabled(enabled) {
        this.enableMapArrowKeysToFctnSDEX = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableMapArrowKeysToFctnSDEX", enabled);
        }
    }

    isGoogleDriveEnabled() {
        return this.enableGoogleDrive;
    }

    setGoogleDriveEnabled(enabled) {
        this.enableGoogleDrive = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableGoogleDrive", enabled);
        }
    }

    isAMSEnabled() {
        return this.enableAMS;
    }

    setAMSEnabled(enabled) {
        this.enableAMS = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableAMS", enabled);
        }
    }

    isGRAMEnabled() {
        return this.enableGRAM;
    }

    setGRAMEnabled(enabled) {
        this.enableGRAM = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enableGRAM", enabled);
        }
    }

    isPixelatedEnabled() {
        return this.enablePixelated;
    }

    setPixelatedEnabled(enabled) {
        this.enablePixelated = enabled;
        if (this.persistent && this.storage) {
            this.storage.setItem("enablePixelated", enabled);
        }
    }
}
