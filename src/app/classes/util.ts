export class Util {

    static toHexWord(number) {
        let s = number.toString(16).toUpperCase();
        while (s.length < 4) {
            s = '0' + s;
        }
        return '>' + s;
    }

    static toHex12Bit(number) {
        let s = number.toString(16).toUpperCase();
        while (s.length < 3) {
            s = '0' + s;
        }
        return '>' + s;
    }

    static toHexByte(number) {
        let s = number.toString(16).toUpperCase();
        if (s.length < 2) {
            s = '0' + s;
        }
        return '>' + s;
    }

    static toHexByteShort(number) {
        let s = number.toString(16).toUpperCase();
        if (s.length < 2) {
            s = '0' + s;
        }
        return s;
    }

    static parseNumber(s: string) {
        if (s.startsWith("0x")) {
            return parseInt(s.substring(2), 16);
        } else {
            return parseInt(s, 10);
        }
    }
}
