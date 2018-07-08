export enum CommandType {
    START = "Start",
    FAST = "Fast",
    FRAME = "Frame",
    STEP = "Step",
    STOP = "Stop",
    RESET = "Reset",
    LOAD_MODULE = "Load Module",
    LOAD_DISK = "Load Disk",
    LOAD_SOFTWARE = "Load Software",
    CHANGE_SETTING = "Change Settings",
    PRESS_KEY = "Press Key",
    TAKE_SCREENSHOT = "Take Screenshot",
    SET_BREAKPOINT = "Set breakpoint",
    ADD_DISK = "Add Disk",
    INSERT_DISK = "Insert Disk",
    REMOVE_DISK = "Remove Disk",
    DELETE_DISK = "Delete Disk",
    SAVE_DISK = "Save Disk"
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
