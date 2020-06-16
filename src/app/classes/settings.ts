export enum Setting {
    SOUND = 0,
    SPEECH = 1,
    RAM32K = 2,
    F18A = 3,
    FLICKER = 4,
    PC_KEYBOARD = 5,
    MAP_ARROW_KEYS = 6,
    GOOGLE_DRIVE = 7,
    AMS = 8,
    GRAM = 9,
    PIXELATED = 10,
    PAUSE_ON_FOCUS_LOST = 11,
    TIPI = 12,
    TIPI_WEBSOCKET_URI = 13
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
    private enablePauseOnFocusLost: boolean;
    private enableTIPI: boolean;
    private tipiWebsocketURI: string;

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
        this.enablePauseOnFocusLost = false;
        this.enableTIPI = false;
        this.tipiWebsocketURI = "ws://localhost:9901/tipi";
    }

    isSoundEnabled(): boolean {
        return this.enableSound;
    }

    setSoundEnabled(enabled: boolean) {
        this.enableSound = enabled;
    }

    isSpeechEnabled(): boolean {
        return this.enableSpeech;
    }

    setSpeechEnabled(enabled: boolean) {
        this.enableSpeech = enabled;
    }

    is32KRAMEnabled(): boolean {
        return this.enable32KRAM;
    }

    set32KRAMEnabled(enabled: boolean) {
        this.enable32KRAM = enabled;
    }

    isF18AEnabled(): boolean {
        return this.enableF18A;
    }

    setF18AEnabled(enabled: boolean) {
        this.enableF18A = enabled;
    }

    isFlickerEnabled(): boolean {
        return this.enableFlicker;
    }

    setFlickerEnabled(enabled: boolean) {
        this.enableFlicker = enabled;
    }

    isPCKeyboardEnabled(): boolean {
        return this.enablePCKeyboard;
    }

    setPCKeyboardEnabled(enabled: boolean) {
        this.enablePCKeyboard = enabled;
    }

    isMapArrowKeysEnabled(): boolean {
        return this.enableMapArrowKeys;
    }

    setMapArrowKeysEnabled(enabled: boolean) {
        this.enableMapArrowKeys = enabled;
    }

    isGoogleDriveEnabled(): boolean {
        return this.enableGoogleDrive;
    }

    setGoogleDriveEnabled(enabled: boolean) {
        this.enableGoogleDrive = enabled;
    }

    isAMSEnabled(): boolean {
        return this.enableAMS;
    }

    setAMSEnabled(enabled: boolean) {
        this.enableAMS = enabled;
    }

    isGRAMEnabled(): boolean {
        return this.enableGRAM;
    }

    setGRAMEnabled(enabled: boolean) {
        this.enableGRAM = enabled;
    }

    isPixelatedEnabled(): boolean {
        return this.enablePixelated;
    }

    setPixelatedEnabled(enabled: boolean) {
        this.enablePixelated = enabled;
    }

    isPauseOnFocusLostEnabled(): boolean {
        return this.enablePauseOnFocusLost;
    }

    setPauseOnFocusLostEnabled(enabled: boolean) {
        this.enablePauseOnFocusLost = enabled;
    }

    isTIPIEnabled(): boolean {
        return this.enableTIPI;
    }

    setTIPIEnabled(enabled: boolean) {
        this.enableTIPI = enabled;
    }

    getTIPIWebsocketURI() {
        return this.tipiWebsocketURI;
    }

    setTIPIWebsocketURI(value: string) {
        this.tipiWebsocketURI = value;
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
        this.enablePauseOnFocusLost = otherSettings.isPauseOnFocusLostEnabled();
        this.enableTIPI = otherSettings.isTIPIEnabled();
        this.tipiWebsocketURI = otherSettings.getTIPIWebsocketURI();
    }
}
