import {MemoryDevice} from "../interfaces/memory-device";
import {MemoryView} from "../../classes/memory-view";
import {Stateful} from "../interfaces/stateful";

export class RAM32K implements MemoryDevice, Stateful {

    private readonly ram: Uint8Array;

    constructor() {
        this.ram = new Uint8Array(0x10000);
    }

    readWord(addr: number): number {
        return (this.ram[addr] << 8) | this.ram[addr + 1];
    }

    writeWord(addr: number, w: number) {
        this.ram[addr] = w >> 8;
        this.ram[addr + 1] = w & 0xff;
    }

    getByte(addr: number): number {
        return this.ram[addr];
    }

    setByte(addr: number, b: number) {
        this.ram[addr] = b;
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

    getState(): any {
        return {
            ram: this.ram
        };
    }

    restoreState(state: any): void {
        this.ram.set(state.ram);
    }
}
