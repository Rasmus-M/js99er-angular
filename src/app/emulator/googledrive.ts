import {Memory} from './memory';

export class GoogleDrive {
    static DSR_HOOK_START: number;
    static DSR_HOOK_END: number;

    static execute(PC: number, googleDrives: object, memory: Memory, bind: any) {
        return false;
    }
}
