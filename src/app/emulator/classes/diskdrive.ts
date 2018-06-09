import {Memory} from './memory';

export class DiskDrive {

    static DSR_HOOK_START: number;
    static DSR_HOOK_END: number;
    static DSR_ROM: Uint8Array;

    static execute(PC: number, diskDrives: object[], memory: Memory) {

    }
}
