import {Injectable} from '@angular/core';
import {MemoryDevice} from '../emulator/interfaces/memory-device';
import {Disassembler} from "../classes/disassembler";
import {MemoryView} from "../classes/memoryview";

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

    disassemble(start: number, length: number, maxInstructions: number, anchorAddr: number, breakpointAddr: number): MemoryView {
        return this.disassembler.disassemble(start, length, maxInstructions, anchorAddr, breakpointAddr);
    }
}
