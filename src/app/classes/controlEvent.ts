export enum ControlEventType {
    READY,
    STARTED,
    STOPPED,
    SCREENSHOT,
    DISK_IMAGE_CHANGED,
    DISK_DRIVE_CHANGED
}

export class ControlEvent {

    private _type: ControlEventType;
    private _data: any;

    constructor(type: ControlEventType, data: any) {
        this._type = type;
        this._data = data;
    }

    get type(): ControlEventType {
        return this._type;
    }

    set type(value: ControlEventType) {
        this._type = value;
    }

    get data(): any {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
    }
}
