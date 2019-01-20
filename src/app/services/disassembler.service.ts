import {Injectable} from '@angular/core';
import {MemoryDevice} from '../emulator/interfaces/memory-device';
import {Disassembler} from "../classes/disassembler";

@Injectable({
    providedIn: 'root'
})
export class DisassemblerService {

    private disassembler: Disassembler;

    constructor() {
        this.disassembler = new Disassembler();
    }

    setMemory(memory: MemoryDevice) {
        this.disassembler.setMemory(memory);
    }

    disassemble(start, length, maxInstructions, anchorAddr): {lines: string[], anchorLine: number} {
        return this.disassembler.disassemble(start, length, maxInstructions, anchorAddr);
    }
}
