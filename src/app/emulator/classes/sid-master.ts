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
 */
export class SIDMaster implements Stateful {

    static readonly CLOCK = 17734472 / 18;

    private sid: SID6581;
    private selected: boolean;

    constructor(sampleRate = 44100) {
        this.sid = new SID6581(SIDMaster.CLOCK, sampleRate);
        this.selected = true;
    }

    reset() {
        this.selected = true;
        this.sid.reset();
    }

    setSampleRate(sampleRate: number) {
        this.sid.setSampleRate(sampleRate);
    }

    isSelected(): boolean {
        return this.selected;
    }

    /**
     * Called for every CRU bit access.
     * @param addr CRU bus address, i.e. the bit number times two
     */
    cruAccess(addr: number) {
        const wasSelected = this.selected;
        this.selected = (addr & 0xf000) === 0;
        if (wasSelected && !this.selected) {
            this.sid.reset();
        }
    }

    /**
     * Called for every CPU word write to the peripheral space >4000->5FFF.
     */
    writeMemoryMapped(addr: number, w: number) {
        if (this.selected && (addr & 0xf800) === 0x5800) {
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

    update(buffer: Float32Array, length: number) {
        this.sid.update(buffer, length);
    }

    getState(): any {
        return {
            selected: this.selected,
            regs: Array.from(this.sid.reg)
        };
    }

    restoreState(state: any) {
        this.sid.reset();
        if (state.regs) {
            for (let i = 0; i <= 0x18; i++) {
                this.sid.write(i, state.regs[i]);
            }
        }
        this.selected = state.selected !== false;
    }
}
