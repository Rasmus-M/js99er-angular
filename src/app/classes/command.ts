export enum CommandType {
    START = "Start",
    FAST = "Fast",
    FRAME = "Frame",
    STEP = "Step",
    STOP = "Stop",
    RESET = "Reset",
    LOAD_MODULE = "Load module",
    LOAD_DISK = "Load disk",
    LOAD_SOFTWARE = "Load software",
    CHANGE_SETTING = "Change settings",
    PRESS_KEY = "Press key",
    TAKE_SCREENSHOT = "Take screen shot",
    SET_BREAKPOINT = "Set breakpoint",
    ADD_DISK = "Add disk",
    INSERT_DISK = "Insert disk",
    REMOVE_DISK = "Remove disk",
    DELETE_DISK = "Delete disk",
    SAVE_DISK = "Save disk",
    PLAY_TAPE = "Play tape",
    STOP_TAPR = "Stop tape"
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
