import {CPU} from './cpu';
import {State} from './state';
import {MemoryDevice} from './memory-device';

export interface VDP extends State, MemoryDevice {
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
    getWord(addr: number): number;
    getCharAt(x: number, y: number): number;
    setFlicker(value: boolean): void;
    getGPU(): CPU;
    getState(): object;
    drawPaletteImage(canvas: HTMLCanvasElement): void;
    drawTilePatternImage(canvas: HTMLCanvasElement, section: number, gap: boolean): void;
    drawSpritePatternImage(canvas: HTMLCanvasElement, gap: boolean): void;
}
