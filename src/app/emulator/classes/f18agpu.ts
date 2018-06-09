import {State} from '../interfaces/state';
import {CPU} from '../interfaces/cpu';

export class F18AGPU implements CPU {

    static CYCLES_PER_SCANLINE: number;

    addCycles(cycles: number): void {
    }

    atBreakpoint(): any {
    }

    getPC(): number {
        return 0;
    }

    getState(): object {
        return undefined;
    }

    isIdle(): boolean {
        return false;
    }

    reset() {
    }

    restoreState(state: any) {
    }

    setOtherBreakpoint(number: number): void {
    }

    setSuspended(suspended: boolean): void {
    }

    isSuspended(): boolean {
        return false;
    }

    run(f18ACyclesPerScanline: number): number {
        return 0;
    }

    dumpProfile(): void {
    }

    getCycles(): number {
        return 0;
    }

    getInternalRegsString(): any {
    }

    getRegsStringFormatted(): string {
        return "";
    }

    setPC(pc: number): void {
    }

    setWP(number: number): void {
    }



}
