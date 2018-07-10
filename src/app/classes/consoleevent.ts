export enum ConsoleEventType {
    READY = "Ready",
    STARTED = "Started",
    STOPPED = "Stopped",
    SCREENSHOT_TAKEN = "Screenshot Taken",
    DISK_MODIFIED = "Disk Modified",
    DISK_ADDED = "Disk Added",
    DISK_INSERTED = "Disk Inserted",
    DISK_REMOVED = "Disk Removed",
    DISK_DELETED = "Disk Deleted",
    DISK_DRIVE_CHANGED = "Disk Drive Changed"
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
