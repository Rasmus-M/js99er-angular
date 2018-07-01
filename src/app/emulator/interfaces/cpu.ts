import {State} from './state';

export interface CPU extends State {
    reset(): void;
    run(cycles: number): number;
    getPC(): number;
    setPC(pc: number): void;
    setWP(number: number): void;
    getCycles(): number;
    addCycles(cycles: number): void;
    isSuspended(): boolean;
    setSuspended(suspended: boolean): void;
    isIdle(): boolean;
    atBreakpoint(): boolean;
    setBreakpoint(addr: number): void;
    setOtherBreakpoint(addr: number): void;
    getInternalRegsString(): string;
    getRegsStringFormatted(): string;
    dumpProfile(): void;
}
