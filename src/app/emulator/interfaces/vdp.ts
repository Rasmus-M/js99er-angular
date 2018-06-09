import {CPU} from './cpu';
import {State} from './state';

export interface VDP extends State {
    reset(): void;
    drawFrame(timestamp: number): void;
    initFrame(timestamp: number): void;
    drawScanline(y: number): void;
    updateCanvas(): void;
    writeAddress(i: number): void;
    writeData(i: number): void;
    readStatus(): number;
    readData(): number;
    getRAM(): Uint8Array;
    getRegsString(): string;
    hexView(start, length, anchorAddr): object;
    getWord(addr: number): number;
    getCharAt(x: number, y: number): number;
    setFlicker(value: boolean): void;
    getGPU(): CPU;
    getState(): object;
}
