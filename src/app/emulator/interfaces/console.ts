import {Software} from "../../classes/software";
import {DiskDrive} from "../classes/diskdrive";
import {Memory} from "../classes/memory";
import {Speech} from "./speech";
import {PSG} from "./psg";
import {VDP} from "./vdp";
import {Tape} from "../classes/tape";
import {Keyboard} from "../classes/keyboard";
import {CPU} from "./cpu";
import {CRU} from "../classes/cru";
import {GoogleDrive} from "../classes/googledrive";

export interface Console {
    start(fast: boolean);
    reset(keepCart: boolean);
    frame();
    step();
    stepOver();
    stop();
    loadSoftware(software: Software);
    getDiskDrives(): DiskDrive[];
    getCPU(): CPU;
    getVDP(): VDP;
    getPSG(): PSG;
    getSpeech(): Speech;
    getCRU(): CRU;
    getMemory(): Memory;
    getKeyboard(): Keyboard;
    getTape(): Tape;
    getDiskDrives(): DiskDrive[];
    getGoogleDrives(): GoogleDrive[];
    setVDP();
    setGoogleDrive();
    isRunning();
}
