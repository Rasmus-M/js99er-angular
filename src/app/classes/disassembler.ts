import {Decoder} from "./decoder";
import {Util} from "./util";
import {MemoryDevice} from "../emulator/interfaces/memory-device";
import {Opcode} from "./opcode";
import {MemoryLine, MemoryView} from "./memoryview";

export class Disassembler {

    private memory: MemoryDevice;
    private decoderTable: Opcode[];
    private start: number;
    private length: number;
    private maxInstructions: number;
    private anchorAddr: number;
    private addr: number;

    private static r(val: number) {
        return 'R' + val;
    }

    constructor() {
        this.decoderTable = Decoder.getDecoderTable();
    }

    public setMemory(memory: MemoryDevice) {
        this.memory = memory;
    }

    public disassemble(start: number, length: number, maxInstructions: number, anchorAddr: number, breakpointAddr: number): MemoryView {
        this.start = Math.max(start || 0, 0);
        this.length = Math.min(length || 0x10000, 0x10000 - this.start);
        this.maxInstructions = maxInstructions || 0x10000;
        this.anchorAddr = anchorAddr || this.start;
        // Start by disassembling from the anchor address to ensure correct alignment
        const result = this.disassembleRange(this.anchorAddr, this.start + this.length - this.anchorAddr, this.maxInstructions, this.anchorAddr, breakpointAddr);
        // Then prepend the first part of the disassembly, which may be misaligned
        if (this.start < this.anchorAddr) {
            const result2 = this.disassembleRange(this.start, this.anchorAddr - this.start, this.maxInstructions - result.lines.length, null, breakpointAddr);
            result.lines = result2.lines.concat(result.lines);
            result.anchorLine += result2.lines.length;
        }
        return result;
    }

    public disassembleInstruction(addr: number): string {
        this.addr = addr;
        return this.disassembleNextInstruction();
    }

    private disassembleRange(start: number, length: number, maxInstructions: number, anchorAddr: number, breakpointAddr: number): MemoryView {
        this.addr = start;
        const end = start + length;
        const disassembly: MemoryLine[] = [];
        let anchorLine = null;
        let breakpointLine = null;
        for (let i = 0; i < maxInstructions && this.addr < end; i++) {
            const instrAddr = this.addr; // Start address for current instruction
            let linePrefix = '  ';
            if (anchorAddr !== null && anchorLine === null && instrAddr >= anchorAddr) {
                linePrefix = '\u25ba' + linePrefix.charAt(1);
                anchorLine = i;
            }
            if (breakpointAddr !== null && breakpointLine == null && instrAddr === breakpointAddr) {
                linePrefix = linePrefix.charAt(0) + '\u25cf';
                breakpointLine = i;
            }
            const line = this.disassembleNextInstruction();
            disassembly.push(new MemoryLine(instrAddr , linePrefix + line));
            this.addr += 2;
        }
        return new MemoryView(disassembly, anchorLine, breakpointLine);
    }

    private disassembleNextInstruction(): string {
        const instruction = this.memory.getWord(this.addr);
        let line = Util.toHexWord(this.addr) + ' ' + Util.toHexWord(instruction) + ' ';
        let ts, td, s, d, b, c, w, disp, imm;
        const opcode = this.decoderTable[instruction];
        if (opcode != null) {
            // Decode instruction
            let src = null;
            let dst = null;
            switch (opcode.format) {
                case 1:
                    // Two general addresses
                    b = (instruction & 0x1000) >> 12;
                    td = (instruction & 0x0c00) >> 10;
                    d = (instruction & 0x03c0) >> 6;
                    ts = (instruction & 0x0030) >> 4;
                    s = (instruction & 0x000f);
                    src = this.ga(ts, s);
                    dst = this.ga(td, d);
                    break;
                case 2:
                    // Jump and CRU bit
                    disp = (instruction & 0x00ff);
                    if (opcode.id !== 'TB' && opcode.id !== 'SBO' && opcode.id !== 'SBZ') {
                        if ((disp & 0x80) !== 0) {
                            disp = 128 - (disp & 0x7f);
                            disp = this.addr + 2 - 2 * disp;
                        } else {
                            disp = this.addr + 2 + 2 * disp;
                        }
                        src = Util.toHexWord(disp);
                    } else {
                        src = (disp & 0x80) === 0 ? disp : disp - 256;
                    }
                    break;
                case 3:
                    // Logical
                    d = (instruction & 0x03c0) >> 6;
                    ts = (instruction & 0x0030) >> 4;
                    s = (instruction & 0x000f);
                    src = this.ga(ts, s);
                    dst = Disassembler.r(d);
                    break;
                case 4:
                    // CRU multi bit
                    c = (instruction & 0x03c0) >> 6;
                    ts = (instruction & 0x0030) >> 4;
                    s = (instruction & 0x000f);
                    b = (c > 8 ? 0 : 1);
                    src = this.ga(ts, s);
                    dst = c;
                    break;
                case 5:
                    // Register shift
                    c = (instruction & 0x00f0) >> 4;
                    w = (instruction & 0x000f);
                    src = Disassembler.r(w);
                    dst = c;
                    break;
                case 6:
                    // Single address
                    ts = (instruction & 0x0030) >> 4;
                    s = instruction & 0x000f;
                    src = this.ga(ts, s);
                    break;
                case 7:
                    // Control (no arguments)
                    break;
                case 8:
                    // Immediate
                    if (opcode.id === 'STST' || opcode.id === 'STWP') {
                        w = (instruction & 0x000f);
                        src = Disassembler.r(w);
                    } else {
                        w = (instruction & 0x000f); // 0 for LIMI and LWPI
                        this.addr += 2;
                        imm = this.memory.getWord(this.addr);
                        if (opcode.id !== 'LIMI' && opcode.id !== 'LWPI') {
                            src = Disassembler.r(w);
                        }
                        dst = Util.toHexWord(imm);
                    }
                    break;
                case 9:
                    // Multiply, divide, XOP
                    d = (instruction & 0x03c0) >> 6;
                    ts = (instruction & 0x0030) >> 4;
                    s = (instruction & 0x000f);
                    src = this.ga(ts, s);
                    dst = Disassembler.r(d);
                    break;
                default:
                    break;
            }
            // Output disassembly
            line += Util.padr(opcode.id, " ", 4);
            if (src != null || dst != null) {
                line += ' ';
                if (src != null) {
                    line += src;
                }
                if (src != null && dst != null) {
                    line += ',';
                }
                if (dst != null) {
                    line += dst;
                }
            }
        } else {
            // Illegal
            line += 'DATA ' + Util.toHexWord(instruction);
        }
        return line;
    }

    private ga(type: number, val: number): string {
        let text: string;
        switch (type) {
            case 0:
                // Register (R1)
                text = Disassembler.r(val);
                break;
            case 1:
                // Register indirect (*R1)
                text = '*' + Disassembler.r(val);
                break;
            case 2:
                // Symbolic or indexed
                this.addr += 2;
                const word = this.memory.getWord(this.addr);
                if (val === 0) {
                    // Symbolic	(@>1000)
                    text = '@' + Util.toHexWord(word);
                } else {
                    // Indexed (@>1000(R1))
                    text = '@' + Util.toHexWord(word) + '(' + Disassembler.r(val) + ')';
                }
                break;
            case 3:
                // Post increment (*R1+)
                text = '*' + Disassembler.r(val) + '+';
                break;
        }
        return text;
    }
}
