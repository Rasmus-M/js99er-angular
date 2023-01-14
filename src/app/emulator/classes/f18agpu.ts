import {CPU} from '../interfaces/cpu';
import {F18A} from './f18a';
import {F18AFlash} from './f18aflash';
import {Util} from '../../classes/util';
import {Opcode} from "../../classes/opcode";
import {CPUCommon} from "./cpuCommon";

export class F18AGPU extends CPUCommon implements CPU {

    static readonly CYCLES_PER_FRAME = 1250000; // Speed is approximately 25 times that of the normal CPU
    static readonly CYCLES_PER_SCANLINE = 4500;

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

    // Misc
    private cpuIdle: boolean;
    private cyclesRemaining: number;

    constructor(f18a) {
        super();
        this.f18a = f18a;
        this.addSpecialInstructions();
    }

    addSpecialInstructions() {
        this.instructions.CKON = this.ckon;
        this.instructions.CKOF = this.ckof;
        this.instructions.RET = this.ret;
        this.instructions.CALL = this.call;
        this.instructions.PUSH = this.push;
        this.instructions.SLC = this.slc;
        this.instructions.POP = this.pop;
    }

    reset() {
        this.intReset();

        this.vdpRAM = this.f18a.getRAM();
        this.wp = 0xF000; // Place workspace in an unused part of the memory space
        for (let i = 0; i < 32; i++) {
            this.vdpRAM[this.wp + i] = 0;
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
        this.wp = 0xF000; // Place workspace in an unused part of the memory space
        this.pc = 0;
        this.st = 0x01c0;
        this.flagX = 0;

        // Operands
        this.ts = 0;
        this.td = 0;
        this.dest = 0;
        this.source = 0;
        this.byte = 0;

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
        this.setPc(0x4000);
    }

    run(cyclesToRun: number, skipBreakpoint?: boolean): number {
        this.stoppedAtBreakpoint = false;
        const startCycles = this.cycles;
        while (!this.cpuIdle && this.cycles - startCycles < cyclesToRun) {
            const atBreakpoint = this.atBreakpoint() && !skipBreakpoint;
            if (atBreakpoint) {
                // Handle breakpoint
                this.auxBreakpoint = null;
                this.cyclesRemaining = cyclesToRun - (this.cycles - startCycles);
                this.stoppedAtBreakpoint = true;
                cyclesToRun = -1;
            } else {
                // Execute instruction
                const tmpPC = this.getPc();
                const instruction = this.readMemoryWord(this.pc);
                this.inctPc();
                const cycles = this.execute(instruction);
                this.addCycles(cycles);
                this.cycleLog[tmpPC] = cycles;
                skipBreakpoint = false;
            }
        }
        return (this.cycles - startCycles) - cyclesToRun;
    }

    execute(instruction: number): number {
        const opcode: Opcode = this.decoderTable[instruction];
        if (opcode) {
            let cycles = this.decodeOperands(opcode, instruction);
            const f = this.instructions[opcode.id];
            if (f) {
                cycles += f.call(this);
            } else {
                this.log.info(Util.toHexWord((this.pc - 2) & 0xFFFF) + " " + Util.toHexWord(instruction) + " " + opcode.id + ": GPU Not implemented");
            }
            return cycles;
        } else {
            if (this.illegalCount < 256) {
                this.log.info(Util.toHexWord(((this.pc - 2) & 0xFFFF)) + " " + Util.toHexWord(instruction) + ": GPU Illegal" + (this.illegalCount === 255 ? " (suppressing further messages)" : ""));
            }
            this.illegalCount++;
            return 10;
        }
    }

    setPc(value) {
        super.setPc(value);
        this.setIdle(false);
    }

    setWp(value) {
        this.log.warn("setWP not implemented.");
    }

    writeMemoryWord(addr: number, w: number) {
        addr &= 0xFFFE;
        this.writeMemoryByte(addr, (w & 0xFF00) >> 8);
        this.writeMemoryByte(addr + 1, w & 0x00FF);
    }

    writeMemoryByte(addr: number, b: number) {
        // GPU register
        if (addr >= this.wp) {
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
        if (addr >= this.wp) {
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

    getMemoryWord(addr: number): number {
        return this.readMemoryWord(addr);
    }

    // Does not use R13, only performs R14->PC, R15->status flags
    rtwp(): number {
        this.st = this.readMemoryWord(this.wp + 30); // R15
        this.setPc(this.readMemoryWord(this.wp + 28)); // R14
        return 14;
    }

    // This sets the CPU idle on thw F18A GPU
    idle(): number {
        this.setIdle(true);
        return 10;
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

    // This is the PIX instruction of the F18A GPU
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
        this.dest = this.wp + (this.dest << 1);
        const x1 = this.readMemoryWord(this.source);
        let x2 = this.readMemoryWord(this.dest);
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
                this.writeMemoryWord(this.dest, x2);		    // Write it back
            }
        } else {
            // User only wants the address
            this.writeMemoryWord(this.dest, addr);
        }

        return 10;
    }

    // This is the SPI_OUT instruction of the F18A GPU
    ldcr(): number {
        this.flash.writeByte(this.readMemoryByte(this.source));
        return 10;
    }

    // This is the SPI_IN instruction of the F18A GPU
    stcr(): number {
        this.writeMemoryByte(this.source, this.flash.readByte());
        return 10;
    }

    call(): number {
        let x2 = this.readMemoryWord(this.wp + 30);	// get R15
        this.writeMemoryWord(x2, this.pc);
        this.pc = this.source;
        x2 -= 2;
        this.writeMemoryWord(this.wp + 30, x2);     // update R15
        return 8;
    }

    ret(): number {
        let x1 = this.readMemoryWord(this.wp + 30); // get R15
        x1 += 2;
        this.pc = this.readMemoryWord(x1);          // get PC
        this.writeMemoryWord(this.wp + 30, x1);     // update R15
        return 8;
    }

    push(): number {
        const x1 = this.readMemoryWord(this.source);
        let x2 = this.readMemoryWord(this.wp + 30); // get R15
        this.writeMemoryWord(x2, x1);               // Push the word on the stack
        x2 -= 2;                                    // the stack pointer post-decrements (per Matthew)
        this.writeMemoryWord(this.wp + 30, x2);		// update R15
        return 8;
    }

    slc(): number {
        let cycles = 0;
        if (this.dest === 0) {
            this.dest = this.readMemoryWord(this.wp) & 0xf;
            if (this.dest === 0) { this.dest = 16; }
            cycles += 8;
        }
        let x1 = this.readMemoryWord(this.source);
        let x4;
        for (let x2 = 0; x2 < this.dest; x2++) {
            x4 = x1 & 0x8000;
            x1 = x1 << 1;
            if (x4 !== 0) {
                x1 = x1 | 1;
            }
        }
        this.writeMemoryWord(this.source, x1);

        this.resetEQ_LGT_AGT_C();
        this.st |= this.wStatusLookup[x1] & this.maskLGT_AGT_EQ;

        if (x4 !== 0) { this.setC(); }

        return cycles + 12 + 2 * this.dest;
    }

    pop(): number {
        let x2 = this.readMemoryWord(this.wp + 30);	// get R15
        // POP the word from the stack
        // the stack pointer post-decrements (per Matthew)
        x2 += 2;                                    // so here we pre-increment!
        const x1 = this.readMemoryWord(x2);
        this.writeMemoryWord(this.source, x1);
        this.writeMemoryWord(this.wp + 30, x2);		// update R15
        return 8;
    }

    isIdle() {
        return this.cpuIdle;
    }

    setIdle(idle) {
        this.cpuIdle = idle;
    }

    isSuspended(): boolean {
        return false;
    }

    setSuspended(suspended: boolean): void {
    }

    setTracing(tracing: boolean) {
        this.tracing = tracing;
    }

    dumpProfile(): void {
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

    getState(): any {
        const state = super.getState();
        state.cpuIdle = this.cpuIdle;
        state.flash = this.flash.getState();
        return state;
    }

    restoreState(state: any) {
        super.restoreState(state);
        this.vdpRAM = this.f18a.getRAM();
        this.cpuIdle = state.cpuIdle;
        this.flash.restoreState(state.flash);
    }
}
