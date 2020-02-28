import {MemoryView} from "../../classes/memoryview";

export interface MemoryDevice {
    getWord(addr: number): number;
    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView;
}
