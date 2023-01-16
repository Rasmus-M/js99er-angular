export class MemoryLine {

    index?: number;
    addr: number;
    text: string;

    constructor(addr: number, text: string) {
        this.addr = addr;
        this.text = text;
    }
}

export class MemoryView {

    lines: MemoryLine[];
    anchorLine: number;
    breakpointLine: number;

    constructor(lines: MemoryLine[], anchorLine: number, breakpointLine: number) {
        this.lines = lines;
        this.anchorLine = anchorLine;
        this.breakpointLine = breakpointLine;
    }
}
