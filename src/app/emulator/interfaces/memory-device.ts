import {MemoryView} from "../../classes/memory-view";

export interface MemoryDevice {
    getWord(addr: number): number;
    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView;
    getMemorySize(): number;
}
