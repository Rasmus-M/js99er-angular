import {Util} from "./util";

export class MemoryLine {

    index?: number;
    addr: number | null;
    text: string;

    constructor(addr: number, text: string) {
        this.addr = addr;
        this.text = text;
    }
}

export class MemoryView {

    lines: MemoryLine[];
    anchorLine: number | null;
    breakpointLines: number[];

    constructor(lines: MemoryLine[], anchorLine: number | null, breakpointLines: number[]) {
        this.lines = lines;
        this.anchorLine = anchorLine;
        this.breakpointLines = breakpointLines;
    }

    static hexView(start: number, length: number, width: number, anchorAddr: number, getByte: (addr: number) => number): MemoryView {
        const mask = width - 1;
        const lines: MemoryLine[] = [];
        let anchorLine: number | null = null;
        let addr = start;
        let lineNo = 0;
        let line = "";
        let ascii = "";
        for (let i = 0; i < length; addr++, i++) {
            if (anchorAddr === addr) {
                anchorLine = lineNo;
            }
            if ((i & mask) === 0) {
                line += (addr >= 0 ? Util.toHexWord(addr) : '>----') + ': ';
            }
            const byte = addr >= 0 ? getByte(addr) : undefined;
            line += byte !== undefined ? Util.toHexByteShort(byte) : '--';
            ascii += byte !== undefined && byte >= 32 && byte < 127 ? String.fromCharCode(byte) : "\u25a1";
            if ((i & mask) === mask) {
                line += " " + ascii;
                lines.push({addr: addr, text: line});
                line = "";
                ascii = "";
                lineNo++;
            } else {
                line += ' ';
            }
        }
        return new MemoryView(lines, anchorLine, []);
    }

}
