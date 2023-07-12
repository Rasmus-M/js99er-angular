import {State} from '../interfaces/state';
import {TMS9919} from './tms9919';
import {CRU} from './cru';
import {Tape} from './tape';
import {Keyboard} from './keyboard';
import {TMS5200} from './tms5200';
import {Memory} from './memory';
import {TMS9900} from './tms9900';
import {Log} from '../../classes/log';
import {F18A} from './f18a';
import {GoogleDrive} from './googledrive';
import {VDP} from '../interfaces/vdp';
import {CPU} from '../interfaces/cpu';
import {TMS9918A} from './tms9918a';
import {F18AGPU} from './f18agpu';
import {System} from './system';
import {Software} from '../../classes/software';
import {Settings} from '../../classes/settings';
import {PSG} from '../interfaces/psg';
import {Speech} from '../interfaces/speech';
import {DiskDrive} from './diskdrive';
import {DiskImage} from './diskimage';
import {Console} from "../interfaces/console";
import {TIPI} from "./tipi";
import {WasmService} from "../../services/wasm.service";

export class TI994A implements Console, State {

    static FRAMES_TO_RUN = Number.MAX_VALUE;
    static FRAME_MS = 17;
    static FPS_MS = 4000;

    private canvas: HTMLCanvasElement;
    private document: HTMLDocument;
    private settings: Settings;
    private wasmService: WasmService;
    private onBreakpoint: (cpu: CPU) => void;

    private memory: Memory;
    private cpu: CPU;
    private vdp: VDP;
    private psg: PSG;
    private speech: Speech;
    private cru: CRU;
    private keyboard: Keyboard;
    private tape: Tape;
    private diskDrives: DiskDrive[];
    private googleDrives: GoogleDrive[];
    private tipi: TIPI;

    private cpuSpeed: number;
    private frameCount: number;
    private lastFpsTime: number;
    private fpsFrameCount: number;
    private running: boolean;
    private activeCPU: CPU;

    private log: Log;
    private frameInterval: number;
    private fpsInterval: number;

    constructor(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], settings: Settings, wasmService: WasmService, onBreakpoint: (CPU) => void) {
        this.document = document;
        this.canvas = canvas;
        this.settings = settings;
        this.wasmService = wasmService;
        this.onBreakpoint = onBreakpoint;

        this.assemble(diskImages);

        this.cpuSpeed = 1;
        this.frameCount = 0;
        this.lastFpsTime = null;
        this.fpsFrameCount = 0;
        this.running = false;
        this.activeCPU = this.cpu;
        this.log = Log.getLog();
    }

    assemble(diskImages: DiskImage[]) {
        this.memory = new Memory(this, this.settings);
        this.cpu = new TMS9900(this);
        this.setVDP();
        this.tape = new Tape();
        this.psg = new TMS9919(this.cpu, this.tape);
        this.speech = new TMS5200(this, this.settings);
        this.cru = new CRU(this);
        this.keyboard = new Keyboard(this.document, this.settings);
        this.diskDrives = [
            new DiskDrive("DSK1", diskImages[0], this),
            new DiskDrive("DSK2", diskImages[1], this),
            new DiskDrive("DSK3", diskImages[2], this)
        ];
        this.setGoogleDrive();
        this.setTIPI();
        this.speech.setCPU(this.cpu);
    }

    setVDP() {
        if (this.settings.isF18AEnabled()) {
            this.vdp = new F18A(this.canvas, this);
        } else {
            this.vdp = new TMS9918A(this.canvas, this, this.wasmService);
        }
    }

    setGoogleDrive() {
        if (this.settings.isGoogleDriveEnabled()) {
            this.googleDrives = [
                new GoogleDrive("GDR1", "Js99erDrives/GDR1", this),
                new GoogleDrive("GDR2", "Js99erDrives/GDR2", this),
                new GoogleDrive("GDR3", "Js99erDrives/GDR3", this)
            ];
        } else {
            this.googleDrives = [];
        }
    }

    setTIPI() {
        if (this.tipi) {
            this.tipi.close();
        }
        if (this.settings.isTIPIEnabled() || this.settings.isFastTIPIMouseEnabled()) {
            this.tipi = new TIPI(
                this.cpu,
                this.settings.getTIPIWebsocketURI(),
                this.canvas,
                this.settings.isTIPIEnabled(),
                this.settings.isFastTIPIMouseEnabled()
            );
        } else {
            this.tipi = null;
        }
    }

    getCPU(): CPU {
        return this.cpu;
    }

    getVDP(): VDP {
        return this.vdp;
    }

    getPSG(): PSG {
        return this.psg;
    }

    getSpeech(): Speech {
        return this.speech;
    }

    getCRU(): CRU {
        return this.cru;
    }

    getMemory(): Memory {
        return this.memory;
    }

    getKeyboard(): Keyboard {
        return this.keyboard;
    }

    getTape(): Tape {
        return this.tape;
    }

    getDiskDrives(): DiskDrive[] {
        return this.diskDrives;
    }

    getGoogleDrives(): GoogleDrive[] {
        return this.googleDrives;
    }

    getTIPI(): TIPI {
        return this.tipi;
    }

    isRunning() {
        return this.running;
    }

    isFast() {
        return this.cpuSpeed > 1;
    }

    reset(keepCart: boolean) {
        // Components
        this.memory.reset(keepCart);
        this.cpu.reset();
        this.vdp.reset();
        this.psg.reset();
        this.speech.reset();
        this.cru.reset();
        this.keyboard.reset();
        this.tape.reset();
        for (let i = 0; i < this.diskDrives.length; i++) {
            this.diskDrives[i].reset();
        }
        for (let i = 0; i < this.googleDrives.length; i++) {
            this.googleDrives[i].reset();
        }
        if (this.tipi) {
            this.tipi.reset();
        }
        // Other
        this.resetFps();
        this.cpuSpeed = 1;
    }

    start(fast: boolean, skipBreakpoint?: boolean) {
        this.cpuSpeed = fast ? 3 : 1;
        if (!this.isRunning()) {
            this.cpu.setSuspended(false);
            this.tape.setPaused(false);
            this.keyboard.start();
            this.frameInterval = window.setInterval(
                () => {
                    if (this.frameCount < TI994A.FRAMES_TO_RUN) {
                        this.frame(skipBreakpoint);
                    } else {
                        this.stop();
                    }
                },
                TI994A.FRAME_MS
            );
            this.resetFps();
            this.printFps();
            this.fpsInterval = window.setInterval(
                () => {
                    this.printFps();
                },
                TI994A.FPS_MS
            );
        }
        this.running = true;
    }

    frame(skipBreakpoint?: boolean) {
        const cpuSpeed = this.cpuSpeed;
        let cyclesToRun = TMS9900.CYCLES_PER_FRAME * cpuSpeed;
        const cyclesPerScanline = TMS9900.CYCLES_PER_SCANLINE * cpuSpeed;
        const f18ACyclesPerScanline = F18AGPU.CYCLES_PER_SCANLINE;
        let extraCycles = 0;
        let cruTimerDecrementFrame = CRU.TIMER_DECREMENT_PER_FRAME;
        const cruTimerDecrementScanline = CRU.TIMER_DECREMENT_PER_SCANLINE;
        let y = 0;
        this.vdp.initFrame();
        while (cyclesToRun > 0) {
            if (y < 240) {
                this.vdp.drawScanline(y);
            } else {
                this.vdp.drawInvisibleScanline(y);
            }
            y = y + 1;
            const cpu = this.cpu;
            if (!cpu.isSuspended()) {
                this.activeCPU = cpu;
                extraCycles = cpu.run(cyclesPerScanline - extraCycles, skipBreakpoint);
                if (cpu.isStoppedAtBreakpoint()) {
                    if (this.onBreakpoint) {
                        this.onBreakpoint(cpu);
                    }
                    return;
                }
            }
            // F18A GPU
            const gpu: CPU = this.vdp.getGPU();
            if (gpu && !gpu.isIdle()) {
                this.activeCPU = gpu;
                gpu.run(f18ACyclesPerScanline, skipBreakpoint);
                if (gpu.isStoppedAtBreakpoint()) {
                    if (this.onBreakpoint) {
                        this.onBreakpoint(gpu);
                    }
                    return;
                }
                if (gpu.isIdle()) {
                    this.activeCPU = cpu;
                }
            }
            this.cru.decrementTimer(cruTimerDecrementScanline);
            cruTimerDecrementFrame -= cruTimerDecrementScanline;
            cyclesToRun -= cyclesPerScanline;
            skipBreakpoint = false;
        }
        if (cruTimerDecrementFrame >= 1) {
            this.cru.decrementTimer(cruTimerDecrementFrame);
        }
        this.fpsFrameCount++;
        this.frameCount++;
        this.vdp.updateCanvas();
    }

    step() {
        this.activeCPU.run(1, true);
    }

    stepOver() {
        this.activeCPU.breakAfterNext();
        this.start(false, true);
    }

    stop() {
        window.clearInterval(this.frameInterval);
        window.clearInterval(this.fpsInterval);
        this.psg.mute();
        this.tape.setPaused(true);
        this.keyboard.stop();
        this.vdp.updateCanvas();
        this.running = false;
        this.cpu.dumpProfile();
    }

    resetFps() {
        this.lastFpsTime = null;
        this.fpsFrameCount = 0;
    }

    printFps() {
        const now = +new Date();
        let s = 'Frame ' + this.frameCount + ' running';
        if (this.lastFpsTime) {
            s += ': '
                + (this.fpsFrameCount / ((now - this.lastFpsTime) / 1000)).toFixed(1)
                + ' / '
                + (1000 / TI994A.FRAME_MS).toFixed(1)
                + ' FPS';
        }
        this.log.info(s);
        this.fpsFrameCount = 0;
        this.lastFpsTime = now;
    }

    getPC() {
        return this.activeCPU.getPc();
    }

    isGPUActive(): boolean {
        return this.activeCPU === this.vdp.getGPU();
    }

    getStatusString() {
        return this.activeCPU.getInternalRegsString() + " " + this.cru.getStatusString() + "\n" +
        this.activeCPU.getRegsStringFormatted() + this.vdp.getRegsString() + " " + this.memory.getStatusString();
    }

    loadSoftware(sw: Software) {
        const wasRunning = this.isRunning();
        if (wasRunning) {
            this.stop();
        }
        this.reset(!!sw.memoryBlocks);
        if (sw.memoryBlocks) {
            for (let i = 0; i < sw.memoryBlocks.length; i++) {
                const memoryBlock = sw.memoryBlocks[i];
                this.memory.loadRAM(memoryBlock.address, memoryBlock.data);
            }
        }
        if (sw.rom) {
            this.memory.setCartridgeImage(
                sw.rom,
                sw.inverted,
                sw.cruBankSwitched,
                sw.ramAt6000,
                sw.ramAt7000,
                sw.ramFG99Paged
            );
        }
        if (sw.grom) {
            this.memory.loadGROM(sw.grom, 3, 0);
        }
        if (sw.groms) {
            for (let g = 0; g < sw.groms.length; g++) {
                this.memory.loadGROM(sw.groms[g], 3, g);
            }
        }
        this.cpu.setWp(sw.workspaceAddress ? sw.workspaceAddress : (System.ROM[0] << 8 | System.ROM[1]));
        this.cpu.setPc(sw.startAddress ? sw.startAddress : (System.ROM[2] << 8 | System.ROM[3]));
        if (wasRunning) {
            this.start(false);
        }
    }

    getState() {
        return {
            cpu: this.cpu.getState(),
            memory: this.memory.getState(),
            cru: this.cru.getState(),
            keyboard: this.keyboard.getState(),
            vdp: this.vdp.getState(),
            psg: this.psg.getState(),
            speech: this.speech.getState(),
            tape: this.tape.getState()
        };
    }

    restoreState(state) {
        if (state.cpu) {
            this.cpu.restoreState(state.cpu);
        }
        if (state.memory) {
            this.memory.restoreState(state.memory);
        }
        if (state.cru) {
            this.cru.restoreState(state.cru);
        }
        if (state.keyboard) {
            this.keyboard.restoreState(state.keyboard);
        }
        if (state.vdp) {
            this.vdp.restoreState(state.vdp);
        }
        if (state.psg) {
            this.psg.restoreState(state.psg);
        }
        if (state.speech) {
            this.speech.restoreState(state.speech);
        }
        if (state.tape) {
            this.tape.restoreState(state.tape);
        }
    }
}
