import {Stateful} from "../interfaces/stateful";
import {SID6581} from "./sid6581";

/**
 * SID Master 99 sound card (Marc Hull, 2010): a MOS 6581 SID on a PEB card.
 *
 * Behaviour follows MAME's sidmaster.cpp:
 * - The card has no DSR and no CRU bits. It is selected by default and is
 *   deselected by any CRU access at >1000 or higher. Any CRU access below
 *   >1000 (e.g. the TMS9901) selects it again. Deselecting resets the SID.
 * - The SID registers are write-only at >5800->5836 (even addresses),
 *   incompletely decoded, so they repeat up to >5FFF.
 *
 * Timing: like MAME's stream update, the SID output is rendered up to the
 * CPU time of each register write (and of each frame end) into a buffer
 * that the audio callback drains. That keeps writes sample-accurate even
 * though the CPU runs a whole frame at a time.
 *
 * The emulator doesn't run in lockstep with the audio clock, so the number
 * of samples rendered per CPU cycle is adjusted slightly (at most 5%) to keep
 * about two audio callbacks buffered. The SID itself always runs at the real sample
 * rate, so pitch is not affected.
 */
export class SIDMaster implements Stateful {

    static readonly CLOCK = 17734472 / 18;
    static readonly CPU_CLOCK = 3000000;

    private static readonly BUFFER_LENGTH = 16384;
    // Maximum buffered audio in seconds before old samples are dropped
    private static readonly MAX_LATENCY = 0.1;
    // Rate control: how far the rendering rate may deviate from real time
    private static readonly MAX_RATE_ADJUST = 0.05;

    private sid: SID6581;
    private selected: boolean;
    private sampleRate: number;

    private buffer = new Float32Array(SIDMaster.BUFFER_LENGTH);
    private bufferStart = 0;
    private bufferEnd = 0;
    private renderBuffer = new Float32Array(SIDMaster.BUFFER_LENGTH);
    private lastCycles = -1;
    private cycleRemainder = 0;
    private rate = 1;
    private rateIntegral = 0;

    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.sid = new SID6581(SIDMaster.CLOCK, sampleRate);
        this.selected = true;
    }

    reset() {
        this.selected = true;
        this.sid.reset();
        this.clearBuffer();
    }

    setSampleRate(sampleRate: number) {
        if (sampleRate !== this.sampleRate) {
            this.sampleRate = sampleRate;
            this.clearBuffer();
        }
        this.sid.setSampleRate(sampleRate);
    }

    isSelected(): boolean {
        return this.selected;
    }

    /**
     * Called for every CRU bit access.
     * @param addr CRU bus address, i.e. the bit number times two
     * @param cycles CPU cycle time of the access
     */
    cruAccess(addr: number, cycles?: number) {
        const wasSelected = this.selected;
        this.selected = (addr & 0xf000) === 0;
        if (wasSelected && !this.selected) {
            this.renderTo(cycles);
            this.sid.reset();
        }
    }

    /**
     * Called for every CPU word write to the peripheral space >4000->5FFF.
     * @param cycles CPU cycle time of the write
     */
    writeMemoryMapped(addr: number, w: number, cycles?: number) {
        if (this.selected && (addr & 0xf800) === 0x5800) {
            this.renderTo(cycles);
            // The datamux writes the odd byte first and the even byte last,
            // and both bytes decode to the same register.
            const reg = (addr >> 1) & 0x1f;
            this.sid.write(reg, w & 0xff);
            this.sid.write(reg, w >> 8);
        }
    }

    readRegister(reg: number): number {
        return this.sid.read(reg);
    }

    /**
     * Render the SID output up to the given CPU cycle time into the buffer.
     */
    renderTo(cycles?: number) {
        if (cycles === undefined) {
            return;
        }
        if (this.lastCycles === -1 || cycles < this.lastCycles) {
            // First call, or the cycle counter was restored from a saved state
            this.lastCycles = cycles;
            this.cycleRemainder = 0;
            return;
        }
        // Keep fractional samples so the rate doesn't drift
        const scaled = this.cycleRemainder + (cycles - this.lastCycles) * this.sampleRate * this.rate;
        let samples = Math.floor(scaled / SIDMaster.CPU_CLOCK);
        this.cycleRemainder = scaled % SIDMaster.CPU_CLOCK;
        this.lastCycles = cycles;
        while (samples > 0) {
            const chunk = Math.min(samples, this.renderBuffer.length);
            this.sid.update(this.renderBuffer, chunk);
            for (let i = 0; i < chunk; i++) {
                this.buffer[this.bufferEnd] = this.renderBuffer[i];
                this.bufferEnd = (this.bufferEnd + 1) % SIDMaster.BUFFER_LENGTH;
            }
            samples -= chunk;
        }
        // Drop the oldest samples if the audio callback falls behind (e.g. in fast mode)
        const maxBuffered = Math.min(Math.round(this.sampleRate * SIDMaster.MAX_LATENCY), SIDMaster.BUFFER_LENGTH - 1);
        if (this.getBuffered() > maxBuffered) {
            this.bufferStart = (this.bufferEnd - maxBuffered + SIDMaster.BUFFER_LENGTH) % SIDMaster.BUFFER_LENGTH;
        }
    }

    getBuffered(): number {
        return (this.bufferEnd - this.bufferStart + SIDMaster.BUFFER_LENGTH) % SIDMaster.BUFFER_LENGTH;
    }

    /**
     * Audio callback: drain the rendered samples. If the buffer runs dry,
     * the SID keeps generating from its current state, which adds latency
     * until the emulator catches up.
     */
    update(out: Float32Array, length: number) {
        this.adjustRate(length);
        let i = 0;
        while (i < length && this.bufferStart !== this.bufferEnd) {
            out[i++] = this.buffer[this.bufferStart];
            this.bufferStart = (this.bufferStart + 1) % SIDMaster.BUFFER_LENGTH;
        }
        if (i < length) {
            this.sid.update(out.subarray(i, length), length - i);
        }
    }

    private adjustRate(callbackLength: number) {
        // PI controller aiming for two callbacks of buffered audio when the
        // callback runs. The integral term absorbs a steady speed difference.
        const target = callbackLength * 2;
        const error = (target - this.getBuffered()) / target;
        const max = SIDMaster.MAX_RATE_ADJUST;
        const clamp = (x: number) => Math.max(-max, Math.min(max, x));
        this.rateIntegral = clamp(this.rateIntegral + error * 0.002);
        this.rate = 1 + clamp(error * 0.02 + this.rateIntegral);
    }

    private clearBuffer() {
        this.bufferStart = this.bufferEnd = 0;
        this.lastCycles = -1;
        this.cycleRemainder = 0;
        this.rate = 1;
        this.rateIntegral = 0;
    }

    getState(): any {
        return {
            selected: this.selected,
            regs: Array.from(this.sid.reg)
        };
    }

    restoreState(state: any) {
        this.sid.reset();
        this.clearBuffer();
        if (state.regs) {
            for (let i = 0; i <= 0x18; i++) {
                this.sid.write(i, state.regs[i]);
            }
        }
        this.selected = state.selected !== false;
    }
}
