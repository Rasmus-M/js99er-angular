import {Stateful} from './stateful';
import {Observable} from "rxjs";

export interface CPU extends Stateful {
    reset(): void;
    run(cycles: number, skipBreakpoint?: boolean): number;
    getPc(): number;
    setPc(pc: number): void;
    getWp(): number;
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
    getCycleCount(): { start: number, end: number };
    setCycleCount(start: number, end: number): void;
    instructionExecuting(): Observable<number>;
}
