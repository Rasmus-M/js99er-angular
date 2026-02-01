export enum BreakpointType {
    INSTRUCTION,
    GPU_INSTRUCTION,
    CPU_MEMORY_READ,
    CPU_MEMORY_WRITE,
    VDP_MEMORY_READ,
    VDP_MEMORY_WRITE
}

export class Breakpoint {

    private _type: BreakpointType;
    private _addr: number;

    constructor(type: BreakpointType, addr: number) {
        this._type = type;
        this._addr = addr;
    }

    get type(): BreakpointType {
        return this._type;
    }

    set type(value: BreakpointType) {
        this._type = value;
    }

    get addr(): number {
        return this._addr;
    }

    set addr(value: number) {
        this._addr = value;
    }
}
