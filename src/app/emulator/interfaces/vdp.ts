import {CPU} from './cpu';
import {State} from './state';
import {MemoryDevice} from './memory-device';

export interface VDP extends State, MemoryDevice {
    reset(): void;
    initFrame(): void;
    drawScanline(y: number): void;
    drawInvisibleScanline(y: number): void;
    updateCanvas(): void;
    writeAddress(i: number): void;
    writeData(i: number): void;
    readStatus(): number;
    readData(): number;
    getRAM(): Uint8Array;
    getRegister(r: number): number;
    getRegsString(): string;
    getWord(addr: number): number;
    getCharAt(x: number, y: number): number;
    getGPU(): CPU;
    getState(): object;
    drawPaletteImage(canvas: HTMLCanvasElement): void;
    drawTilePatternImage(canvas: HTMLCanvasElement, section: number, gap: boolean): void;
    drawSpritePatternImage(canvas: HTMLCanvasElement, gap: boolean): void;
}
