import {State} from './state';

export interface CPU extends State {
    reset(): void;
    getPC(): number;
    setPC(pc: number): void;
    setWP(number: number): void;
    getCycles(): number;
    addCycles(cycles: number): void;
    isSuspended(): boolean;
    setSuspended(suspended: boolean): void;
    isIdle(): boolean;
    atBreakpoint(): boolean;
    setOtherBreakpoint(number: number): void;
    run(f18ACyclesPerScanline: number): number;
    getInternalRegsString(): string;
    getRegsStringFormatted(): string;
    dumpProfile(): void;
}
