import {MemoryDevice} from "../interfaces/memory-device";
import {MemoryView} from "../../classes/memory-view";

export class RAM32K implements MemoryDevice {

    private readonly ram: Uint8Array;

    constructor() {
        this.ram = new Uint8Array(0x10000);
    }

    getMemorySize(): number {
        return 0x10000;
    }

    getWord(addr: number): number {
        return (this.ram[addr] << 8) | this.ram[addr + 1];
    }

    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
            return this.ram[addr];
        });
    }
}
