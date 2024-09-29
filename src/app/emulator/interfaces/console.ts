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
    start(fast: boolean, skipBreakpoint?: boolean): void;
    reset(keepCart: boolean): void;
    frame(skipBreakpoint?: boolean): void;
    step(): void;
    stepOver(): void;
    stop(): void;
    loadSoftware(software: Software): void;
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
    setGoogleDrive(): void;
    getTIPI(): TIPI | null;
    setTIPI(): void;
    setVDP(): void;
    setPSG(): void;
    isRunning(): void;
}
