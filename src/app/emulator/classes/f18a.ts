import {VDP} from '../interfaces/vdp';
import {CRU} from './cru';
import {TMS9919} from './tms9919';
import {CPU} from '../interfaces/cpu';
import {PSG} from '../interfaces/psg';

export class F18A implements VDP {

    private canvasContext: CanvasRenderingContext2D;
    private psg: PSG;
    private cru: CRU;
    private enableFlicker: boolean;

    constructor(canvasContext: CanvasRenderingContext2D, cru: CRU, psg: PSG, enableFlicker: boolean) {
        this.canvasContext = canvasContext;
        this.cru = cru;
        this.psg = psg;
        this.enableFlicker = enableFlicker;
        this.reset();
    }

    drawFrame(timestamp: number) {
    }

    drawScanline(y: number) {
    }

    getCharAt(x: number, y: number): number {
        return 0;
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

    getWord(addr: number): number {
        return 0;
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

    getGPU(): CPU {
        return undefined;
    }


}
