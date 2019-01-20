export class Opcode {

    code: number;
    id: string;
    format: number;
    original: boolean;
    formatMaskLength: number;
    formatMask: number;
    invFormatMask: number;

    constructor(code, id, format, original) {
        this.code = code;
        this.id = id;
        this.format = format;
        this.original = original;
        this.formatMaskLength = [0, 4, 8, 6, 6, 8, 10, 16, 12, 6][format];
        this.formatMask = (0xFFFF0000 >> this.formatMaskLength) & 0xFFFF;
        this.invFormatMask = (this.formatMask ^ 0xFFFF);
    }
}
