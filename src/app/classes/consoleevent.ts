export enum ConsoleEventType {
    READY,
    STARTED,
    STOPPED,
    SCREENSHOT,
    DISK_IMAGE_CHANGED,
    DISK_DRIVE_CHANGED
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
