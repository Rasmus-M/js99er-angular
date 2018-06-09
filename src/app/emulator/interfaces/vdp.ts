export interface VDP {
    reset();
    drawFrame(timestamp: number);
    initFrame(timestamp: number);
    drawScanline(y: number);
    updateCanvas();
    writeAddress(i: number);
    writeData(i: number);
    readStatus(): number;
    readData(): number;
    getRAM(): Uint8Array;
    getRegsString(): string;
    hexView(start, length, anchorAddr): object;
    getWord(addr: number);
    getCharAt(x: number, y: number);
    setFlicker(value: boolean);
    getState(): object;
    restoreState(state: object);
}
