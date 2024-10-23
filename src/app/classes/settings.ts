export enum Setting {
    SOUND,
    PSG,
    SPEECH,
    RAM,
    VDP,
    PC_KEYBOARD,
    MAP_ARROW_KEYS,
    GOOGLE_DRIVE,
    GRAM,
    PIXELATED,
    PAUSE_ON_FOCUS_LOST,
    TIPI,
    TIPI_WEBSOCKET_URI,
    DEBUG_RESET,
    H264_CODEC,
    DISK,
}

export type PSGType = 'STANDARD' | 'FORTI';

export type RAMType = 'NONE' | '32K' | 'SAMS1M' | 'SAMS4M' | 'SAMS16M';

export type VDPType = 'TMS9918A' | 'F18A' | 'V9938';

export type TIPIType = 'NONE' | 'MOUSE' | 'FULL';

export class Settings {

    private enableSound: boolean;
    private psg: PSGType;
    private enableSpeech: boolean;
    private ram: RAMType;
    private vdp: VDPType;
    private enablePCKeyboard: boolean;
    private enableMapArrowKeys: boolean;
    private enableGoogleDrive: boolean;
    private enableGRAM: boolean;
    private enablePixelated: boolean;
    private enablePauseOnFocusLost: boolean;
    private tipi: TIPIType;
    private tipiWebsocketURI: string | null;
    private enableDebugReset: boolean;
    private enableH264Codec: boolean;
    private enableDisk: boolean;

    constructor() {
        this.enableSound = true;
        this.psg = 'STANDARD';
        this.enableSpeech = true;
        this.ram = '32K';
        this.vdp = 'TMS9918A';
        this.enablePCKeyboard = false;
        this.enableMapArrowKeys = false;
        this.enableGoogleDrive = false;
        this.enableGRAM = false;
        this.enablePixelated = false;
        this.enablePauseOnFocusLost = false;
        this.tipi = 'NONE';
        this.tipiWebsocketURI = "ws://localhost:9901/tipi";
        this.enableDebugReset = false;
        this.enableH264Codec = false;
        this.enableDisk = true;
    }

    isSoundEnabled(): boolean {
        return this.enableSound;
    }

    setSoundEnabled(enabled: boolean) {
        this.enableSound = enabled;
    }

    getPSG(): PSGType {
        return this.psg;
    }

    setPSG(psg: PSGType) {
        this.psg = psg;
    }

    isSpeechEnabled(): boolean {
        return this.enableSpeech;
    }

    setSpeechEnabled(enabled: boolean) {
        this.enableSpeech = enabled;
    }

    getRAM(): RAMType {
        return this.ram;
    }

    setRAM(ram: RAMType) {
        this.ram = ram;
    }

    getVDP(): VDPType {
        return this.vdp;
    }

    setVDP(vdp: VDPType) {
        this.vdp = vdp;
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

    getTIPI(): TIPIType {
        return this.tipi;
    }

    setTIPI(tipi: TIPIType) {
        this.tipi = tipi;
    }

    getTIPIWebsocketURI() {
        return this.tipiWebsocketURI;
    }

    setTIPIWebsocketURI(value: string | null) {
        this.tipiWebsocketURI = value;
    }

    isDebugResetEnabled() {
        return this.enableDebugReset;
    }

    setDebugResetEnabled(enabled: boolean) {
        this.enableDebugReset = enabled;
    }

    isH264CodexEnabled() {
        return this.enableH264Codec;
    }

    setH264CodecEnabled(enabled: boolean) {
        this.enableH264Codec = enabled;
    }

    isDiskEnabled() {
        return this.enableDisk;
    }

    setDiskEnabled(enabled: boolean) {
        this.enableDisk = enabled;
    }

    isSAMSEnabled() {
        return this.ram === 'SAMS1M' || this.ram === 'SAMS4M' || this.ram === 'SAMS16M';
    }

    getSAMSSize() {
        switch (this.ram) {
            case 'SAMS1M':
                return 1024;
            case 'SAMS4M':
                return 4096;
            case 'SAMS16M':
                return 16384;
            default:
                return 0;
        }
    }

    copyFrom(otherSettings: any) {
        if (otherSettings.enableSound !== undefined) {
            this.enableSound = otherSettings.enableSound;
        }
        if (otherSettings.psg !== undefined) {
            this.psg = otherSettings.psg;
        }
        if (otherSettings.enableSpeech !== undefined) {
            this.enableSpeech = otherSettings.enableSpeech;
        }
        if (otherSettings.ram !== undefined) {
            this.ram = otherSettings.ram;
        }
        if (otherSettings.vdp !== undefined) {
            this.vdp = otherSettings.vdp;
        }
        if (otherSettings.enablePCKeyboard !== undefined) {
            this.enablePCKeyboard = otherSettings.enablePCKeyboard;
        }
        if (otherSettings.enableMapArrowKeys !== undefined) {
            this.enableMapArrowKeys = otherSettings.enableMapArrowKeys;
        }
        if (otherSettings.enableGoogleDrive !== undefined) {
            this.enableGoogleDrive = otherSettings.enableGoogleDrive;
        }
        if (otherSettings.enableGRAM !== undefined) {
            this.enableGRAM = otherSettings.enableGRAM;
        }
        if (otherSettings.enablePixelated !== undefined) {
            this.enablePixelated = otherSettings.enablePixelated;
        }
        if (otherSettings.enablePauseOnFocusLost !== undefined) {
            this.enablePauseOnFocusLost = otherSettings.enablePauseOnFocusLost;
        }
        if (otherSettings.tipi !== undefined) {
            this.tipi = otherSettings.tipi;
        }
        if (otherSettings.tipiWebsocketURI !== undefined) {
            this.tipiWebsocketURI = otherSettings.tipiWebsocketURI;
        }
        if (otherSettings.enableDebugReset !== undefined) {
            this.enableDebugReset = otherSettings.enableDebugReset;
        }
        if (otherSettings.enableH264Codec !== undefined) {
            this.enableH264Codec = otherSettings.enableH264Codec;
        }
        if (otherSettings.enableDisk !== undefined) {
            this.enableDisk = otherSettings.enableDisk;
        }
    }
}
