export enum CommandType {
    START,
    FAST,
    FRAME,
    STEP,
    STOP,
    RESET,
    OPEN_MODULE,
    OPEN_DISK,
    OPEN_SOFTWARE,
    CHANGE_SETTING,
    PRESS_KEY
}

export class Command {

    private _type: CommandType;
    private _data: any;

    constructor(type: CommandType, data: any) {
        this._type = type;
        this._data = data;
    }

    get type(): CommandType {
        return this._type;
    }

    set type(value: CommandType) {
        this._type = value;
    }

    get data(): any {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
    }
}
