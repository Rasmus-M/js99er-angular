import {CRU} from './cru';
import {Util} from '../../classes/util';
import {Memory} from './memory';
import {CPU} from '../interfaces/cpu';
import {Opcode} from "../../classes/opcode";
import {Disassembler} from "../../classes/disassembler";
import {CPUCommon} from "./cpu-common";
import {Console} from "../interfaces/console";

export class TMS9900 extends CPUCommon implements CPU {

    static readonly CYCLES_PER_FRAME = 50000;
    static readonly CYCLES_PER_SCANLINE = 194; // 50,000 / 194 = 258 lines on the screen.
    static readonly PROFILE = false;

    private console: Console;
    private memory: Memory;
    private cru: CRU;

    // Misc
    private suspended: boolean;
    private profile: Uint32Array;
    private countStart: number;
    private maxCount: number;
    private disassembler: Disassembler;

    constructor(console: Console) {
        super();
        this.console = console;
        this.disassembler = new Disassembler();
        this.addSpecialInstructions();
    }

    addSpecialInstructions() {
        this.instructions['TB'] = this.tb;
        this.instructions['SBO'] = this.sbo;
        this.instructions['SBZ'] = this.sbz;
    }

    reset() {
        this.memory = this.console.getMemory();
        this.cru = this.console.getCRU();

        this.pc = 0;
        this.wp = 0;
        this.st = 0;
        this.flagX = 0;
        this.ts = 0;
        this.td = 0;
        this.dest = 0;
        this.source = 0;
        this.byte = 0;
        this.cycles = 0;
        this.countStart = 0;
        this.maxCount = 0;
        this.illegalCount = 0;
        this.profile = new Uint32Array(0x10000);

        // Reset
        this.wp = this.readMemoryWord(0x0000);
        this.pc = this.readMemoryWord(0x0002);
        this.log.info("PC reset to " + Util.toHexWord(this.pc));

        this.suspended = false;

        this.disassembler.setMemory(this.console.getMemory());
        this.cycleLog = new Int32Array(0x10000);
    }

    run(cyclesToRun: number, skipBreakpoint?: boolean): number {
        this.stoppedAtBreakpoint = false;
        const startCycles = this.cycles;
        const countStartPC = this.cycleCountStart;
        const countEndPC = this.cycleCountEnd;
        while (this.cycles - startCycles < cyclesToRun && !this.suspended) {
            const atBreakpoint = this.atBreakpoint() && !skipBreakpoint;
            if (atBreakpoint) {
                // Handle breakpoint
                this.log.info("At breakpoint " + Util.toHexWord(this.pc));
                if (this.pc === this.auxBreakpoint) {
                    this.auxBreakpoint = null;
                }
                this.stoppedAtBreakpoint = true;
                cyclesToRun = -1;
            } else {
                // Execute instruction
                this.instructionSubject.next(this.pc);
                const tmpPC = this.pc;
                const tmpCycles = this.getCycles();
                const instruction = this.readMemoryWord(this.pc);
                this.inctPc();
                const cycles = this.execute(instruction);
                this.addCycles(cycles);
                const instrCycles = this.getCycles() - tmpCycles;
                this.cycleLog[tmpPC] = instrCycles;
                if (this.tracing) {
                    this.log.info(Util.padr(this.disassembler.disassembleInstruction(tmpPC), ' ', 40) + instrCycles);
                }
                // Execute interrupt routine
                if (this.getInterruptMask() >= 1 && (this.cru.isVDPInterrupt() || this.cru.isTimerInterrupt())) {
                    this.addCycles(this.doInterrupt(4));
                }
                skipBreakpoint = false;
            }
            if (this.pc === countStartPC) {
                this.countStart = this.cycles;
            } else if (this.pc === countEndPC) {
                const count = this.cycles - this.countStart;
                if (!this.maxCount || count > this.maxCount) {
                    this.maxCount = count;
                }
                this.log.info("Cycle count: " + count + " max: " + this.maxCount);
            }
        }
        return (this.cycles - startCycles) - cyclesToRun;
    }

    execute(instruction: number): number {
        const opcode: Opcode = this.decoderTable[instruction];
        if (opcode && opcode.original) {
            let cycles = this.decodeOperands(opcode, instruction);
            const f: undefined | (() => number) = this.instructions[opcode.id];
            if (f) {
                cycles += f.call(this);
                if (TMS9900.PROFILE) {
                    this.profile[(this.pc - 2) & 0xFFFF] += cycles;
                }
            } else {
                this.log.info(Util.toHexWord((this.pc - 2) & 0xFFFF) + " " + Util.toHexWord(instruction) + " " + opcode.id + ": Not implemented");
            }
            return cycles;
        } else {
            if (this.illegalCount < 256) {
                this.log.info(Util.toHexWord((this.pc - 2) & 0xFFFF) + " " + Util.toHexWord(instruction) + ": Illegal" + (this.illegalCount === 255 ? " (suppressing further messages)" : ""));
            }
            this.illegalCount++;
            return 10;
        }
    }

    writeMemoryWord(addr: number, w: number) {
        this.memory.writeWord(addr, w, this);
    }

    writeMemoryByte(addr: number, b: number) {
        const w = this.memory.readWord(addr, this); // Read before write
        this.memory.writeWord(addr, (addr & 1) !== 0 ? (w & 0xFF00) | b : (w & 0x00FF) | (b << 8), this);
    }

    readMemoryWord(addr: number): number {
        return this.memory.readWord(addr, this);
    }

    readMemoryByte(addr: number): number {
        const w = this.memory.readWord(addr, this);
        return (addr & 1) !== 0 ? w & 0x00FF : (w & 0xFF00) >> 8;
    }

    getMemoryWord(addr: number): number {
        return this.memory.getWord(addr);
    }

    readCruBit(addr: number): boolean {
        return this.cru.readBit(addr);
    }

    writeCruBit(addr: number, bool: boolean) {
        this.cru.writeBit(addr, bool);
    }

    doInterrupt(vector: number): number {
        const newWP = this.readMemoryWord(vector);
        const newPC = this.readMemoryWord(vector + 2);

        this.writeMemoryWord(newWP + 26, this.wp);	// WP in new R13
        this.writeMemoryWord(newWP + 28, this.pc);	// PC in new R14
        this.writeMemoryWord(newWP + 30, this.st);	// ST in new R15

        // Load the correct workspace, and perform a branch and link to the address
        this.setWp(newWP);
        this.setPc(newPC);

        return 22;
    }

    // This sets A0-A2 to 010, and pulses CRUCLK until an interrupt is received.
    idle(): number {
        return 12;
    }

    // ReTurn with Workspace Pointer: RTWP
    // The matching return for BLWP, see BLWP for description
    rtwp(): number {
        this.st = this.readMemoryWord(this.wp + 30); // R15
        this.setPc(this.readMemoryWord(this.wp + 28)); // R14
        this.setWp(this.readMemoryWord(this.wp + 26)); // R13
        return 14;
    }

    // Set Bit On: SBO src
    // Sets a bit in the CRU
    sbo(): number {
        let addr = (this.readMemoryWord(this.wp + 24) >> 1) & 0xfff;
        if ((this.dest & 0x80) !== 0) {
            addr -= 128 - (this.dest & 0x7f);
        } else {
            addr += this.dest;
        }
        this.writeCruBit(addr, true);

        return 12;
    }

    // Set Bit Zero: SBZ src
    // Zeros a bit in the CRU
    sbz(): number {
        let addr = (this.readMemoryWord(this.wp + 24) >> 1) & 0xfff;
        if ((this.dest & 0x80) !== 0) {
            addr -= 128 - (this.dest & 0x7f);
        } else {
            addr += this.dest;
        }
        this.writeCruBit(addr, false);

        return 12;
    }

    // Test Bit: TB src
    // Tests a CRU bit
    tb(): number {
        let add = (this.readMemoryWord(this.wp + 24) >> 1) & 0xfff;
        if ((this.dest & 0x80) !== 0) {
            add -= 128 - (this.dest & 0x7f);
        } else {
            add += this.dest;
        }
        if (this.readCruBit(add)) { this.setEQ(); } else { this.resetEQ(); }

        return 12;
    }

    // LoaD CRu - LDCR src, dst
    // Writes dst bits serially out to the CRU registers
    // The CRU is the 9901 Communication chip, tightly tied into the 9900.
    // It's serially accessed and has 4096 single bit IO registers.
    // It's stupid and thinks 0 is true and 1 is false.
    // All addresses are offsets from the value in R12, which is divided by 2
    ldcr(): number {
        if (this.dest === 0) { this.dest = 16; }
        const x1 = (this.dest < 9 ? this.readMemoryByte(this.source) : this.readMemoryWord(this.source));

        let x3 = 1;
        const cruBase = (this.readMemoryWord(this.wp + 24) >> 1) & 0xfff;
        for (let x2 = 0; x2 < this.dest; x2++) {
            this.writeCruBit(cruBase + x2, (x1 & x3) !== 0);
            x3 = x3 << 1;
        }

        this.resetLGT_AGT_EQ();
        if (this.dest < 9) {
            this.resetOP();
            this.st |= this.bStatusLookup[x1 & 0xff] & this.maskLGT_AGT_EQ_OP;
        } else {
            this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;
        }

        return 20 + 2 * this.dest;
    }

    // STore CRU: STC6R src, dst
    // Stores dst bits from the CRU into src
    stcr(): number {
        if (this.dest === 0) { this.dest = 16; }
        let x1 = 0;
        let x3 = 1;

        const cruBase = (this.readMemoryWord(this.wp + 24) >> 1) & 0xfff;
        for (let x2 = 0; x2 < this.dest; x2++) {
            const x4 = this.readCruBit(cruBase + x2);
            if (x4) {
                x1 = x1 | x3;
            }
            x3 <<= 1;
        }

        if (this.dest < 9) {
            this.writeMemoryByte(this.source, x1 & 0xff);
        } else {
            this.writeMemoryWord(this.source, x1);
        }

        this.resetLGT_AGT_EQ();
        if (this.dest < 9) {
            this.resetOP();
            this.st |= this.bStatusLookup[x1 & 0xff] & this.maskLGT_AGT_EQ_OP;
        } else {
            this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;
        }

        let cycles;
        if (this.dest < 8) {
            cycles = 42;
        } else if (this.dest < 9) {
            cycles = 44;
        } else if (this.dest < 16) {
            cycles = 58;
        } else {
            cycles = 60;
        }
        return cycles;
    }

    // eXtended OPeration: XOP src ???
    // The CPU maintains a jump table starting at 0x0040, containing BLWP style
    // jumps for each operation. In addition, the new R11 gets a copy of the address of
    // the source operand.
    // Apparently not all consoles supported both XOP 1 and 2 (depends on the ROM?)
    // so it is probably rarely, if ever, used on the TI99.
    xop(): number {
        this.dest &= 0xf;

        this.readMemoryWord(this.source); // Unused
        const x1 = this.wp;
        this.setWp(this.readMemoryWord(0x0040 + (this.dest << 2)));
        this.writeMemoryWord(this.wp + 22, this.source);
        this.writeMemoryWord(this.wp + 26, x1);
        this.writeMemoryWord(this.wp + 28, this.pc);
        this.writeMemoryWord(this.wp + 30, this.st);
        this.setPc(this.readMemoryWord(0x0042 + (this.dest << 2)));
        this.setX();

        // skip_interrupt=1;

        return 36;
    }

    isIdle(): boolean {
        return false;
    }

    isSuspended(): boolean {
        return this.suspended;
    }

    setSuspended(suspended: boolean) {
        this.suspended = suspended;
    }

    setTracing(tracing: boolean) {
        this.tracing = tracing;
    }

    dumpProfile() {
        if (TMS9900.PROFILE) {
            const sortedProfile = [];
            for (let i = 0; i < 0x10000; i++) {
                sortedProfile[i] = {addr: i, count: this.profile[i]};
            }
            sortedProfile.sort(function (p1, p2) {
                return p2.count - p1.count;
            });
            this.log.info("Profile:");
            for (let j = 0; j < 16; j++) {
                this.log.info(Util.toHexWord(sortedProfile[j].addr) + ": " + sortedProfile[j].count + " cycles.");
            }
            this.profile = new Uint32Array(0x10000);
            this.log.info("--------");
        }
    }

    override getState(): any {
        const state = super.getState();
        state.suspended = this.suspended;
        return state;
    }

    override restoreState(state: any) {
        super.restoreState(state);
        this.suspended = state.suspended;
    }
}
