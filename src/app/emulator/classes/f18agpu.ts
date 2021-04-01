import {CPU} from '../interfaces/cpu';
import {F18A} from './f18a';
import {Decoder} from '../../classes/decoder';
import {Log} from '../../classes/log';
import {F18AFlash} from './f18aflash';
import {Util} from '../../classes/util';
import {Opcode} from "../../classes/opcode";

export class F18AGPU implements CPU {

    static readonly SPEED_DIVIDER = 1.2;
    static readonly CYCLES_PER_FRAME = 1250000 / F18AGPU.SPEED_DIVIDER; // Speed is approximately 25 times that of the normal CPU
    static readonly CYCLES_PER_SCANLINE = 4000 / F18AGPU.SPEED_DIVIDER;

    static readonly PRELOAD = [
        "020F47FE100D4036405A409440B440FAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0CA0411C034004C1D0603F000971C0214006069010F7C0203F02C0603F04C0A0",
        "3F06D0E03F011305D010DC40060216FD1003DC70060216FD045B0D0B06A040B40F0BC1C7131604C0D02060040A30C0C004C102020400CC01060216FD04C0D020",
        "415106C00A30A0030CA041AED8204151B000045BD820411A3F00020041D6C8003F0202004006C8003F0402004010C8003F06045B04C7D0203F011313C0204118",
        "06000CA041520204000502053F02020641428DB51603060416FC1009060016F11009C0203F020CA04152804014030CA0419A0547D807B000045B0D0B06A040B4",
        "0F0BC1C71304C0203F0C0CA041AE045B050000000000000000000000020041100201411502020B0003A032023230323032303600020200063631060216FD03C0",
        "0C0020202020202020202020000000000000880041181A03C06041180C000D000A4002010B00A020411617010581A0604114020341420202001003A0320106C1",
        "3201320006C0320036003633060216FD03C00F00C06041180C0002003F000201414202020008CC31060216FD0C000201414CD0A0415006C2D0A0414F02030B00",
        "03A0320332313231323136013630060216FD03C00C000340"
    ];

    private f18a: F18A;
    private vdpRAM: Uint8Array;
    private flash: F18AFlash;
    private flashLoaded = false;

    private cpuIdle: boolean;
    private WP = 0xF000; // Place workspace in an unused part of the memory space

    // Internal registers
    private PC: number;
    private ST: number;
    private flagX: number;

    // Operands
    private Ts: number;
    private Td: number;
    private D: number;
    private S: number;
    private B: number;

    // Counters
    private cycles = 0;

    // Constants
    private readonly BIT_LGT       = 0x8000;
    private readonly BIT_AGT       = 0x4000;
    private readonly BIT_EQ        = 0x2000;
    private readonly BIT_C         = 0x1000;
    private readonly BIT_OV        = 0x0800;
    private readonly BIT_OP        = 0x0400;
    private readonly BIT_X         = 0x0200;

    // Assignment masks
    private maskLGT_AGT_EQ         = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ;
    private maskLGT_AGT_EQ_OP      = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OP;
    private maskLGT_AGT_EQ_OV      = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OV;
    // carry here used for INC and NEG only
    private maskLGT_AGT_EQ_OV_C    = this.BIT_LGT | this.BIT_AGT | this.BIT_EQ | this.BIT_OV | this.BIT_C;

    // Lookup tables
    private decoderTable = Decoder.getDecoderTable();
    private wStatusLookup = this.buildWStatusLookupTable();
    private bStatusLookup = this.buildBStatusLookupTable();

    private instructions: {[key: string]: () => number } = {
        LI: this.li,
        AI: this.ai,
        ANDI: this.andi,
        ORI: this.ori,
        CI: this.ci,
        STST: this.stst,
        IDLE: this.idle,
        RTWP: this.rtwp,
        CKON: this.ckon,
        CKOF: this.ckof,
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
        // New F18A opcodes
        RET: this.ret,
        CALL: this.call,
        PUSH: this.push,
        SLC: this.slc,
        POP: this.pop,
        // ...
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
    private breakpoint: number;
    private otherBreakpoint: number;
    private illegalCount: number;
    private cyclesRemaining: number;
    private tracing: boolean;
    private log: Log = Log.getLog();

    constructor(f18a) {
        this.f18a = f18a;
    }

    reset() {
        this.intReset();

        this.vdpRAM = this.f18a.getRAM();
        this.WP = 0xF000; // Place workspace in an unused part of the memory space
        for (let i = 0; i < 32; i++) {
            this.vdpRAM[this.WP + i] = 0;
        }

        // Flash RAM
        if (!this.flash) {
            const gpu = this;
            this.flash = new F18AFlash(function (restored) {
                if (restored) {
                    gpu.flashLoaded = true;
                }
            });
        } else {
            this.flash.reset();
        }

        this.preload();
    }

    intReset() {
        this.cpuIdle = true;

        // Internal registers
        this.PC = 0;
        this.ST = 0x01c0;
        this.flagX = 0;

        // Operands
        this.Ts = 0;
        this.Td = 0;
        this.D = 0;
        this.S = 0;
        this.B = 0;

        // Misc
        this.cycles = 0;
        this.cyclesRemaining = 0;
        this.illegalCount = 0;
    }

    preload() {
        const preload = this.hexArrayToBin(F18AGPU.PRELOAD);
        for (let a = 0; a < preload.length; a++) {
            this.vdpRAM[0x4000 + a] = preload[a];
        }
        this.setPC(0x4000);
    }

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
            let x = (i & 0xFF);
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
            let z;
            for (z = 0; x !== 0; x = (x & (x - 1)) & 0xFF) { z++; }						// black magic?
            if ((z & 1) !== 0) { bStatusLookup[i] |= this.BIT_OP; }		    // set bit if an odd number
        }
        return bStatusLookup;
    }

    run(cyclesToRun: number, skipBreakpoint?: boolean): number {
        const startCycles = this.cycles;
        while (!this.cpuIdle && this.cycles - startCycles < cyclesToRun) {
            // Handle breakpoint
            const atBreakpoint = this.atBreakpoint() && !skipBreakpoint;
            if (atBreakpoint) {
                this.log.info("At breakpoint " + Util.toHexWord(this.breakpoint));
                this.log.info(this.getRegsStringFormatted());
                this.cyclesRemaining = cyclesToRun - (this.cycles - startCycles);
                cyclesToRun = -1;
            } else {
                // Execute instruction
                const instruction = this.readMemoryWord(this.PC);
                this.inctPC();
                this.addCycles(this.execute(instruction));
                skipBreakpoint = false;
            }
        }
        return (this.cycles - startCycles) - cyclesToRun;
    }

    resume() {
        this.run(this.cyclesRemaining);
    }

    execute(instruction: number): number {
        const opcode: Opcode = this.decoderTable[instruction];
        if (opcode) {
            let cycles = this.decodeOperands(opcode, instruction);
            const f = this.instructions[opcode.id];
            if (f) {
                cycles += f.call(this);
            } else {
                this.log.info(Util.toHexWord((this.PC - 2) & 0xFFFF) + " " + Util.toHexWord(instruction) + " " + opcode.id + ": GPU Not implemented");
            }
            return cycles;
        } else {
            if (this.illegalCount < 256) {
                this.log.info(Util.toHexWord(((this.PC - 2) & 0xFFFF)) + " " + Util.toHexWord(instruction) + ": GPU Illegal" + (this.illegalCount === 255 ? " (suppressing further messages)" : ""));
            }
            this.illegalCount++;
            return 10;
        }
    }

    isIdle() {
        return this.cpuIdle;
    }

    setIdle(idle) {
        this.cpuIdle = idle;
    }

    getPC(): number {
        return this.PC;
    }

    setPC(value) {
        this.PC = value;
        this.setIdle(false);
    }

    setWP(value) {
        this.log.warn("setWP not implemented.");
    }

    inctPC() {
        this.PC = (this.PC + 2) & 0xFFFF;
    }

    addPC(value) {
        this.PC = (this.PC + value) & 0xFFFF;
    }

    addCycles(value) {
        this.cycles += value;
    }

    decodeOperands(opcode: Opcode, instr) {
        let cycles = 0;
        switch (opcode.format) {
            case 1:
                this.Td = (instr & 0x0c00) >> 10;
                this.Ts = (instr & 0x0030) >> 4;
                this.D = (instr & 0x03c0) >> 6;
                this.S = (instr & 0x000f);
                this.B = (instr & 0x1000) >> 12;
                cycles += this.fixS();
                break;
            case 2:
                this.D = (instr & 0x00ff);
                break;
            case 3:
                this.Td = 0;
                this.Ts = (instr & 0x0030) >> 4;
                this.D = (instr & 0x03c0) >> 6;
                this.S = (instr & 0x000f);
                this.B = 0;
                cycles += this.fixS();
                break;
            case 4:
                // No destination (CRU ops)
                this.D = (instr & 0x03c0) >> 6;
                this.Ts = (instr & 0x0030) >> 4;
                this.S = (instr & 0x000f);
                this.B = (this.D > 8 ? 0 : 1);
                cycles += this.fixS();
                break;
            case 5:
                this.D = (instr & 0x00f0) >> 4;
                this.S = (instr & 0x000f);
                this.S = this.WP + (this.S << 1);
                break;
            case 6:
                // No destination (single argument instructions)
                this.Ts = (instr & 0x0030) >> 4;
                this.S = instr & 0x000f;
                this.B = 0;
                cycles += this.fixS();
                break;
            case 7:
                // no argument
                break;
            case 8:
                if (opcode.id === "STST" || opcode.id === "STWP") {
                    this.D = (instr & 0x000f);
                    this.D = this.WP + (this.D << 1);
                } else {
                    this.D = (instr & 0x000f);
                    this.D = this.WP + (this.D << 1);
                    this.S = this.readMemoryWord(this.PC);
                    this.inctPC();
                }
                break;
            case 9:
                // No destination here (dest calc'd after call) (DIV, MUL, XOP)
                this.D = (instr & 0x03c0) >> 6;
                this.Ts = (instr & 0x0030) >> 4;
                this.S = (instr & 0x000f);
                this.B = 0;
                cycles += this.fixS();
                break;
            default:
                break;
        }
        return cycles;
    }

    //////////////////////////////////////////////////////////////////////////
    // Get addresses for the destination and source arguments
    // Note: the format code letters are the official notation from Texas
    // instruments. See their TMS9900 documentation for details.
    // (Td, Ts, D, S, B, etc)
    // Note that some format codes set the destination type (Td) to
    // '4' in order to skip unneeded processing of the Destination address
    //////////////////////////////////////////////////////////////////////////

    fixS(): number {
        let cycles = 0;
        let temp, t2;
        // source type
        switch (this.Ts) {
            case 0:
                // register	(R1) Address is the address of the register
                this.S = this.WP + (this.S << 1);
                break;
            case 1:
                // register indirect (*R1) Address is the contents of the register
                this.S = this.readMemoryWord(this.WP + (this.S << 1));
                cycles += 4;
                break;
            case 2:
                if (this.S !== 0) {
                    // indexed (@>1000(R1))	Address is the contents of the argument plus the contents of the register
                    this.S = this.readMemoryWord(this.PC) + this.readMemoryWord(this.WP + (this.S << 1));
                } else {
                    // symbolic	 (@>1000) Address is the contents of the argument
                    this.S = this.readMemoryWord(this.PC);
                }
                this.inctPC();
                cycles += 8;
                break;
            case 3:
                // do the increment after the opcode is done with the source
                t2 = this.WP + (this.S << 1);
                temp = this.readMemoryWord(t2);
                this.S = temp;
                // After we have the final address, we can increment the register
                // (so MOV *R0+ returns the post increment if R0=adr(R0))
                const val = this.readMemoryWord(t2);                    // don't count this read for cycles
                this.writeMemoryWord(t2, val + (this.B === 1 ? 1 : 2)); // do count this write
                cycles += this.B === 1 ? 6 : 8;
                break;
        }
        return cycles;
    }

    fixD(): number {
        let cycles = 0;
        let temp, t2;
        // destination type
        // same as the source types
        switch (this.Td) {
            case 0:
                // register
                this.D = this.WP + (this.D << 1);
                break;
            case 1:
                // register indirect
                this.D = this.readMemoryWord(this.WP + (this.D << 1));
                cycles += 4;
                break;
            case 2:
                if (this.D !== 0) {
                    // indexed
                    this.D = this.readMemoryWord(this.PC) + this.readMemoryWord(this.WP + (this.D << 1));
                } else {
                    // symbolic
                    this.D = this.readMemoryWord(this.PC);
                }
                this.inctPC();
                cycles += 8;
                break;
            case 3:
                // do the increment after the opcode is done with the dest
                // (add 1 if byte, 2 if word)
                t2 = this.WP + (this.D << 1);
                temp = this.readMemoryWord(t2);
                this.D = temp;
                // After we have the final address, we can increment the register
                // (so MOV *R0+ returns the post increment if R0=adr(R0))
                const val = this.readMemoryWord(t2);                    // don't count this read for cycles
                this.writeMemoryWord(t2, val + (this.B === 1 ? 1 : 2)); // do count this write
                cycles += this.B === 1 ? 6 : 8;
                break;
        }
        return cycles;
    }

    writeMemoryWord(addr: number, w: number) {
        this.writeMemoryByte(addr, (w & 0xFF00) >> 8);
        this.writeMemoryByte(addr + 1, w & 0x00FF);
    }

    writeMemoryByte(addr: number, b: number) {
        // GPU register
        if (addr >= this.WP) {
            this.vdpRAM[addr] = b;
        } else if (addr < 0x4000) {
            this.vdpRAM[addr] = b;
        } else if (addr < 0x5000) {
            this.vdpRAM[addr & 0x47FF] = b;
        } else if (addr < 0x6000) {
            const colNo = (addr & 0x7F) >> 1;
            const color = this.f18a.getPalette()[colNo];
            if ((addr & 1) === 0) {
                // MSB
                color[0] = (b & 0x0F) * 17;
            } else {
                // LSB
                color[1] = ((b & 0xF0) >> 4) * 17;
                color[2] = (b & 0x0F) * 17;
            }
        } else if (addr < 0x7000) {
            this.f18a.writeRegister(addr & 0x3F, b);
        } else if (addr < 0x8000) {
            //  Read only
        } else if (addr < 0x9000) {
            if ((addr & 0xF) === 8) {
                // Trigger DMA
                let src = (this.vdpRAM[0x8000] << 8) | this.vdpRAM[0x8001];
                let dst = (this.vdpRAM[0x8002] << 8) | this.vdpRAM[0x8003];
                const width = this.vdpRAM[0x8004];
                // if (width === 0) {
                //     width = 0x100;
                // }
                const height = this.vdpRAM[0x8005];
                // if (height === 0) {
                //     height = 0x100;
                // }
                const stride = this.vdpRAM[0x8006];
                // if (stride === 0) {
                //     stride = 0x100;
                // }
                const dir = (this.vdpRAM[0x8007] & 0x02) === 0 ? 1 : -1;
                const diff = dir * (stride - width);
                const copy = (this.vdpRAM[0x8007] & 0x01) === 0;
                const srcByte = this.vdpRAM[src];
                this.log.debug("DMA triggered src=" + Util.toHexWord(src) + " dst=" + Util.toHexWord(dst) + " width=" + Util.toHexByte(width) +
                    " height=" + Util.toHexByte(height) + " stride=" + stride + " copy=" + copy + " dir=" + dir + " srcByte=" + srcByte);
                let x, y;
                if (copy) {
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            this.vdpRAM[dst] = this.vdpRAM[src];
                            src += dir;
                            dst += dir;
                        }
                        src += diff;
                        dst += diff;
                    }
                } else {
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            this.vdpRAM[dst] = srcByte;
                            dst += dir;
                        }
                        dst += diff;
                    }
                }
                this.addCycles(width * height); // ?
            } else {
                // Setup
                this.vdpRAM[addr & 0x800F] = b;
            }
        } else if (addr < 0xA000) {
        } else if (addr < 0xB000) {
            //  Read only
        } else if (addr < 0xC000) {
            // 7 least significant bits, goes to an enhanced status register for the host CPU to read
            this.vdpRAM[0xB000] = b & 0x7F;
        }
    }

    readMemoryWord(addr: number): number {
        return (this.readMemoryByte(addr) << 8) | this.readMemoryByte(addr + 1);
    }

    /*
    -- VRAM 14-bit, 16K @ >0000 to >3FFF (0011 1111 1111 1111)
    -- GRAM 11-bit, 2K  @ >4000 to >47FF (0100 x111 1111 1111)
    -- PRAM  7-bit, 128 @ >5000 to >5x7F (0101 xxxx x111 1111)
    -- VREG  6-bit, 64  @ >6000 to >6x3F (0110 xxxx xx11 1111)
    -- current scanline @ >7000 to >7xx0 (0111 xxxx xxxx xxx0)
    -- blanking         @ >7001 to >7xx1 (0111 xxxx xxxx xxx1)
    -- DMA              @ >8000 to >8xx7 (1000 xxxx xxxx 0111)
    -- F18A version     @ >A000 to >Axxx (1010 xxxx xxxx xxxx)
    */
    readMemoryByte(addr: number): number {
        // GPU register
        if (addr >= this.WP) {
            return this.vdpRAM[addr];
        }
        // VRAM
        if (addr < 0x4000) {
            return this.vdpRAM[addr];
        }
        // GRAM
        if (addr < 0x5000) {
            return this.vdpRAM[addr & 0x47FF];
        }
        // PRAM
        if (addr < 0x6000) {
            const color = this.f18a.getPalette()[(addr & 0x7F) >> 1];
            if ((addr & 1) === 0) {
                // MSB
                return Math.floor(color[0] / 17);
            } else {
                // LSB
                return (Math.floor(color[1] / 17) << 4) | Math.floor(color[2] / 17);
            }
        }
        // VREG >6000->603F
        if (addr < 0x7000) {
            return this.f18a.readRegister(addr & 0x3F);
        }
        // Scanline and blanking
        if (addr < 0x8000) {
            if ((addr & 1) === 0) {
                // Current scanline
                return this.f18a.getCurrentScanline();
            } else {
                // Blanking
                return this.f18a.getBlanking();
            }
        }
        // DMA
        if (addr < 0x9000) {
            return this.vdpRAM[addr & 0x8007];
        } else if (addr < 0xA000) {
            return 0;
        } else if (addr < 0xB000) {
            return this.f18a.getVersion();
        } else if (addr < 0xC000) {
            // Write only
            return 0;
        }
        return 0;
    }

    // Load Immediate: LI src, imm
    li(): number {
        this.writeMemoryWord(this.D, this.S);
        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[this.S] & this.maskLGT_AGT_EQ;
        return 12;
    }

    // Add Immediate: AI src, imm
    ai(): number {
        const x1 = this.readMemoryWord(this.D);

        const x3 = (x1 + this.S) & 0xFFFF;
        this.writeMemoryWord(this.D, x3);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        if (x3 < x1) { this.setC(); }
        if (((x1 & 0x8000) === (this.S & 0x8000)) && ((x3 & 0x8000) !== (this.S & 0x8000))) { this.setOV(); }

        return 14;
    }

    // AND Immediate: ANDI src, imm
    andi(): number {
        const x1 = this.readMemoryWord(this.D);
        const x2 = x1 & this.S;
        this.writeMemoryWord(this.D, x2);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x2] & this.maskLGT_AGT_EQ;

        return 14;
    }

    // OR Immediate: ORI src, imm
    ori(): number {
        const x1 = this.readMemoryWord(this.D);
        const x2 = x1 | this.S;
        this.writeMemoryWord(this.D, x2);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x2] & this.maskLGT_AGT_EQ;

        return 14;
    }

    // Compare Immediate: CI src, imm
    ci(): number {
        const x3 = this.readMemoryWord(this.D);

        this.resetLGT_AGT_EQ();
        if (x3 > this.S) { this.setLGT(); }
        if (x3 === this.S) { this.setEQ(); }
        if ((x3 & 0x8000) === (this.S & 0x8000)) {
            if (x3 > this.S) { this.setAGT(); }
        } else {
            if ((this.S & 0x8000) !== 0) { this.setAGT(); }
        }

        return 14;
    }

    // STore STatus: STST src
    // Copy the status register to memory
    stst(): number {
        this.writeMemoryWord(this.D, this.ST);
        return 8;
    }

    // This sets A0-A2 to 010, and pulses CRUCLK until an interrupt is received.
    idle(): number {
        this.setIdle(true);
        return 10;
    }

    // ReTurn with Workspace Pointer: RTWP
    // The matching return for BLWP, see BLWP for description
    // F18A Modified, does not use R13, only performs R14->PC, R15->status flags
    rtwp(): number {
        this.ST = this.readMemoryWord(this.WP + 30); // R15
        this.PC = this.readMemoryWord(this.WP + 28); // R14
        return 14;
    }

    // This is the SPI_EN instruction of the F18A GPU
    ckon(): number {
        this.flash.enable();
        return 10;
    }

    // This is the SPI_DS instruction of the F18A GPU
    ckof(): number {
        this.flash.disable();
        return 10;
    }

    // Branch: B src
    // Unconditional absolute branch
    b(): number {
        this.PC = this.S;
        return 8;
    }

    // eXecute: X src
    // The argument is interpreted as an instruction and executed
    x(): number {
        if (this.flagX !== 0) {
            this.log.info("Recursive X instruction!");
        }

        const xInstr = this.readMemoryWord(this.S);
        // skip_interrupt=1;	    // (ends up having no effect because we call the function inline, but technically still correct)

        let cycles = 8 - 4;	        // For X, add this time to the execution time of the instruction found at the source address, minus 4 clock cycles and 1 memory access.
        this.flagX = this.PC;	    // set flag and save true post-X address for the JMPs (AFTER X's operands but BEFORE the instruction's operands, if any)
        cycles += this.execute(xInstr);
        this.flagX = 0;			    // clear flag

        return cycles;
    }

    // CLeaR: CLR src
    // sets word to 0
    clr(): number {
        this.writeMemoryWord(this.S, 0);
        return 10;
    }

    // NEGate: NEG src
    neg(): number {
        let x1 = this.readMemoryWord(this.S);

        x1 = ((~x1) + 1) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV_C;

        return 12;
    }

    // INVert: INV src
    inv(): number {
        let x1 = this.readMemoryWord(this.S);
        x1 = (~x1) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        return 10;
    }

    // INCrement: INC src
    inc(): number {
        let x1 = this.readMemoryWord(this.S);

        x1 = (x1 + 1) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV_C;

        return 10;
    }

    // INCrement by Two: INCT src
    inct(): number {
        let x1 = this.readMemoryWord(this.S);

        x1 = (x1 + 2) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x1 < 2) { this.setC(); }
        if ((x1 === 0x8000) || (x1 === 0x8001)) { this.setOV(); }

        return 10;
    }

    // DECrement: DEC src
    dec(): number {
        let x1 = this.readMemoryWord(this.S);

        x1 = (x1 - 1) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x1 !== 0xffff) { this.setC(); }
        if (x1 === 0x7fff) { this.setOV(); }

        return 10;
    }

    // DECrement by Two: DECT src
    dect(): number {
        let x1 = this.readMemoryWord(this.S);

        x1 = (x1 - 2) & 0xFFFF;
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

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

        this.writeMemoryWord(this.WP + 22, this.PC);
        this.PC = this.S;

        return 12;
    }

    // SWaP Bytes: SWPB src
    // swap the high and low bytes of a word
    swpb(): number {
        const x1 = this.readMemoryWord(this.S);

        const x2 = ((x1 & 0xff) << 8) | (x1 >> 8);
        this.writeMemoryWord(this.S, x2);

        return 10;
    }

    // SET to One: SETO src
    // sets word to 0xffff
    seto(): number {
        this.writeMemoryWord(this.S, 0xffff);

        return 10;
    }

    // ABSolute value: ABS src
    abs(): number {
        let cycles = 0;
        const x1 = this.readMemoryWord(this.S);

        if ((x1 & 0x8000) !== 0) {
            const x2 = ((~x1) + 1) & 0xFFFF;	// if negative, make positive
            this.writeMemoryWord(this.S, x2);
            cycles += 2;
        }

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ_OV;

        return cycles + 12;
    }

    // Shift Right Arithmetic: SRA src, dst
    // For the shift instructions, a count of '0' means use the
    // value in register 0. If THAT is zero, the count is 16.
    // The arithmetic operations preserve the sign bit
    sra(): number {
        let cycles = 0;
        if (this.D === 0) {
            this.D = this.readMemoryWord(this.WP) & 0xf;
            if (this.D === 0) { this.D = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.S);
        const x4 = x1 & 0x8000;
        let x3 = 0;

        for (let x2 = 0; x2 < this.D; x2++) {
            x3 = x1 & 1;   /* save carry */
            x1 = x1 >> 1;  /* shift once */
            x1 = x1 | x4;  /* extend sign bit */
        }
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.D;
    }

    // Shift Right Logical: SRL src, dst
    // The logical shifts do not preserve the sign
    srl(): number {
        let cycles = 0;
        if (this.D === 0) {
            this.D = this.readMemoryWord(this.WP) & 0xf;
            if (this.D === 0) { this.D = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.S);
        let x3 = 0;

        for (let x2 = 0; x2 < this.D; x2++) {
            x3 = x1 & 1;
            x1 = x1 >> 1;
        }
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.D;
    }

    // Shift Left Arithmetic: SLA src, dst
    sla(): number {
        let cycles = 0;
        if (this.D === 0) {
            this.D = this.readMemoryWord(this.WP) & 0xf;
            if (this.D === 0) { this.D = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.S);
        const x4 = x1 & 0x8000;
        this.resetEQ_LGT_AGT_C_OV();

        let x3 = 0;
        for (let x2 = 0; x2 < this.D; x2++) {
            x3 = x1 & 0x8000;
            x1 = x1 << 1;
            if ((x1 & 0x8000) !== x4) { this.setOV(); }
        }
        x1 = x1 & 0xFFFF;
        this.writeMemoryWord(this.S , x1);

        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x3 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.D;
    }

    // Shift Right Circular: SRC src, dst
    // Circular shifts pop bits off one end and onto the other
    // The carry bit is not a part of these shifts, but it set
    // as appropriate
    src(): number {
        let cycles = 0;
        if (this.D === 0) {
            this.D = this.readMemoryWord(this.WP) & 0xf;
            if (this.D === 0) { this.D = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.S);
        let x4;
        for (let x2 = 0; x2 < this.D; x2++) {
            x4 = x1 & 0x1;
            x1 = x1 >> 1;
            if (x4 !== 0) {
                x1 = x1 | 0x8000;
            }
        }
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x4 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.D;
    }

    // JuMP: JMP dsp
    // (unconditional)
    jmp(): number {
        if (this.flagX !== 0) {
            this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
        }
        if ((this.D & 0x80) !== 0) {
            this.D = 128 - (this.D & 0x7f);
            this.addPC(-(this.D + this.D));
        } else {
            this.addPC(this.D + this.D);
        }
        return 10;
    }

    // Jump if Less Than: JLT dsp
    jlt(): number {
        if (this.getAGT() === 0 && this.getEQ() === 0) {
            if (this.flagX !== 0) {
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }
            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
            }
            return 10;
        } else {
            return 8;
        }
    }

    jl(): number {
        if ((this.getLGT() === 0) && (this.getEQ() === 0)) {
            if (this.flagX !== 0) {
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
                this.PC = this.flagX;	// Update offset - it's relative to the X, not the opcode
            }

            if ((this.D & 0x80) !== 0) {
                this.D = 128 - (this.D & 0x7f);
                this.addPC(-(this.D + this.D));
            } else {
                this.addPC(this.D + this.D);
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
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);

        const x3 = x1 & x2;

        if (x3 === x1) { this.setEQ(); } else { this.resetEQ(); }

        return cycles + 14;
    }

    // Compare Zeros Corresponding: CZC src, dst
    // The opposite of COC. Each set bit in the dst (mask) must
    // match up with a zero bit in the src to set the equals flag
    czc(): number {
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);

        const x3 = x1 & x2;

        if (x3 === 0) { this.setEQ(); } else { this.resetEQ(); }

        return cycles + 14;
    }

    // eXclusive OR: XOR src, dst
    xor(): number {
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);

        const x3 = (x1 ^ x2) & 0xFFFF;
        this.writeMemoryWord(this.D, x3);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // eXtended OPeration: XOP src ???
    // The CPU maintains a jump table starting at 0x0040, containing BLWP style
    // jumps for each operation. In addition, the new R11 gets a copy of the address of
    // the source operand.
    // Apparently not all consoles supported both XOP 1 and 2 (depends on the ROM?)
    // so it is probably rarely, if ever, used on the TI99.
    //
    // In the F18A GPU this is the PIX instruction
    // Format: MAxxRWCE xxOOxxPP
    // M - 1 = calculate the effective address for GM2 instead of the new bitmap layer
    //     0 = use the remainder of the bits for the new bitmap layer pixels
    // A - 1 = retrieve the pixel's effective address instead of setting a pixel
    //     0 = read or set a pixel according to the other bits
    // R - 1 = read current pixel into PP, only after possibly writing PP
    //     0 = do not read current pixel into PP
    // W - 1 = do not write PP 0 = write PP to current pixel
    // C - 1 = compare OO with PP according to E, and write PP only if true
    //     0 = always write
    // E - 1 = only write PP if current pixel is equal to OO
    //     0 = only write PP if current pixel is not equal to OO
    // OO - pixel to compare to existing pixel
    // PP - new pixel to write, and previous pixel when reading
    xop(): number {
        this.D = this.WP + (this.D << 1);
        const x1 = this.readMemoryWord(this.S);
        let x2 = this.readMemoryWord(this.D);
        let pixOffset;
        let addr = 0;
        if ((x2 & 0x8000) !== 0) {
            // calculate BM2 address:
            // 00PYYYYY00000YYY +
            //     0000XXXXX000
            // ------------------
            // 00PY YYYY XXXX XYYY
            //
            // Note: Bitmap GM2 address /includes/ the offset from VR4 (pattern table), so to use
            // it for both pattern and color tables, put the pattern table at >0000
            addr =
                (((this.f18a.getRegister(4) & 0x04) !== 0) ? 0x2000 : 0) |	// P
                ((x1 & 0x00F8) << 5) |						            // YYYYY
                ((x1 & 0xF800) >> 8) |						            // XXXXX
                (x1 & 0x0007);  							            // YYY
        } else {
            // Calculate bitmap layer address
            // this.log.info("Plot(" + ((x1 & 0xFF00) >> 8) + ", " + (x1 & 0x00FF) + ")");
            pixOffset = ((x1 & 0xFF00) >> 8) + (x1 & 0x00FF) * this.f18a.getBitmapWidth();
            addr = this.f18a.getBitmapBaseAddr() + (pixOffset >> 2);
        }

        // Only parse the other bits if M and A are zero
        if ((x2 & 0xc000) === 0) {
            const pixByte = this.readMemoryByte(addr);	    // Get the byte
            const bitShift = (pixOffset & 0x0003) << 1;
            const mask = 0xC0 >> bitShift;
            const pix = (pixByte & mask) >> (6 - bitShift);
            let write = (x2 & 0x0400) === 0;		            // Whether to write
            // TODO: are C and E dependent on W being set? I am assuming yes.
            if (write && (x2 & 0x0200) !== 0) {		        // C - compare active (only important if we are writing anyway?)
                const comp = (pix === ((x2 & 0x0030) >> 4));	    // Compare the pixels
                if ((x2 & 0x0100) !== 0) {
                    // E is set, comparison must be true
                    if (!comp) {
                        write = false;
                    }
                } else {
                    // E is clear, comparison must be false
                    if (comp) {
                        write = false;
                    }
                }
            }
            if (write) {
                const newPix = (x2 & 0x0003) << (6 - bitShift);	// New pixel
                const invMask = (~mask) & 0xFF;
                this.writeMemoryByte(addr, (pixByte & invMask) | newPix);
            }
            if ((x2 & 0x0800) !== 0) {
                // Read is set, so save the original read pixel color in PP
                x2 = (x2 & 0xFFFC) | pix;
                this.writeMemoryWord(this.D, x2);		    // Write it back
            }
        } else {
            // User only wants the address
            this.writeMemoryWord(this.D, addr);
        }

        return 10;
    }

    // This is the SPI_OUT instruction of the F18A GPU
    ldcr(): number {
        this.flash.writeByte(this.readMemoryByte(this.S));
        return 10;
    }

    // This is the SPI_IN instruction of the F18A GPU
    stcr(): number {
        this.writeMemoryByte(this.S, this.flash.readByte());
        return 10;
    }

    // MultiPlY: MPY src, dst
    // Multiply src by dest and store 32-bit result
    // Note: src and dest are unsigned.
    mpy(): number {
        const x1 = this.readMemoryWord(this.S);

        this.D = this.WP + (this.D << 1);
        let x3 = this.readMemoryWord(this.D);
        x3 = x3 * x1;
        this.writeMemoryWord(this.D, (x3 >> 16) & 0xFFFF);
        this.writeMemoryWord(this.D + 2, (x3 & 0xFFFF));

        return 52;
    }

    // DIVide: DIV src, dst
    // Dest, a 2 word number, is divided by src. The result is stored as two words at the dst:
    // the first is the whole number result, the second is the remainder
    div(): number {
        const x2 = this.readMemoryWord(this.S);

        this.D = this.WP + (this.D << 1);
        let x3 = this.readMemoryWord(this.D);

        if (x2 > x3) {		// x2 can not be zero because they're unsigned
            x3 = x3 * 65536 + this.readMemoryWord(this.D + 2); // Cannot use shift here because then we get a 32-bit signed integer
            let x1 = x3 / x2;
            this.writeMemoryWord(this.D, x1 & 0xFFFF);
            x1 = x3 % x2;
            this.writeMemoryWord(this.D + 2, x1 & 0xFFFF);
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
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);
        const x3 = (~x1) & x2;
        this.writeMemoryWord(this.D, x3);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // Set Zeros Corresponding, Byte: SZCB src, dst
    szcb(): number {
        const x1 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryByte(this.D);
        const x3 = (~x1) & x2;
        this.writeMemoryByte(this.D, x3);

        this.resetLGT_AGT_EQ_OP();
        this.ST |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    // Subtract: S src, dst
    s(): number {
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);
        const x3 = (x2 - x1) & 0xFFFF;
        this.writeMemoryWord(this.D, x3);

        this.resetEQ_LGT_AGT_C_OV();
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        // any number minus 0 sets carry.. Tursi's theory is that converting 0 to the two's complement
        // is causing the carry flag to be set.
        if ((x3 < x2) || (x1 === 0)) { this.setC(); }
        if (((x1 & 0x8000) !== (x2 & 0x8000)) && ((x3 & 0x8000) !== (x2 & 0x8000))) { this.setOV(); }

        return cycles + 14;
    }

    // Subtract Byte: SB src, dst
    sb(): number {
        const x1 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryByte(this.D);
        const x3 = (x2 - x1) & 0xFF;
        this.writeMemoryByte(this.D, x3);

        this.resetEQ_LGT_AGT_C_OV_OP();
        this.ST |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        // any number minus 0 sets carry.. Tursi's theory is that converting 0 to the two's complement
        // is causing the carry flag to be set.
        if ((x3 < x2) || (x1 === 0)) { this.setC(); }
        if (((x1 & 0x80) !== (x2 & 0x80)) && ((x3 & 0x80) !== (x2 & 0x80))) { this.setOV(); }

        return cycles + 14;
    }

    // Compare words: C src, dst
    c(): number {
        const x3 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x4 = this.readMemoryWord(this.D);

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
        const x3 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        const x4 = this.readMemoryByte(this.D);

        this.resetLGT_AGT_EQ_OP();
        if (x3 > x4) { this.setLGT(); }
        if (x3 === x4) { this.setEQ(); }
        if ((x3 & 0x80) === (x4 & 0x80)) {
            if (x3 > x4) { this.setAGT(); }
        } else {
            if ((x4 & 0x80) !== 0) { this.setAGT(); }
        }
        this.ST |= this.bStatusLookup[x3] & this.BIT_OP;

        return cycles + 14;
    }

    // Add words: A src, dst
    a(): number {
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);
        const x3 = (x2 + x1) & 0xFFFF;
        this.writeMemoryWord(this.D, x3);

        this.resetEQ_LGT_AGT_C_OV();	// We come out with either EQ or LGT, never both
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        if (x3 < x2) { this.setC(); }	// if it wrapped around, set carry
        if (((x1 & 0x8000) === (x2 & 0x8000)) && ((x3 & 0x8000) !== (x2 & 0x8000))) { this.setOV(); } // if it overflowed or underflowed (signed math), set overflow

        return cycles + 14;
    }

    // Add bytes: A src, dst
    ab(): number {
        const x1 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryByte(this.D);
        const x3 = (x2 + x1) & 0xFF;
        this.writeMemoryByte(this.D, x3);

        this.resetEQ_LGT_AGT_C_OV();	// We come out with either EQ or LGT, never both
        this.ST |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        if (x3 < x2) { this.setC(); }	// if it wrapped around, set carry
        if (((x1 & 0x80) === (x2 & 0x80)) && ((x3 & 0x80) !== (x2 & 0x80))) { this.setOV(); }  // if it overflowed or underflowed (signed math), set overflow

        return cycles + 14;
    }

    // MOVe words: MOV src, dst
    mov(): number {
        const x1 = this.readMemoryWord(this.S);
        const cycles = this.fixD();

        this.writeMemoryWord(this.D, x1);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    // MOVe Bytes: MOVB src, dst
    movb(): number {
        const x1 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        this.writeMemoryByte(this.D, x1);

        this.resetLGT_AGT_EQ_OP();
        this.ST |= this.bStatusLookup[x1] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    // Set Ones Corresponding: SOC src, dst
    // Essentially performs an OR - setting all the bits in dst that
    // are set in src
    soc(): number {
        const x1 = this.readMemoryWord(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryWord(this.D);
        const x3 = x1 | x2;
        this.writeMemoryWord(this.D, x3);

        this.resetLGT_AGT_EQ();
        this.ST |= this.wStatusLookup[x3] & this.maskLGT_AGT_EQ;

        return cycles + 14;
    }

    socb(): number {
        const x1 = this.readMemoryByte(this.S);

        const cycles = this.fixD();
        const x2 = this.readMemoryByte(this.D);
        const x3 = x1 | x2;
        this.writeMemoryByte(this.D, x3);

        this.resetLGT_AGT_EQ_OP();
        this.ST |= this.bStatusLookup[x3] & this.maskLGT_AGT_EQ_OP;

        return cycles + 14;
    }

    // F18A specific opcodes

    call(): number {
        let x2 = this.readMemoryWord(this.WP + 30);	// get R15
        this.writeMemoryWord(x2, this.PC);
        this.PC = this.S;
        x2 -= 2;
        this.writeMemoryWord(this.WP + 30, x2);     // update R15
        return 8;
    }

    ret(): number {
        let x1 = this.readMemoryWord(this.WP + 30); // get R15
        x1 += 2;
        this.PC = this.readMemoryWord(x1);          // get PC
        this.writeMemoryWord(this.WP + 30, x1);     // update R15
        return 8;
    }

    push(): number {
        const x1 = this.readMemoryWord(this.S);
        let x2 = this.readMemoryWord(this.WP + 30); // get R15
        this.writeMemoryWord(x2, x1);               // Push the word on the stack
        x2 -= 2;                                    // the stack pointer post-decrements (per Matthew)
        this.writeMemoryWord(this.WP + 30, x2);		// update R15
        return 8;
    }

    slc(): number {
        let cycles = 0;
        if (this.D === 0) {
            this.D = this.readMemoryWord(this.WP) & 0xf;
            if (this.D === 0) { this.D = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.S);
        let x4;
        for (let x2 = 0; x2 < this.D; x2++) {
            x4 = x1 & 0x8000;
            x1 = x1 << 1;
            if (x4 !== 0) {
                x1 = x1 | 1;
            }
        }
        this.writeMemoryWord(this.S, x1);

        this.resetEQ_LGT_AGT_C();
        this.ST |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x4 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.D;
    }

    pop(): number {
        let x2 = this.readMemoryWord(this.WP + 30);	// get R15
        // POP the word from the stack
        // the stack pointer post-decrements (per Matthew)
        x2 += 2;                                    // so here we pre-increment!
        const x1 = this.readMemoryWord(x2);
        this.writeMemoryWord(this.S, x1);
        this.writeMemoryWord(this.WP + 30, x2);		// update R15
        return 8;
    }

    getLGT() { return (this.ST & this.BIT_LGT); }	// Logical Greater Than
    getAGT() { return (this.ST & this.BIT_AGT); }	// Arithmetic Greater Than
    getEQ() { return (this.ST & this.BIT_EQ); }	    // Equal
    getC() { return (this.ST & this.BIT_C); }	    // Carry
    getOV() { return (this.ST & this.BIT_OV); }	    // Overflow
    getOP() { return (this.ST & this.BIT_OP); }	    // Odd Parity
    getX() { return (this.ST & this.BIT_X); }	    // Set during an XOP instruction

    setLGT() { this.ST |= 0x8000; }       		    // Logical Greater than: >0x0000
    setAGT() { this.ST |= 0x4000; }		            // Arithmetic Greater than: >0x0000 and <0x8000
    setEQ() { this.ST |= 0x2000; }       		    // Equal: ==0x0000
    setC() { this.ST |= 0x1000; }		            // Carry: carry occurred during operation
    setOV() { this.ST |= 0x0800; }       		    // Overflow: overflow occurred during operation
    setOP() { this.ST |= 0x0400; }	                // Odd parity: word has odd number of '1' bits
    setX() { this.ST |= 0x0200; }		            // Executing 'X' statement

    resetLGT() { this.ST &= 0x7fff; }               // Clear the flags
    resetAGT() { this.ST &= 0xbfff; }
    resetEQ() { this.ST &= 0xdfff; }
    resetC() { this.ST &= 0xefff; }
    resetOV() { this.ST &= 0xf7ff; }
    resetOP() { this.ST &= 0xfbff; }
    resetX() { this.ST &= 0xfdff; }

    // Group clears
    resetEQ_LGT() { this.ST &= 0x5fff; }
    resetLGT_AGT_EQ() { this.ST &= 0x1fff; }
    resetLGT_AGT_EQ_OP() { this.ST &= 0x1bff; }
    resetEQ_LGT_AGT_OV() { this.ST &= 0x17ff; }
    resetEQ_LGT_AGT_C() { this.ST &= 0x0fff; }
    resetEQ_LGT_AGT_C_OV() { this.ST &= 0x7ff; }
    resetEQ_LGT_AGT_C_OV_OP() { this.ST &= 0x3ff; }

    logRegs() {
        this.log.info(this.getRegsString() + this.getInternalRegsString());
    }

    getInternalRegsString(): string {
        return "PC: " + Util.toHexWord(this.PC) + " ST: " + Util.toHexWord(this.ST) + " F18A GPU";
    }

    getRegsString(): string {
        let s = "";
        for (let i = 0; i < 16; i++) {
            s += "R" + i + ":" + Util.toHexWord(this.readMemoryWord(this.WP + 2 * i)) + " ";
        }
        return s;
    }

    getRegsStringFormatted(): string {
        let s = "";
        for (let i = 0; i < 16; i++) {
            s += "R" + i + (i < 10 ? " " : "") + ":" + Util.toHexWord(this.readMemoryWord(this.WP + 2 * i)) + (i % 4 === 3 ? "\n" : " ");
        }
        return s;
    }

    getBreakpoint(): number {
        return this.breakpoint;
    }

    setBreakpoint(addr: number) {
        this.breakpoint = addr;
    }

    setOtherBreakpoint(addr: number) {
        this.otherBreakpoint = addr;
    }

    atBreakpoint() {
        return this.PC === this.breakpoint || this.PC === this.otherBreakpoint;
    }

    hexArrayToBin(hexArray) {
        const binArray = [];
        let n = 0;
        for (let i = 0; i < hexArray.length; i++) {
            const row = hexArray[i];
            for (let j = 0; j < row.length; j += 2) {
                binArray[n++] = parseInt(row.substr(j, 2), 16);
            }
        }
        return binArray;
    }

    dumpProfile(): void {
    }

    getCycles(): number {
        return 0;
    }

    isSuspended(): boolean {
        return false;
    }

    setSuspended(suspended: boolean): void {
    }

    setTracing(tracing: boolean) {
        this.tracing = tracing;
    }

    getState(): object {
        return {
            cpuIdle: this.cpuIdle,
            PC: this.PC,
            WP: this.WP,
            ST: this.ST,
            flagX: this.flagX,
            cycles: this.cycles,
            cyclesRemaining: this.cyclesRemaining,
            breakpoint: this.breakpoint,
            otherBreakpoint: this.otherBreakpoint,
            illegalCount: this.illegalCount,
            flash: this.flash.getState()
        };
    }

    restoreState(state: any) {
        this.vdpRAM = this.f18a.getRAM();
        this.cpuIdle = state.cpuIdle;
        this.PC = state.PC;
        this.WP = state.WP;
        this.ST = state.ST;
        this.flagX = state.flagX;
        this.cycles = state.cycles;
        this.cyclesRemaining = state.cyclesRemaining;
        this.breakpoint = state.breakpoint;
        // this.otherBreakpoint = state.otherBreakpoint;
        this.illegalCount = state.illegalCount;
        this.flash.restoreState(state.flash);
    }
}
