export enum CommandType {
    START = "Start",
    FAST = "Fast",
    FRAME = "Frame",
    STEP = "Step",
    STEP_OVER = "Step over",
    STOP = "Stop",
    RESET = "Reset",
    LOAD_MODULE = "Load module",
    LOAD_DISK = "Load disk",
    LOAD_SOFTWARE = "Load software",
    UNLOAD_SOFTWARE = "Unload software",
    CHANGE_SETTING = "Change settings",
    PRESS_KEY = "Press key",
    TAKE_SCREENSHOT = "Take screen shot",
    SET_BREAKPOINT = "Set breakpoint",
    SET_BREAKPOINT_ADDRESS = "Set breakpoint address",
    ADD_DISK = "Add disk",
    INSERT_DISK = "Insert disk",
    REMOVE_DISK = "Remove disk",
    DELETE_DISK = "Delete disk",
    DELETE_DISK_FILES = "Delete disk fles",
    SAVE_DISK = "Save disk",
    OPEN_TAPE = "Open tape",
    RECORD_TAPE  = "Record tape",
    PLAY_TAPE = "Play tape",
    REWIND_TAPE = "Rewind tape",
    STOP_TAPE = "Stop tape",
    SAVE_STATE = "Save state",
    RESTORE_STATE = "Restore state",
    STOP_KEYBOARD = "Stop keyboard",
    START_KEYBOARD = "Start keyboard",
    START_RECORDING = "Start recording",
    STOP_RECORDING = "Stop recording",
    TOGGLE_SIDE_PANEL = "Toggle side panel",
    REQUEST_POINTER_LOCK = "Request pointer lock"
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
