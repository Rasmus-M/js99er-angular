import {Tms9900} from './tms9900';

export class Memory {

    peripheralROMNumber: number;
    groms: any;

    readWord(addr: number, cpu: Tms9900): number {
        return 0;
    }

    writeWord(addr: number, number: number, cpu: Tms9900) {
    }

    getWord(addr: number): number {
        return 0;
    }

    getPADByte(number: number): number {
        return 0;
    }

    setPADByte(addr: number, value: number) {
    }
}
