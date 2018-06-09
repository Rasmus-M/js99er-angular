import {Memory} from './memory';

export class DiskDrive {

    static DSR_HOOK_START: number;
    static DSR_HOOK_END: number;
    static DSR_ROM: Uint8Array;

    constructor(name: string, vdpRAM: Uint8Array, diskImage: DiskImage) {

    }

    static execute(PC: number, diskDrives: object[], memory: Memory) {

    }

    setRAM(ram: Uint8Array) {

    }
}

export class DiskImage {

}
