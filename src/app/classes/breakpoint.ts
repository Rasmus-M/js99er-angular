export enum BreakpointType {
    INSTRUCTION,
    CPU_MEMORY_READ,
    CPU_MEMORY_WRITE,
    VDP_MEMORY_READ,
    VDP_MEMORY_WRITE
}

export class Breakpoint {

    private _type: BreakpointType;
    private _addr: number;
    private _mask: number;

    constructor(type: BreakpointType, addr: number, mask: number) {
        this._type = type;
        this._addr = addr;
        this._mask = mask;
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

    get mask(): number {
        return this._mask;
    }

    set mask(value: number) {
        this._mask = value;
    }
}
