export class Util {

    static toHexWord(number: number): string {
        let s = number.toString(16).toUpperCase();
        while (s.length < 4) {
            s = '0' + s;
        }
        return '>' + s;
    }

    static toHexWordShort(number: number): string {
        let s = number.toString(16).toUpperCase();
        while (s.length < 4) {
            s = '0' + s;
        }
        return s;
    }

    static toHexByte(number: number): string {
        let s = number.toString(16).toUpperCase();
        if (s.length < 2) {
            s = '0' + s;
        }
        return '>' + s;
    }

    static toHexByteShort(number: number): string {
        let s = number.toString(16).toUpperCase();
        if (s.length < 2) {
            s = '0' + s;
        }
        return s;
    }

    static toHexNybble(number: number): string {
        return '>' + number.toString(16).toUpperCase();
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

    static repeat(s: string, n: number) {
        let s1 = "";
        for (let i = 0; i < n; i++) {
            s1 += s;
        }
        return s1;
    }

    static format(s: string, ...args: (string | number)[]) {
        if (s.indexOf('%s') !== -1 && args.length > 0) {
            s = s.replace('%s', String(args[0]));
        } else if (s.indexOf('%d') !== -1 && args.length > 0) {
            s = s.replace('%d', String(args[0]));
        }
        return s;
    }

    static hexArrayToByteArray(hexArray: string[]) {
        const binArray = [];
        let n = 0;
        for (let i = 0; i < hexArray.length; i++) {
            const row = hexArray[i];
            for (let j = 0; j < row.length; j += 2) {
                binArray[n++] = parseInt(row.substr(j, 2), 16);
            }
        }
        return new Uint8Array(binArray);
    }

    static fileListToFileArray(fileList: FileList | null) {
        const files: File[] = [];
        if (fileList) {
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList.item(i);
                if (file) {
                    files.push(file);
                }
            }
        }
        return files;
    }

    static isDiskImage(fileBuffer: Uint8Array) {
        return fileBuffer.length >= 16 && fileBuffer[0x0D] === 0x44 && fileBuffer[0x0E] === 0x53 && fileBuffer[0x0F] === 0x4B;
    }
}
