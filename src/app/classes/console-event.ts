export enum ConsoleEventType {
    READY = "Ready",
    STARTED = "Started",
    STOPPED = "Stopped",
    SCREENSHOT_TAKEN = "Screenshot taken",
    DISK_MODIFIED = "Disk modified",
    DISK_ADDED = "Disk added",
    DISK_INSERTED = "Disk inserted",
    DISK_REMOVED = "Disk removed",
    DISK_DELETED = "Disk deleted",
    DISK_DRIVE_CHANGED = "Disk drive changed",
    TAPE_OPENED = "Tape opened",
    TAPE_RECORDING = "Tape recording",
    TAPE_STOPPED = "Tape stopped",
    TAPE_PLAYING = "Tape playing",
    TAPE_REWOUND = "Tape rewound",
    SETTINGS_RESTORED = "Settings restored",
    STATE_RESTORED = "State restored",
    RECORDING_STARTED = "Recording started",
    RECORDING_STOPPED = "Recording stopped",
    POINTER_LOCKED = "Pointer locked",
    POINTER_UNLOCKED = "Pointer unlocked"
}

export class ConsoleEvent {

    private _type: ConsoleEventType;
    private _data: any;

    constructor(type: ConsoleEventType, data: any) {
        this._type = type;
        this._data = data;
    }

    get type(): ConsoleEventType {
        return this._type;
    }

    set type(value: ConsoleEventType) {
        this._type = value;
    }

    get data(): any {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
    }
}
