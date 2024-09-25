import {Software} from "../../classes/software";
import {DiskDrive} from "../classes/diskdrive";
import {Memory} from "../classes/memory";
import {Speech} from "./speech";
import {PSG} from "./psg";
import {VDP} from "./vdp";
import {Tape} from "../classes/tape";
import {Keyboard} from "../classes/keyboard";
import {CPU} from "./cpu";
import {TMS9901} from "../classes/tms9901";
import {GoogleDrive} from "../classes/googledrive";
import {TIPI} from "../classes/tipi";

export interface Console {
    start(fast: boolean, skipBreakpoint?: boolean);
    reset(keepCart: boolean);
    frame(skipBreakpoint?: boolean);
    step();
    stepOver();
    stop();
    loadSoftware(software: Software);
    getDiskDrives(): DiskDrive[];
    getCPU(): CPU;
    getVDP(): VDP;
    getPSG(): PSG;
    getSpeech(): Speech;
    getCRU(): TMS9901;
    getMemory(): Memory;
    getKeyboard(): Keyboard;
    getTape(): Tape;
    getDiskDrives(): DiskDrive[];
    getGoogleDrives(): GoogleDrive[];
    setGoogleDrive();
    getTIPI(): TIPI;
    setTIPI();
    setVDP();
    setPSG();
    isRunning();
}
