export class Util {

    static toHexWord(number) {
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

    static toHexWordShort(number) {
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

    static toHex12Bit(number) {
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

    static toHexByte(number) {
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

    static toHexByteShort(number) {
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

    static parseHexNumber(s: string) {
        return Util._parseNumber(s, 16);
    }

    static parseNumber(s: string) {
        return Util._parseNumber(s, 10);
    }

    static _parseNumber(s: string, defRadix: number) {
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

    static padr(s: string, ch: string, len: number) {
        while (s.length < len) {
            s = s + ch;
        }
        return s;
    }
}
