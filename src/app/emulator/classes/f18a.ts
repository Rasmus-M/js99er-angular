import {VDP} from '../interfaces/vdp';
import {CRU} from './cru';
import {TMS9919} from './tms9919';
import {CPU} from '../interfaces/cpu';
import {PSG} from '../interfaces/psg';
import {Settings} from '../../classes/settings';
import {TI994A} from './ti994a';

export class F18A implements VDP {

    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;
    private console: TI994A;
    private psg: PSG;
    private cru: CRU;
    private enableFlicker: boolean;

    constructor(canvas: HTMLCanvasElement, console: TI994A, settings: Settings) {
        this.canvas = canvas;
        this.canvasContext = canvas.getContext('2d');
        this.console = console;
        this.enableFlicker = settings.isFlickerEnabled();
    }

    reset() {
        this.cru = this.console.getCRU();
        this.psg = this.console.getPSG();
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
