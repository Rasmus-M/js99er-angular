import {Stateful} from '../interfaces/stateful';
import {TMS9919} from './tms9919';
import {TMS9901} from './tms9901';
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
import $ from "jquery";
import {V9938} from "./v9938";
import {Forti} from "./forti";

export class TI994A implements Console, Stateful {

    static FRAME_MS = 1000 / 60;
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
    private tms9901: TMS9901;
    private keyboard: Keyboard;
    private tape: Tape;
    private diskDrives: DiskDrive[];
    private googleDrives: GoogleDrive[];
    private tipi: TIPI | null;

    private running: boolean;
    private cpuSpeed: number;
    private activeCPU: CPU;
    private wasRunning = false;
    private wasFast = false;
    private useVsync = false;

    private frameCount: number;
    private frameInterval: number;
    private lastFrameTime: number | null;
    private fpsFrameCount: number;
    private fpsInterval: number;
    private lastFpsTime: number | null;

    private log: Log;

    constructor(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], settings: Settings, wasmService: WasmService, onBreakpoint: (cpu: CPU) => void) {
        this.document = document;
        this.canvas = canvas;
        this.settings = settings;
        this.wasmService = wasmService;
        this.onBreakpoint = onBreakpoint;

        this.assemble(diskImages);

        this.running = false;
        this.cpuSpeed = 1;
        this.activeCPU = this.cpu;
        this.wasRunning = false;
        this.wasFast = false;
        this.useVsync = navigator.userAgent.indexOf('Firefox') !== -1;

        this.frameCount = 0;
        this.lastFrameTime = null;
        this.fpsFrameCount = 0;
        this.lastFpsTime = null;

        this.log = Log.getLog();

        $(window).on("blur", () => {
            if (this.settings.isPauseOnFocusLostEnabled() || this.useVsync) {
                this.wasRunning = this.isRunning();
                this.wasFast = this.isFast();
                if (this.wasRunning) {
                    this.stop();
                }
            }
        });
        $(window).on("focus", () => {
            if (this.settings.isPauseOnFocusLostEnabled() || this.useVsync) {
                if (this.wasRunning) {
                    this.start(this.wasFast);
                }
            }
        });
    }

    assemble(diskImages: DiskImage[]) {
        this.memory = new Memory(this, this.settings);
        this.cpu = new TMS9900(this);
        this.setVDP();
        this.tape = new Tape();
        this.setPSG();
        this.speech = new TMS5200(this.settings.isSpeechEnabled());
        this.tms9901 = new TMS9901(this);
        this.keyboard = new Keyboard(this.document, this.settings);
        this.diskDrives = [
            new DiskDrive("DSK1", diskImages[0], this),
            new DiskDrive("DSK2", diskImages[1], this),
            new DiskDrive("DSK3", diskImages[2], this)
        ];
        this.setGoogleDrive();
        this.setTIPI();
        this.speech.isReady().subscribe(
            (ready) => {
                this.cpu.setSuspended(!ready);
            }
        );
    }

    setVDP() {
        switch (this.settings.getVDP()) {
            case 'TMS9918A':
                this.vdp = new TMS9918A(this.canvas, this, this.wasmService);
                break;
            case 'F18A':
                this.vdp = new F18A(this.canvas, this, this.wasmService);
                break;
            case 'V9938':
                this.vdp = new V9938(this.canvas, this);
                break;
        }
    }

    setPSG() {
        switch (this.settings.getPSG()) {
            case 'STANDARD':
                this.psg = new TMS9919(this.cpu, this.tape);
                break;
            case 'FORTI':
                this.psg = new Forti(this.cpu, this.tape);
                break;
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
        if (this.settings.getTIPI() !== 'NONE') {
            this.tipi = new TIPI(
                this.cpu,
                this.settings.getTIPIWebsocketURI() || '',
                this.canvas,
                this.settings.getTIPI() === 'FULL',
                this.settings.getTIPI() === 'MOUSE'
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

    getCRU(): TMS9901 {
        return this.tms9901;
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

    getTIPI(): TIPI | null {
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
        this.tms9901.reset();
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
            if (this.useVsync) {
                this.lastFrameTime = null;
                this.runWithVsync(skipBreakpoint);
            } else {
                this.runWithInterval(skipBreakpoint);
            }
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

    runWithVsync(skipBreakpoint?: boolean) {
        window.requestAnimationFrame(
            (time) => {
                if (this.running) {
                    if (this.lastFrameTime === null || time - this.lastFrameTime - TI994A.FRAME_MS > -1.0) {
                        this.frame(skipBreakpoint);
                        this.lastFrameTime = time;
                    }
                    this.runWithVsync(skipBreakpoint);
                }
            }
        );
    }

    runWithInterval(skipBreakpoint?: boolean) {
        this.frameInterval = window.setInterval(
            () => {
                this.frame(skipBreakpoint);
            },
            Math.ceil(TI994A.FRAME_MS)
        );
    }

    frame(skipBreakpoint?: boolean) {
        const cpuSpeed = this.cpuSpeed;
        let cyclesToRun = TMS9900.CYCLES_PER_FRAME * cpuSpeed;
        const cyclesPerScanline = TMS9900.CYCLES_PER_SCANLINE * cpuSpeed;
        const f18ACyclesPerScanline = F18AGPU.CYCLES_PER_SCANLINE;
        let extraCycles = 0;
        let cruTimerDecrementFrame = TMS9901.TIMER_DECREMENT_PER_FRAME;
        const cruTimerDecrementScanline = TMS9901.TIMER_DECREMENT_PER_SCANLINE;
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
            const gpu: CPU | undefined = this.vdp.getGPU();
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
            this.tms9901.decrementTimer(cruTimerDecrementScanline);
            cruTimerDecrementFrame -= cruTimerDecrementScanline;
            cyclesToRun -= cyclesPerScanline;
            skipBreakpoint = false;
        }
        if (cruTimerDecrementFrame >= 1) {
            this.tms9901.decrementTimer(cruTimerDecrementFrame);
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
        if (this.frameInterval) {
            window.clearInterval(this.frameInterval);
        }
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

    getStatusString(detailed: boolean) {
        return this.activeCPU.getInternalRegsString(detailed) + " " + this.tms9901.getStatusString(detailed) + "\n" +
        this.activeCPU.getRegsStringFormatted(detailed) + this.vdp.getRegsString(detailed) + " " + this.memory.getStatusString(detailed) +
        (detailed ? "\nPSG: " + this.psg.getRegsString(detailed) : "");
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

    getState(): any {
        return {
            cpu: this.cpu.getState(),
            memory: this.memory.getState(),
            cru: this.tms9901.getState(),
            keyboard: this.keyboard.getState(),
            vdp: this.vdp.getState(),
            psg: this.psg.getState(),
            speech: this.speech.getState(),
            tape: this.tape.getState()
        };
    }

    restoreState(state: any) {
        if (state.cpu) {
            this.cpu.restoreState(state.cpu);
        }
        if (state.memory) {
            this.memory.restoreState(state.memory);
        }
        if (state.tms9901) {
            this.tms9901.restoreState(state.tms9901);
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
