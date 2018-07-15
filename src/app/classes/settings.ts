export enum Setting {
    SOUND = 0,
    SPEECH = 1,
    RAM32K = 2,
    F18A = 3,
    FLICKER = 4,
    PC_KEYBOARD = 5,
    MAP_ARROW_KEYS = 5,
    GOOGLE_DRIVE = 6,
    AMS = 7,
    GRAM = 8,
    PIXELATED = 9
}

export class Settings {

    private enableSound: boolean;
    private enableSpeech: boolean;
    private enable32KRAM: boolean;
    private enableF18A: boolean;
    private enableFlicker: boolean;
    private enablePCKeyboard: boolean;
    private enableMapArrowKeys: boolean;
    private enableGoogleDrive: boolean;
    private enableAMS: boolean;
    private enableGRAM: boolean;
    private enablePixelated: boolean;

    constructor() {
        this.enableSound = true;
        this.enableSpeech = true;
        this.enable32KRAM = true;
        this.enableF18A = false;
        this.enableFlicker = true;
        this.enablePCKeyboard = false;
        this.enableMapArrowKeys = false;
        this.enableGoogleDrive = false;
        this.enableAMS = false;
        this.enableGRAM = false;
        this.enablePixelated = false;
    }

    isSoundEnabled() {
        return this.enableSound;
    }

    setSoundEnabled(enabled) {
        this.enableSound = enabled;
    }

    isSpeechEnabled() {
        return this.enableSpeech;
    }

    setSpeechEnabled(enabled) {
        this.enableSpeech = enabled;
    }

    is32KRAMEnabled() {
        return this.enable32KRAM;
    }

    set32KRAMEnabled(enabled) {
        this.enable32KRAM = enabled;
    }

    isF18AEnabled() {
        return this.enableF18A;
    }

    setF18AEnabled(enabled) {
        this.enableF18A = enabled;
    }

    isFlickerEnabled() {
        return this.enableFlicker;
    }

    setFlickerEnabled(enabled) {
        this.enableFlicker = enabled;
    }

    isPCKeyboardEnabled() {
        return this.enablePCKeyboard;
    }

    setPCKeyboardEnabled(enabled) {
        this.enablePCKeyboard = enabled;
    }

    isMapArrowKeysEnabled() {
        return this.enableMapArrowKeys;
    }

    setMapArrowKeysEnabled(enabled) {
        this.enableMapArrowKeys = enabled;
    }

    isGoogleDriveEnabled() {
        return this.enableGoogleDrive;
    }

    setGoogleDriveEnabled(enabled) {
        this.enableGoogleDrive = enabled;
    }

    isAMSEnabled() {
        return this.enableAMS;
    }

    setAMSEnabled(enabled) {
        this.enableAMS = enabled;
    }

    isGRAMEnabled() {
        return this.enableGRAM;
    }

    setGRAMEnabled(enabled) {
        this.enableGRAM = enabled;
    }

    isPixelatedEnabled() {
        return this.enablePixelated;
    }

    setPixelatedEnabled(enabled) {
        this.enablePixelated = enabled;
    }

    copyFrom(otherSettings: Settings) {
        this.enableSound = otherSettings.isSoundEnabled();
        this.enableSpeech = otherSettings.isSpeechEnabled();
        this.enable32KRAM = otherSettings.is32KRAMEnabled();
        this.enableF18A = otherSettings.isF18AEnabled();
        this.enableFlicker = otherSettings.isFlickerEnabled();
        this.enablePCKeyboard = otherSettings.isPCKeyboardEnabled();
        this.enableMapArrowKeys = otherSettings.isMapArrowKeysEnabled();
        this.enableGoogleDrive = otherSettings.isGoogleDriveEnabled();
        this.enableAMS = otherSettings.isAMSEnabled();
        this.enableGRAM = otherSettings.isGRAMEnabled();
        this.enablePixelated = otherSettings.isPixelatedEnabled();
    }
}
