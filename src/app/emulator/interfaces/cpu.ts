import {State} from './state';

export interface CPU extends State {
    reset(): void;
    run(cycles: number, skipBreakpoint?: boolean): number;
    getPc(): number;
    setPc(pc: number): void;
    setWp(number: number): void;
    getCycles(): number;
    addCycles(cycles: number): void;
    isSuspended(): boolean;
    setSuspended(suspended: boolean): void;
    isIdle(): boolean;
    isStoppedAtBreakpoint(): boolean;
    setBreakpoint(addr: number): void;
    breakAfterNext(): void;
    getInternalRegsString(detailed: boolean): string;
    getRegsStringFormatted(detailed: boolean): string;
    dumpProfile(): void;
    setTracing(tracing: boolean): void;
    getCycleLog(): Int32Array;
}
