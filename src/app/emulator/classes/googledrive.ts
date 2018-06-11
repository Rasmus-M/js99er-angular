import {Memory} from './memory';
import {TI994A} from './ti994a';

export class GoogleDrive {

    static DSR_HOOK_START: number;
    static DSR_HOOK_END: number;
    static DSR_ROM: Uint8Array;

    constructor(name: string, diskImage: string, console: TI994A) {}

    static execute(PC: number, googleDrives: object, memory: Memory, bind: any) {
        return false;
    }

    reset() {

    }
}
