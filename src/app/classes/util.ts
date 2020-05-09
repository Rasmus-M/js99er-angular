export class Util {

    static toHexWord(number): string {
        if (typeof number === "number") {
            let s = number.toString(16).toUpperCase();
            while (s.length < 4) {
                s = '0' + s;
            }
            return '>' + s;
        } else {
            return '>????';
        }
    }

    static toHexWordShort(number): string {
        if (typeof number === "number") {
            let s = number.toString(16).toUpperCase();
            while (s.length < 4) {
                s = '0' + s;
            }
            return s;
        } else {
            return '????';
        }
    }

    static toHex12Bit(number): string {
        if (typeof number === "number") {
            let s = number.toString(16).toUpperCase();
            while (s.length < 3) {
                s = '0' + s;
            }
            return '>' + s;
        } else {
            return '>???';
        }
    }

    static toHexByte(number): string {
        if (typeof number === "number") {
            let s = number.toString(16).toUpperCase();
            if (s.length < 2) {
                s = '0' + s;
            }
            return '>' + s;
        } else {
            return '>??';
        }
    }

    static toHexByteShort(number): string {
        if (typeof number === "number") {
            let s = number.toString(16).toUpperCase();
            if (s.length < 2) {
                s = '0' + s;
            }
            return s;
        } else {
            return '??';
        }
    }

    static toHexNybble(number): string {
        if (typeof number === "number") {
            return '>' + number.toString(16).toUpperCase();
        } else {
            return '>?';
        }
    }

    static parseHexNumber(s: string): number {
        return Util._parseNumber(s, 16);
    }

    static parseNumber(s: string): number {
        return Util._parseNumber(s, 10);
    }

    static _parseNumber(s: string, defRadix: number): number {
        if (!s) {
            return NaN;
        } else if (s.startsWith("0x")) {
            return parseInt(s.substring(2), 16);
        } else if (s.startsWith(">")) {
            return parseInt(s.substring(1), 16);
        } else {
            return parseInt(s, defRadix);
        }
    }

    static padr(s: string, ch: string, len: number): string {
        while (s.length < len) {
            s = s + ch;
        }
        return s;
    }
}
