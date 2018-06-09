import {Memory} from './memory';
import {DiskImage} from './disk';

export class GoogleDrive {

    static DSR_HOOK_START: number;
    static DSR_HOOK_END: number;
    static DSR_ROM: Uint8Array;

    constructor(name: string, vdpRAM: Uint8Array, diskImage: DiskImage) {}

    static execute(PC: number, googleDrives: object, memory: Memory, bind: any) {
        return false;
    }

    setRAM(ram: Uint8Array) {

    }
}
