import {Injectable} from '@angular/core';
import {MemoryDevice} from '../emulator/interfaces/memory-device';
import {Disassembler} from "../classes/disassembler";
import {MemoryView} from "../classes/memory-view";
import {Breakpoint} from "../classes/breakpoint";

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

    disassemble(start: number, length: number | null, maxInstructions: number | null, anchorAddr: number, breakpoints: Breakpoint[]): MemoryView {
        return this.disassembler.disassemble(start, length, maxInstructions, anchorAddr, breakpoints);
    }
}
