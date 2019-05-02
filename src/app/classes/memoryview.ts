export class MemoryView {

    lines: string[];
    anchorLine: number;
    breakpointLine: number;

    constructor(lines: string[], anchorLine: number, breakpointLine: number) {
        this.lines = lines;
        this.anchorLine = anchorLine;
        this.breakpointLine = breakpointLine;
    }
}
