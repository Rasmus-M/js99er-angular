export interface MemoryDevice {
    getWord(addr: number): number;
    hexView(start: number, length: number, anchorAddr: number): object;
}
