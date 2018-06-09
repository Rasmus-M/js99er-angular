import {VDP} from '../interfaces/vdp';
import {CRU} from './cru';

export class F18A implements VDP {

    private canvas: HTMLCanvasElement;
    private cru: CRU;
    private enableFlicker: boolean;

    private canvasContext: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, cru: CRU, enableFlicker: boolean) {
        this.canvas = canvas;
        this.cru = cru;
        this.enableFlicker = enableFlicker;
        this.canvasContext = canvas.getContext('2d');
        this.reset();
    }

    drawFrame(timestamp: number) {
    }

    drawScanline(y: number) {
    }

    getCharAt(x: number, y: number) {
    }

    getRAM(): Uint8Array {
        return undefined;
    }

    getRegsString(): string {
        return "";
    }

    getState(): object {
        return undefined;
    }

    getWord(addr: number) {
    }

    hexView(start, length, anchorAddr): object {
        return undefined;
    }

    initFrame(timestamp: number) {
    }

    readData(): number {
        return 0;
    }

    readStatus(): number {
        return 0;
    }

    reset() {
    }

    restoreState(state: object) {
    }

    setFlicker(value: boolean) {
    }

    updateCanvas() {
    }

    writeAddress(i: number) {
    }

    writeData(i: number) {
    }
}
