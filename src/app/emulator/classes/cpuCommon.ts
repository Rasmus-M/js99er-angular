import {Decoder} from "../../classes/decoder";
import {Util} from "../../classes/util";
import {Opcode} from "../../classes/opcode";
import {Log} from "../../classes/log";
import {CPU} from "../interfaces/cpu";

export abstract class CPUCommon {

    // Internal registers
    protected pc: number;
    protected wp: number;
    protected st: number;
    protected flagX: number;

    // Operands
    protected ts: number;
    protected td: number;
    protected dest: number;
    protected source: number;
    protected byte: number;

    // Counters
    protected cycles: number;
    protected illegalCount: number;

    // Constants
    protected readonly BIT_LGT       = 0x8000;
    protected readonly BIT_AGT       = 0x4000;
    protected readonly BIT_EQ        = 0x2000;
    protected readonly BIT_C         = 0x1000;
    protected readonly BIT_OV        = 0x0800;
    protected readonly BIT_OP        = 0x0400;
    protected readonly BIT_X         = 0x0200;

    // Assignment masks
    protected maskLGT_AGT_EQ         = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ;
    protected maskLGT_AGT_EQ_OP      = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OP;
    protected maskLGT_AGT_EQ_OV      = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OV;
    // carry here used for INC and NEG only
    protected maskLGT_AGT_EQ_OV_C    = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OV | this.BIT_C;

    // Lookup tables
    protected decoderTable = Decoder.getDecoderTable();
    protected wStatusLookup = this.buildWStatusLookupTable();
    protected bStatusLookup = this.buildBStatusLookupTable();

    // Logging
    protected cycleLog = new Int32Array(0x10000);

    protected instructions: {[key: string]: () => number } = {
        LI: this.li,
        AI: this.ai,
        ANDI: this.andi,
        ORI: this.ori,
        CI: this.ci,
        STWP: this.stwp,
        STST: this.stst,
        LWPI: this.lwpi,
        LIMI: this.limi,
        IDLE: this.idle,
        RSET: this.rset,
        RTWP: this.rtwp,
        CKON: undefined,
        CKOF: undefined,
        LREX: undefined,
        BLWP: this.blwp,
        B: this.b,
        X: this.x,
        CLR: this.clr,
        NEG: this.neg,
        INV: this.inv,
        INC: this.inc,
        INCT: this.inct,
        DEC: this.dec,
        DECT: this.dect,
        BL: this.bl,
        SWPB: this.swpb,
        SETO: this.seto,
        ABS: this.abs,
        SRA: this.sra,
        SRL: this.srl,
        SLA: this.sla,
        SRC: this.src,
        JMP: this.jmp,
        JLT: this.jlt,
        JLE: this.jle,
        JEQ: this.jeq,
        JHE: this.jhe,
        JGT: this.jgt,
        JNE: this.jne,
        JNC: this.jnc,
        JOC: this.joc,
        JNO: this.jno,
        JL: this.jl,
        JH: this.jh,
        JOP: this.jop,
        COC: this.coc,
        CZC: this.czc,
        XOR: this.xor,
        XOP: this.xop,
        LDCR: this.ldcr,
        STCR: this.stcr,
        MPY: this.mpy,
        DIV: this.div,
        SZC: this.szc,
        SZCB: this.szcb,
        S: this.s,
        SB: this.sb,
        C: this.c,
        CB: this.cb,
        A: this.a,
        AB: this.ab,
        MOV: this.mov,
        MOVB: this.movb,
        SOC: this.soc,
        SOCB: this.socb
    };

    // Misc
    protected breakpoint: number;
    protected auxBreakpoint: number;
    protected stoppedAtBreakpoint: boolean;
    protected tracing: boolean;
    protected log = Log.getLog();

    // Build the word status lookup table
    buildWStatusLookupTable() {
        const wStatusLookup = [];
        for (let i = 0; i < 0x10000; i++) {
            wStatusLookup[i] = 0;
            // LGT
            if (i > 0) { wStatusLookup[i] |= this.BIT_LGT; }
            // AGT
            if ((i > 0) && (i < 0x8000)) { wStatusLookup[i] |= this.BIT_AGT; }
            // EQ
            if (i === 0) { wStatusLookup[i] |= this.BIT_EQ; }
            // C
            if (i === 0) { wStatusLookup[i] |= this.BIT_C; }
            // OV
            if (i === 0x8000) { wStatusLookup[i] |= this.BIT_OV; }
        }
        return wStatusLookup;
    }

    // Build the byte status lookup table
    buildBStatusLookupTable() {
        const bStatusLookup = [];
        for (let i = 0; i < 0x100; i++) {
            bStatusLookup[i] = 0;
            // LGT
            if (i > 0) { bStatusLookup[i] |= this.BIT_LGT; }
            // AGT
            if ((i > 0) && (i < 0x80)) { bStatusLookup[i] |= this.BIT_AGT; }
            // EQ
            if (i === 0) { bStatusLookup[i] |= this.BIT_EQ; }
            // C
            if (i === 0) { bStatusLookup[i] |= this.BIT_C; }
            // OV
            if (i === 0x80) { bStatusLookup[i] |= this.BIT_OV; }
            // OP
            let p = 0;
            let b = 0x80;
            for (let n = 0; n < 8; n++) {
                if ((i & b) !== 0) {
                    p++;
                }
                b >>= 1;
            }
            if ((p & 1) !== 0) { bStatusLookup[i] |= this.BIT_OP; }
        }
        return bStatusLookup;
    }

    getPc(): number {
        return this.pc;
    }

    setPc(value) {
        if ((value & 1) !== 0) {
            this.log.warn("Setting odd PC from " + Util.toHexWord(this.pc));
        }
        this.pc = value & 0xFFFE;
    }

    inctPc() {
        this.setPc(this.pc + 2);
    }

    addPc(value) {
        this.setPc(this.pc + value);
    }

    getWp(): number {
        return this.wp;
    }

    setWp(value) {
        this.wp = value & 0xFFFE;
    }

    getInterruptMask(): number {
        return this.st & 0x000F;
    }

    addCycles(value) {
        this.cycles += value;
    }

    getCycles(): number {
        return this.cycles;
    }

    decodeOperands(opcode: Opcode, instr) {
        let cycles = 0;
        switch (opcode.format) {
            case 1:
                this.td = (instr & 0x0c00) >> 10;
                this.ts = (instr & 0x0030) >> 4;
                this.dest = (instr & 0x03c0) >> 6;
                this.source = (instr & 0x000f);
                this.byte = (instr & 0x1000) >> 12;
                cycles += this.fixSource();
                break;
            case 2:
                this.dest = (instr & 0x00ff);
                break;
            case 3:
                this.td = 0;
                this.ts = (instr & 0x0030) >> 4;
                this.dest = (instr & 0x03c0) >> 6;
                this.source = (instr & 0x000f);
                this.byte = 0;
                cycles += this.fixSource();
                break;
            case 4:
                // No destination (CRU ops)
                this.dest = (instr & 0x03c0) >> 6;
                this.ts = (instr & 0x0030) >> 4;
                this.source = (instr & 0x000f);
                this.byte = (this.dest > 8 ? 0 : 1);
                cycles += this.fixSource();
                break;
            case 5:
                this.dest = (instr & 0x00f0) >> 4;
                this.source = (instr & 0x000f);
                this.source = this.wp + (this.source << 1);
                break;
            case 6:
                // No destination (single argument instructions)
                this.ts = (instr & 0x0030) >> 4;
                this.source = instr & 0x000f;
                this.byte = 0;
                cycles += this.fixSource();
                break;
            case 7:
                // no argument
                break;
            case 8:
                if (opcode.id === "STST" || opcode.id === "STWP") {
                    this.dest = (instr & 0x000f);
                    this.dest = this.wp + (this.dest << 1);
                } else {
                    this.dest = (instr & 0x000f);
                    this.dest = this.wp + (this.dest << 1);
                    this.source = this.readMemoryWord(this.pc);
                    this.inctPc();
                }
                break;
            case 9:
                // No destination here (dest calc'd after call) (DIV, MUL, XOP)
                this.dest = (instr & 0x03c0) >> 6;
                this.ts = (instr & 0x0030) >> 4;
                this.source = (instr & 0x000f);
                this.byte = 0;
                cycles += this.fixSource();
                break;
            default:
                break;
        }
        return cycles;
    }

    // Get addresses for the destination and source arguments
    // Note: the format code letters are the official notation from Texas
    // instruments. See their TMS9900 documentation for details.
    // (Td, Ts, D, S, B, etc)

    fixSource(): number {
        let cycles = 0;
        let temp, t2;
        // source type
        switch (this.ts) {
            case 0:
                // register	(R1) Address is the address of the register
                this.source = this.wp + (this.source << 1);
                break;
            case 1:
                // register indirect (*R1) Address is the contents of the register
                this.source = this.readMemoryWord(this.wp + (this.source << 1));
                cycles += 4;
                break;
            case 2:
                if (this.source !== 0) {
                    // indexed (@>1000(R1))	Address is the contents of the argument plus the contents of the register
                    this.source = this.readMemoryWord(this.pc) + this.readMemoryWord(this.wp + (this.source << 1));
                } else {
                    // symbolic	 (@>1000) Address is the contents of the argument
                    this.source = this.readMemoryWord(this.pc);
                }
                this.inctPc();
                cycles += 8;
                break;
            case 3:
                t2 = this.wp + (this.source << 1);
                temp = this.readMemoryWord(t2);
                this.source = temp;
                // After we have the final address, we can increment the register
                // (so MOV *R0+ returns the post increment if R0=adr(R0))
                const val = this.getMemoryWord(t2);                    // don't count this read for cycles
                this.writeMemoryWord(t2, val + (this.byte === 1 ? 1 : 2)); // do count this write
                cycles += this.byte === 1 ? 6 : 8;
                break;
        }
        return cycles;
    }

    fixDest(): number {
        let cycles = 0;
        let temp, t2;
        // destination type
        // same as the source types
        switch (this.td) {
            case 0:
                // register
                this.dest = this.wp + (this.dest << 1);
                break;
            case 1:
                // register indirect
                this.dest = this.readMemoryWord(this.wp + (this.dest << 1));
                cycles += 4;
                break;
            case 2:
                if (this.dest !== 0) {
                    // indexed
                    this.dest = this.readMemoryWord(this.pc) + this.readMemoryWord(this.wp + (this.dest << 1));
                } else {
                    // symbolic
                    this.dest = this.readMemoryWord(this.pc);
                }
                this.inctPc();
                cycles += 8;
                break;
            case 3:
                t2 = this.wp + (this.dest << 1);
                temp = this.readMemoryWord(t2);
                this.dest = temp;
                // After we have the final address, we can increment the register
                // (so MOV *R0+ returns the post increment if R0=adr(R0))
                const val = this.getMemoryWord(t2);                    // don't count this read for cycles
                this.writeMemoryWord(t2, val + (this.byte === 1 ? 1 : 2)); // do count this write
                cycles += this.byte === 1 ? 6 : 8;
                break;
        }
        return cycles;
    }

    abstract execute(instruction: number);

    abstract writeMemoryWord(addr: number, w: number);

    abstract writeMemoryByte(addr: number, b: number);

    abstract readMemoryWord(addr: number): number;

    abstract readMemoryByte(addr: number): number;

    abstract getMemoryWord(addr: number): number;

    // Load Immediate: LI src, imm
    li(): number {
        this.writeMemoryWord(this.dest, this.source);
        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[this.source] & this.maskLGT_AGT_EQ;
        return 12;
    }

    // Add Immediate: AI src, imm
    ai(): number {
        const x1 = this.readMemoryWord(this.dest);

        const x3 = (x1 + this.source) & 0xFFFF;
        this.writeMemoryWord(this.dest, x3);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        if (x3 < x1) { this.setC(); }
        if (((x1 & 0x8000) === (this.source & 0x8000)) && ((x3 & 0x8000) !== (this.source & 0x8000))) { this.setOV(); }

        return 14;
    }

    // AND Immediate: ANDI src, imm
    andi(): number {
        const x1 = this.readMemoryWord(this.dest);
        const x2 = x1 & this.source;
        this.writeMemoryWord(this.dest, x2);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x2] & this.maskLGT_AGT_EQ;

        return 14;
    }

    // OR Immediate: ORI src, imm
    ori(): number {
        const x1 = this.readMemoryWord(this.dest);
        const x2 = x1 | this.source;
        this.writeMemoryWord(this.dest, x2);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x2] & this.maskLGT_AGT_EQ;

        return 14;
    }

    // Compare Immediate: CI src, imm
    ci(): number {
        const x3 = this.readMemoryWord(this.dest);

        this.resetLGT_AGT_EQ();
        if (x3 > this.source) { this.setLGT(); }
        if (x3 === this.source) { this.setEQ(); }
        if ((x3 & 0x8000) === (this.source & 0x8000)) {
            if (x3 > this.source) { this.setAGT(); }
        } else {
            if ((this.source & 0x8000) !== 0) { this.setAGT(); }
        }

        return 14;
    }

    // STore Workspace Pointer: STWP src
    // Copy the workspace pointer to memory
    stwp(): number {
        this.writeMemoryWord(this.dest, this.wp);
        return 8;
    }

    // STore STatus: STST src
    // Copy the status register to memory
    stst(): number {
        this.writeMemoryWord(this.dest, this.st);
        return 8;
    }

    // Load Workspace Pointer Immediate: LWPI imm
    // changes the Workspace Pointer
    lwpi(): number {
        this.setWp(this.source);
        return 10;
    }

    // Load Interrupt Mask Immediate: LIMI imm
    // Sets the CPU interrupt mask
    limi(): number {
        this.st = (this.st & 0xfff0) | (this.source & 0xf);
        return 16;
    }

    // This will set A0-A2 to 011 and pulse CRUCLK (so not emulated)
    // However, it does have an effect, it zeros the interrupt mask
    rset(): number {
        this.st &= 0xfff0;
        return 12;
    }

    // Branch and Load Workspace Pointer: BLWP src
    // A context switch. The src address points to a 2 word table.
    // the first word is the new workspace address, the second is
    // the address to branch to. The current Workspace Pointer,
    // Program Counter (return address), and Status register are
    // stored in the new R13, R14 and R15, respectively
    // Return is performed with RTWP
    blwp(): number {
        const x1 = this.wp;
        this.setWp(this.readMemoryWord(this.source));
        this.writeMemoryWord(this.wp + 26, x1);
        this.writeMemoryWord(this.wp + 28, this.pc);
        this.writeMemoryWord(this.wp + 30, this.st);
        this.setPc(this.readMemoryWord(this.source + 2));

        // skip_interrupt=1;

        return 26;
    }

    // Branch: B src
    // Unconditional absolute branch
    b(): number {
        this.readMemoryWord(this.source); // Unused
        this.setPc(this.source);
        return 8;
    }

    // eXecute: X src
    // The argument is interpreted as an instruction and executed
    x(): number {
        if (this.flagX !== 0) {
            this.log.info("Recursive X instruction!");
        }

        const xInstr = this.readMemoryWord(this.source);
        // skip_interrupt=1;	    // (ends up having no effect because we call the function inline, but technically still correct)

        let cycles = 8 - 4;	        // For X, add this time to the execution time of the instruction found at the source address, minus 4 clock cycles and 1 memory access.
        this.flagX = this.pc;	    // set flag and save true post-X address for the JMPs (AFTER X's operands but BEFORE the instruction's operands, if any)
        cycles += this.execute(xInstr);
        this.flagX = 0;			    // clear flag

        return cycles;
    }

    // CLeaR: CLR src
    // sets word to 0
    clr(): number {
        this.writeMemoryWord(this.source, 0);
        return 10;
    }

    // NEGate: NEG src
    neg(): number {
        let x1 = this.readMemoryWord(this.source);

        x1 = ((~x1) + 1) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV_C;

        return 12;
    }

    // INVert: INV src
    inv(): number {
        let x1 = this.readMemoryWord(this.source);
        x1 = (~x1) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        return 10;
    }

    // INCrement: INC src
    inc(): number {
        let x1 = this.readMemoryWord(this.source);

        x1 = (x1 + 1) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV_C;

        return 10;
    }

    // INCrement by Two: INCT src
    inct(): number {
        let x1 = this.readMemoryWord(this.source);

        x1 = (x1 + 2) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x1 < 2) { this.setC(); }
        if ((x1 === 0x8000) || (x1 === 0x8001)) { this.setOV(); }

        return 10;
    }

    // DECrement: DEC src
    dec(): number {
        let x1 = this.readMemoryWord(this.source);

        x1 = (x1 - 1) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x1 !== 0xffff) { this.setC(); }
        if (x1 === 0x7fff) { this.setOV(); }

        return 10;
    }

    // DECrement by Two: DECT src
    dect(): number {
        let x1 = this.readMemoryWord(this.source);

        x1 = (x1 - 2) & 0xFFFF;
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        // if (x1 < 0xfffe) this.set_C();
        if (x1 < 0xfffe) { this.setC(); }
        if ((x1 === 0x7fff) || (x1 === 0x7ffe)) { this.setOV(); }

        return 10;
    }

    bl(): number {
        // Branch and Link: BL src
        // Essentially a subroutine jump - return address is stored in R11
        // Note there is no stack, and no official return function.
        // A return is simply B *R11. Some assemblers define RT as this.

        this.readMemoryWord(this.source); // Unused
        this.writeMemoryWord(this.wp + 22, this.pc);
        this.setPc(this.source);

        return 12;
    }

    // SWaP Bytes: SWPB src
    // swap the high and low bytes of a word
    swpb(): number {
        const x1 = this.readMemoryWord(this.source);

        const x2 = ((x1 & 0xff) << 8) | (x1 >> 8);
        this.writeMemoryWord(this.source, x2);

        return 10;
    }

    // SET to One: SETO src
    // sets word to 0xffff
    seto(): number {
        this.writeMemoryWord(this.source, 0xffff);

        return 10;
    }

    // ABSolute value: ABS src
    abs(): number {
        let cycles = 0;
        const x1 = this.readMemoryWord(this.source);

        if ((x1 & 0x8000) !== 0) {
            const x2 = ((~x1) + 1) & 0xFFFF;	// if negative, make positive
            this.writeMemoryWord(this.source, x2);
            cycles += 2;
        }

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV;

        return cycles + 12;
    }

    // Shift Right Arithmetic: SRA src, dst
    // For the shift instructions, a count of '0' means use the
    // value in register 0. If THAT is zero, the count is 16.
    // The arithmetic operations preserve the sign bit
    sra(): number {
        let cycles = 0;
        if (this.dest === 0) {
            this.dest = this.readMemoryWord(this.wp) & 0xf;
            if (this.dest === 0) { this.dest = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.source);
        const x4 = x1 & 0x8000;
        let x3 = 0;

        for (let x2 = 0; x2 < this.dest; x2++) {
            x3 = x1 & 1;   /* save carry */
            x1 = x1 >> 1;  /* shift once */
            x1 = x1 | x4;  /* extend sign bit */
        }
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.dest;
    }

    // Shift Right Logical: SRL src, dst
    // The logical shifts do not preserve the sign
    srl(): number {
        let cycles = 0;
        if (this.dest === 0) {
            this.dest = this.readMemoryWord(this.wp) & 0xf;
            if (this.dest === 0) { this.dest = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.source);
        let x3 = 0;

        for (let x2 = 0; x2 < this.dest; x2++) {
            x3 = x1 & 1;
            x1 = x1 >> 1;
        }
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.dest;
    }

    // Shift Left Arithmetic: SLA src, dst
    sla(): number {
        let cycles = 0;
        if (this.dest === 0) {
            this.dest = this.readMemoryWord(this.wp) & 0xf;
            if (this.dest === 0) { this.dest = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.source);
        const x4 = x1 & 0x8000;
        this.resetEQ_LGT_AGT_C_OV();

        let x3 = 0;
        for (let x2 = 0; x2 < this.dest; x2++) {
            x3 = x1 & 0x8000;
            x1 = x1 << 1;
            if ((x1 & 0x8000) !== x4) { this.setOV(); }
        }
        x1 = x1 & 0xFFFF;
        this.writeMemoryWord(this.source , x1);

        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.dest;
    }

    // Shift Right Circular: SRC src, dst
    // Circular shifts pop bits off one end and onto the other
    // The carry bit is not a part of these shifts, but it set
    // as appropriate
    src(): number {
        let cycles = 0;
        if (this.dest === 0) {
            this.dest = this.readMemoryWord(this.wp) & 0xf;
            if (this.dest === 0) { this.dest = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.source);
        let x4;
        for (let x2 = 0; x2 < this.dest; x2++) {
            x4 = x1 & 0x1;
            x1 = x1 >> 1;
            if (x4 !== 0) {
                x1 = x1 | 0x8000;
            }
        }
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x4 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.dest;
    }

    // JuMP: JMP dsp
    // (unconditional)
    jmp(): number {
        if (this.flagX !== 0) {
            this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
        }
        if ((this.dest & 0x80) !== 0) {
            this.dest = 128 - (this.dest & 0x7f);
            this.addPc(-(this.dest + this.dest));
        } else {
            this.addPc(this.dest + this.dest);
        }
        return 10;
    }

    // Jump if Less Than: JLT dsp
    jlt(): number {
        if (this.getAGT() === 0 && this.getEQ() === 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if Low or Equal: JLE dsp
    jle(): number {
        if ((this.getLGT() === 0) || (this.getEQ() !== 0)) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if equal: JEQ dsp
    // Conditional relative branch. The displacement is a signed byte representing
    // the number of words to branch
    jeq(): number {
        if (this.getEQ() !== 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if High or Equal: JHE dsp
    jhe(): number {
        if ((this.getLGT() !== 0) || (this.getEQ() !== 0)) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if Greater Than: JGT dsp
    jgt(): number {
        if (this.getAGT() !== 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if Not Equal: JNE dsp
    jne(): number {
        if (this.getEQ() === 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }
            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if No Carry: JNC dsp
    jnc(): number {
        if (this.getC() === 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump On Carry: JOC dsp
    joc(): number {
        if (this.getC() !== 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if No Overflow: JNO dsp
    jno(): number {
        if (this.getOV() === 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    jl(): number {
        if ((this.getLGT() === 0) && (this.getEQ() === 0)) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump if High: JH dsp
    jh(): number {
        if ((this.getLGT() !== 0) && (this.getEQ() === 0)) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Jump on Odd Parity: JOP dsp
    jop(): number {
        if (this.getOP() !== 0) {
            if (this.flagX !== 0) {
                this.setPc(this.flagX);	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.dest & 0x80) !== 0) {
                this.dest = 128 - (this.dest & 0x7f);
                this.addPc(-(this.dest + this.dest));
            } else {
                this.addPc(this.dest + this.dest);
            }
            return 10;
        } else {
            return 8;
        }
    }

    // Compare Ones Corresponding: COC src, dst
    // Basically comparing against a mask, if all set bits in the src match
    // set bits in the dest (mask), the equal bit is set
    coc(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);

        const x3 = x1 & x2;

        if (x3 === x1) { this.setEQ(); } else { this.resetEQ(); }

        return cycles + 14;
    }

    // Compare Zeros Corresponding: CZC src, dst
    // The opposite of COC. Each set bit in the dst (mask) must
    // match up with a zero bit in the src to set the equals flag
    czc(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);

        const x3 = x1 & x2;

        if (x3 === 0) { this.setEQ(); } else { this.resetEQ(); }

        return cycles + 14;
    }

    // eXclusive OR: XOR src, dst
    xor(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);

        const x3 = (x1 ^ x2) & 0xFFFF;
        this.writeMemoryWord(this.dest, x3);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // MultiPlY: MPY src, dst
    // Multiply src by dest and store 32-bit result
    // Note: src and dest are unsigned.
    mpy(): number {
        const x1 = this.readMemoryWord(this.source);

        this.dest = this.wp + (this.dest << 1);
        let x3 = this.readMemoryWord(this.dest);
        x3 = x3 * x1;
        this.writeMemoryWord(this.dest, (x3 >> 16) & 0xFFFF);
        this.writeMemoryWord(this.dest + 2, (x3 & 0xFFFF));

        return 52;
    }

    // DIVide: DIV src, dst
    // Dest, a 2 word number, is divided by src. The result is stored as two words at the dst:
    // the first is the whole number result, the second is the remainder
    div(): number {
        const x2 = this.readMemoryWord(this.source);

        this.dest = this.wp + (this.dest << 1);
        let x3 = this.readMemoryWord(this.dest);

        if (x2 > x3) {		// x2 can not be zero because they're unsigned
            x3 = x3 * 65536 + this.readMemoryWord(this.dest + 2); // Cannot use shift here because then we get a 32-bit signed integer
            let x1 = x3 / x2;
            this.writeMemoryWord(this.dest, x1 & 0xFFFF);
            x1 = x3 % x2;
            this.writeMemoryWord(this.dest + 2, x1 & 0xFFFF);
            this.resetOV();
            return 92;		// This is not accurate. (Up to 124 "depends on the partial quotient after each clock cycle during execution")
        } else {
            this.setOV();	// division wasn't possible - change nothing
            return 16;
        }
    }

    // Set Zeros Corresponding: SZC src, dst
    // Zero all bits in dest that are zeroed in src
    szc(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);
        const x3 = (~x1) & x2;
        this.writeMemoryWord(this.dest, x3);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // Set Zeros Corresponding, Byte: SZCB src, dst
    szcb(): number {
        const x1 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryByte(this.dest);
        const x3 = (~x1) & x2;
        this.writeMemoryByte(this.dest, x3);

        this.resetLGT_AGT_EQ_OP();
        this.st |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    // Subtract: S src, dst
    s(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);
        const x3 = (x2 - x1) & 0xFFFF;
        this.writeMemoryWord(this.dest, x3);

        this.resetEQ_LGT_AGT_C_OV();
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        // any number minus 0 sets carry.. Tursi's theory is that converting 0 to the two's complement
        // is causing the carry flag to be set.
        if ((x3 < x2) || (x1 === 0)) { this.setC(); }
        if (((x1 & 0x8000) !== (x2 & 0x8000)) && ((x3 & 0x8000) !== (x2 & 0x8000))) { this.setOV(); }

        return cycles + 14;
    }

    // Subtract Byte: SB src, dst
    sb(): number {
        const x1 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryByte(this.dest);
        const x3 = (x2 - x1) & 0xFF;
        this.writeMemoryByte(this.dest, x3);

        this.resetEQ_LGT_AGT_C_OV_OP();
        this.st |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        // any number minus 0 sets carry.. Tursi's theory is that converting 0 to the two's complement
        // is causing the carry flag to be set.
        if ((x3 < x2) || (x1 === 0)) { this.setC(); }
        if (((x1 & 0x80) !== (x2 & 0x80)) && ((x3 & 0x80) !== (x2 & 0x80))) { this.setOV(); }

        return cycles + 14;
    }

    // Compare words: C src, dst
    c(): number {
        const x3 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x4 = this.readMemoryWord(this.dest);

        this.resetLGT_AGT_EQ();
        if (x3 > x4) { this.setLGT(); }
        if (x3 === x4) { this.setEQ(); }
        if ((x3 & 0x8000) === (x4 & 0x8000)) {
            if (x3 > x4) { this.setAGT(); }
        } else {
            if ((x4 & 0x8000) !== 0) { this.setAGT(); }
        }
        return cycles + 14;
    }

    // CompareBytes: CB src, dst
    cb(): number {
        const x3 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        const x4 = this.readMemoryByte(this.dest);

        this.resetLGT_AGT_EQ_OP();
        if (x3 > x4) { this.setLGT(); }
        if (x3 === x4) { this.setEQ(); }
        if ((x3 & 0x80) === (x4 & 0x80)) {
            if (x3 > x4) { this.setAGT(); }
        } else {
            if ((x4 & 0x80) !== 0) { this.setAGT(); }
        }
        this.st |= this.bStatusLookup[x3] & this.BIT_OP;

        return cycles + 14;
    }

    // Add words: A src, dst
    a(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);
        const x3 = (x2 + x1) & 0xFFFF;
        this.writeMemoryWord(this.dest, x3);

        this.resetEQ_LGT_AGT_C_OV();	// We come out with either EQ or LGT, never both
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        if (x3 < x2) { this.setC(); }	// if it wrapped around, set carry
        // if it overflowed or underflowed (signed math), set overflow
        if (((x1 & 0x8000) === (x2 & 0x8000)) && ((x3 & 0x8000) !== (x2 & 0x8000))) { this.setOV(); }

        return cycles + 14;
    }

    // Add bytes: A src, dst
    ab(): number {
        const x1 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryByte(this.dest);
        const x3 = (x2 + x1) & 0xFF;
        this.writeMemoryByte(this.dest, x3);

        this.resetEQ_LGT_AGT_C_OV_OP();
        this.st |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        if (x3 < x2) { this.setC(); }	// if it wrapped around, set carry
        // if it overflowed or underflowed (signed math), set overflow
        if (((x1 & 0x80) === (x2 & 0x80)) && ((x3 & 0x80) !== (x2 & 0x80))) { this.setOV(); }

        return cycles + 14;
    }

    // MOVe words: MOV src, dst
    mov(): number {
        const x1 = this.readMemoryWord(this.source);
        const cycles = this.fixDest();

        this.writeMemoryWord(this.dest, x1);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // MOVe Bytes: MOVB src, dst
    movb(): number {
        const x1 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        this.writeMemoryByte(this.dest, x1);

        this.resetLGT_AGT_EQ_OP();
        this.st |= this.bStatusLookup[x1] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    // Set Ones Corresponding: SOC src, dst
    // Essentially performs an OR - setting all the bits in dst that
    // are set in src
    soc(): number {
        const x1 = this.readMemoryWord(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryWord(this.dest);
        const x3 = x1 | x2;
        this.writeMemoryWord(this.dest, x3);

        this.resetLGT_AGT_EQ();
        this.st |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    socb(): number {
        const x1 = this.readMemoryByte(this.source);

        const cycles = this.fixDest();
        const x2 = this.readMemoryByte(this.dest);
        const x3 = x1 | x2;
        this.writeMemoryByte(this.dest, x3);

        this.resetLGT_AGT_EQ_OP();
        this.st |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    abstract idle(): number;
    abstract rtwp(): number;
    abstract ldcr(): number;
    abstract stcr(): number;
    abstract xop(): number;

    getLGT() { return (this.st & this.BIT_LGT); }	// Logical Greater Than
    getAGT() { return (this.st & this.BIT_AGT); }	// Arithmetic Greater Than
    getEQ() { return (this.st & this.BIT_EQ); }	    // Equal
    getC() { return (this.st & this.BIT_C); }	    // Carry
    getOV() { return (this.st & this.BIT_OV); }	    // Overflow
    getOP() { return (this.st & this.BIT_OP); }	    // Odd Parity
    getX() { return (this.st & this.BIT_X); }	    // Set during an XOP instruction

    setLGT() { this.st |= 0x8000; }       		    // Logical Greater than: >0x0000
    setAGT() { this.st |= 0x4000; }		            // Arithmetic Greater than: >0x0000 and <0x8000
    setEQ() { this.st |= 0x2000; }       		    // Equal: ==0x0000
    setC() { this.st |= 0x1000; }		            // Carry: carry occurred during operation
    setOV() { this.st |= 0x0800; }       		    // Overflow: overflow occurred during operation
    setOP() { this.st |= 0x0400; }	                // Odd parity: word has odd number of '1' bits
    setX() { this.st |= 0x0200; }		            // Executing 'X' statement

    resetLGT() { this.st &= 0x7fff; }               // Clear the flags
    resetAGT() { this.st &= 0xbfff; }
    resetEQ() { this.st &= 0xdfff; }
    resetC() { this.st &= 0xefff; }
    resetOV() { this.st &= 0xf7ff; }
    resetOP() { this.st &= 0xfbff; }
    resetX() { this.st &= 0xfdff; }

    // Group clears
    resetEQ_LGT() { this.st &= 0x5fff; }
    resetLGT_AGT_EQ() { this.st &= 0x1fff; }
    resetLGT_AGT_EQ_OP() { this.st &= 0x1bff; }
    resetEQ_LGT_AGT_OV() { this.st &= 0x17ff; }
    resetEQ_LGT_AGT_C() { this.st &= 0x0fff; }
    resetEQ_LGT_AGT_C_OV() { this.st &= 0x7ff; }
    resetEQ_LGT_AGT_C_OV_OP() { this.st &= 0x3ff; }

    getBreakpoint(): number {
        return this.pc === this.breakpoint ? this.breakpoint : (this.pc === this.auxBreakpoint ? this.auxBreakpoint : this.breakpoint);
    }

    setBreakpoint(addr) {
        this.breakpoint = addr;
    }

    breakAfterNext(): void {
        const instruction = this.readMemoryWord(this.pc);
        const opcode: Opcode = this.decoderTable[instruction];
        this.auxBreakpoint = this.getPc() + this.getInstructionSize(instruction, opcode);
    }

    getInstructionSize(instruction: number, opcode: Opcode): number {
        let size = 2;
        let ts;
        let td;
        switch (opcode.format) {
            case 1:
                // Two general addresses
                td = (instruction & 0x0c00) >> 10;
                ts = (instruction & 0x0030) >> 4;
                size += this.gaSize(ts) + this.gaSize(td);
                break;
            case 2:
                // Jump and CRU bit
                break;
            case 3:
                // Logical
                ts = (instruction & 0x0030) >> 4;
                size += this.gaSize(ts);
                break;
            case 4:
                // CRU multi bit
                ts = (instruction & 0x0030) >> 4;
                size += this.gaSize(ts);
                break;
            case 5:
                // Register shift
                break;
            case 6:
                // Single address
                ts = (instruction & 0x0030) >> 4;
                size += this.gaSize(ts);
                break;
            case 7:
                // Control (no arguments)
                break;
            case 8:
                // Immediate
                if (opcode.id !== 'STST' && opcode.id !== 'STWP') {
                    size += 2;
                }
                break;
            case 9:
                // Multiply, divide, XOP
                ts = (instruction & 0x0030) >> 4;
                size += this.gaSize(ts);
                break;
            default:
                break;
        }
        return size;
    }

    gaSize(type: number): number {
        return type === 2 ? 2 : 0;
    }

    isStoppedAtBreakpoint(): boolean {
        return this.stoppedAtBreakpoint;
    }

    atBreakpoint(): boolean {
        return this.pc === this.breakpoint || this.pc === this.auxBreakpoint;
    }

    logRegs() {
        this.log.info(this.getRegsString() + this.getInternalRegsString());
    }

    getCycleLog() {
        return this.cycleLog;
    }

    getInternalRegsString(): string {
        return "PC :" + Util.toHexWord(this.pc) + " WP :" + Util.toHexWord(this.wp) + " ST :" + Util.toHexWord(this.st);
    }

    getRegsString(): string {
        let s = "";
        for (let i = 0; i < 16; i++) {
            s += "R" + i + ":" + Util.toHexWord(this.getReg(i)) + " ";
        }
        return s;
    }

    getReg(i): number {
        return this.getMemoryWord(this.wp + 2 * i);
    }

    getRegsStringFormatted(): string {
        let s = "";
        for (let i = 0; i < 16; i++) {
            s += "R" + i + (i < 10 ? " " : "") + ":" + Util.toHexWord(this.getMemoryWord(this.wp + 2 * i)) + (i % 4 === 3 ? "\n" : " ");
        }
        return s;
    }

    getState(): any {
        return {
            pc: this.pc,
            wp: this.wp,
            st: this.st,
            flagX: this.flagX,
            cycles: this.cycles,
            breakpoint: this.breakpoint,
            auxBreakpoint: this.auxBreakpoint,
            illegalCount: this.illegalCount,
        };
    }

    restoreState(state: any) {
        this.pc = state.pc;
        this.log.info("PC restored to " + Util.toHexWord(this.pc));
        this.wp = state.wp;
        this.st = state.st;
        this.flagX = state.flagX;
        this.cycles = state.cycles;
        this.breakpoint = state.breakpoint;
        this.auxBreakpoint = state.auxBreakpoint;
        this.illegalCount = state.illegalCount;
    }
}
