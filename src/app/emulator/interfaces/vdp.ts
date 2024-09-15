import {CPU} from './cpu';
import {Stateful} from './stateful';
import {MemoryDevice} from './memory-device';

export interface VDP extends Stateful, MemoryDevice {
    reset(): void;
    initFrame(): void;
    drawScanline(y: number): void;
    drawInvisibleScanline(y: number): void;
    updateCanvas(): void;
    writeAddress(i: number): void;
    writeData(i: number): void;
    writePalette(i: number): void;
    writeRegisterIndirect(i: number): void;
    readStatus(): number;
    readData(): number;
    getRAM(): Uint8Array;
    getRegister(r: number): number;
    getRegsString(detailed: boolean): string;
    getByte(addr: number): number;
    setByte(addr: number, i: number): void;
    getWord(addr: number): number;
    getCharAt(x: number, y: number): number;
    getGPU(): CPU;
    drawPaletteImage(canvas: HTMLCanvasElement): void;
    drawTilePatternImage(canvas: HTMLCanvasElement, section: number, gap: boolean): void;
    drawSpritePatternImage(canvas: HTMLCanvasElement, gap: boolean): void;
}
