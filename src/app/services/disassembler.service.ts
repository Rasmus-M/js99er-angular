import {Injectable} from '@angular/core';
import {Decoder} from '../classes/decoder';
import {Util} from '../classes/util';
import {MemoryDevice} from '../emulator/interfaces/memory-device';

@Injectable({
    providedIn: 'root'
})
export class DisassemblerService {

    private memory: MemoryDevice;
    private start: number;
    private length: number;
    private maxInstructions: number;
    private anchorAddr: number;
    private addr: number;

    constructor() {
    }

    setMemory(memory: MemoryDevice) {
        this.memory = memory;
    }

    disassemble(start, length, maxInstructions, anchorAddr): {lines: string[], anchorLine: number} {
        this.start = Math.max(start || 0, 0);
        this.length = Math.min(length || 0x10000, 0x10000 - this.start);
        this.maxInstructions = maxInstructions || 0x10000;
        this.anchorAddr = anchorAddr || this.start;
        // Start by disassembling from the anchor address to ensure correct alignment
        const result = this.disassembleRange(this.anchorAddr, this.start + this.length - this.anchorAddr, this.maxInstructions, this.anchorAddr);
        // Then prepend the first part of the disassembly, which may be misaligned
        if (this.start < this.anchorAddr) {
            const result2 = this.disassembleRange(this.start, this.anchorAddr - this.start, this.maxInstructions - result.lines.length, null);
            result.lines = result2.lines.concat(result.lines);
            result.anchorLine += result2.lines.length;
        }
        return result;
    }

    private disassembleRange(start, length, maxInstructions, anchorAddr): {lines: string[], anchorLine: number} {
        this.addr = start;
        const end = start + length;
        const decoderTable = Decoder.getDecoderTable();
        const disassembly = [];
        let anchorLine = null;
        let ts, td, s, d, b, c, w, disp, imm;
        for (let i = 0; i < maxInstructions && this.addr < end; i++) {
            const instrAddr = this.addr; // Start address for current instruction
            const instr = this.memory.getWord(instrAddr);
            const opcode = decoderTable[instr];
            let line = (anchorAddr !== null && anchorLine === null && instrAddr >= anchorAddr) ? '\u27a8 ' : '  ';
            if (opcode != null) {
                // Decode instruction
                let src = null;
                let dst = null;
                switch (opcode.format) {
                    case 1:
                        // Two general addresses
                        b = (instr & 0x1000) >> 12;
                        td = (instr & 0x0c00) >> 10;
                        d = (instr & 0x03c0) >> 6;
                        ts = (instr & 0x0030) >> 4;
                        s = (instr & 0x000f);
                        src = this.ga(ts, s);
                        dst = this.ga(td, d);
                        break;
                    case 2:
                        // Jump and CRU bit
                        disp = (instr & 0x00ff);
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
                        d = (instr & 0x03c0) >> 6;
                        ts = (instr & 0x0030) >> 4;
                        s = (instr & 0x000f);
                        src = this.ga(ts, s);
                        dst = this.r(d);
                        break;
                    case 4:
                        // CRU multi bit
                        c = (instr & 0x03c0) >> 6;
                        ts = (instr & 0x0030) >> 4;
                        s = (instr & 0x000f);
                        b = (c > 8 ? 0 : 1);
                        src = this.ga(ts, s);
                        dst = c;
                        break;
                    case 5:
                        // Register shift
                        c = (instr & 0x00f0) >> 4;
                        w = (instr & 0x000f);
                        src = this.r(w);
                        dst = c;
                        break;
                    case 6:
                        // Single address
                        ts = (instr & 0x0030) >> 4;
                        s = instr & 0x000f;
                        src = this.ga(ts, s);
                        break;
                    case 7:
                        // Control (no arguments)
                        break;
                    case 8:
                        // Immediate
                        if (opcode.id === 'STST' || opcode.id === 'STWP') {
                            w = (instr & 0x000f);
                            src = this.r(w);
                        } else {
                            w = (instr & 0x000f); // 0 for LIMI and LWPI
                            this.addr += 2;
                            imm = this.memory.getWord(this.addr);
                            if (opcode.id !== 'LIMI' && opcode.id !== 'LWPI') {
                                src = this.r(w);
                            }
                            dst = Util.toHexWord(imm);
                        }
                        break;
                    case 9:
                        // Multiply, divide, XOP
                        d = (instr & 0x03c0) >> 6;
                        ts = (instr & 0x0030) >> 4;
                        s = (instr & 0x000f);
                        src = this.ga(ts, s);
                        dst = this.r(d);
                        break;
                    default:
                        break;
                }
                // Output disassembly
                line += Util.toHexWord(instrAddr) + ' ';
                line += Util.toHexWord(instr) + ' ';
                line += this.padr(opcode.id, " ", 4);
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
                line += Util.toHexWord(instrAddr) + ' ';
                line += Util.toHexWord(instr) + ' ';
                line += 'DATA ' + Util.toHexWord(instr);
            }
            disassembly.push(line);
            if (anchorAddr !== null && anchorLine === null && instrAddr >= anchorAddr) {
                anchorLine = i;
            }
            this.addr += 2;
        }
        return {lines: disassembly, anchorLine: anchorLine};
    }

    private ga(type, val) {
        let ret;
        switch (type) {
            case 0:
                // Register (R1)
                ret = this.r(val);
                break;
            case 1:
                // Register indirect (*R1)
                ret = '*' + this.r(val);
                break;
            case 2:
                // Symbolic or indexed
                this.addr += 2;
                const word = this.memory.getWord(this.addr);
                if (val === 0) {
                    // Symbolic	(@>1000)
                    ret = '@' + Util.toHexWord(word);
                } else {
                    // Indexed (@>1000(R1))
                    ret = '@' + Util.toHexWord(word) + '(' + this.r(val) + ')';
                }
                break;
            case 3:
                // Post increment (*R1+)
                ret = '*' + this.r(val) + '+';
                break;
        }
        return ret;
    }

    private r(val: number) {
        return 'R' + val;
    }

    private padr(s: string, ch: string, len: number) {
        while (s.length < len) {
            s = s + ch;
        }
        return s;
    }
}
