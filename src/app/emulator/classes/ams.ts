import {Log} from '../../log';
import {State} from '../interfaces/state';
import {Util} from '../util';

export class AMS implements State {

    static MAPPING_MODE = 0;
    static TRANSPARENT_MODE = 1;

    private size: number;
    private pages: number;
    private registerAccess: boolean;
    private ram: Uint8Array;
    private transparentMap: number[];
    private registerMap: number[];
    private map: number[];
    private log: Log;

    constructor(size: number) {
        this.size = size;
        this.pages = size >> 2;
        this.log = Log.getLog();
        this.reset();
    }

    reset() {
        this.registerAccess = false;
        this.ram = new Uint8Array(this.size * 1024);
        this.transparentMap = [
            null, null, 2, 3, null, null, null, null, null, null, 10, 11, 12, 13,  14, 15
        ];
        this.registerMap = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ];
        this.map = null;
        this.setMode(AMS.TRANSPARENT_MODE);
    }

    hasRegisterAccess(): boolean {
        return this.registerAccess;
    }

    setRegisterAccess(enabled: boolean) {
        this.log.info("AMS mapping register access " + (enabled ? "on" : "off"));
        this.registerAccess = enabled;
    }

    setMode(mode: number) {
        this.log.info("AMS " + (mode === AMS.MAPPING_MODE ? "mapping" : "transparent") + " mode set");
        this.map = mode === AMS.TRANSPARENT_MODE ? this.transparentMap : this.registerMap;

    }

    readRegister(regNo: number): number {
        return this.registerAccess ? this.registerMap[regNo & 0xF] : 0;
    }

    writeRegister(regNo: number, page: number) {
        if (this.registerAccess) {
            this.log.info("Write " + Util.toHexWord(page) + " to AMS register " + Util.toHexByte(regNo));
            this.registerMap[regNo & 0xF] = page;
        }
    }

    readWord(addr: number): number {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const amsAddr = ((this.map[regNo] & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            return this.ram[amsAddr] << 8 | this.ram[amsAddr + 1];
        }
        return 0;
    }

    writeWord(addr: number, w: number) {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const amsAddr = ((this.map[regNo] & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            this.ram[amsAddr] = (w & 0xFF00) >> 8;
            this.ram[amsAddr + 1] = w & 0xFF;
        }
    }

    getByte(addr: number): number {
        const page = this.map[(addr & 0xF000) >> 12];
        if (page != null) {
            const amsAddr = (page & (this.pages - 1)) << 12 | (addr & 0x0FFF);
            return this.ram[amsAddr];
        }
        return 0;
    }

    setByte(addr: number, b: number) {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const amsAddr = ((this.map[regNo] & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            this.ram[amsAddr] = b;
        }
    }

    getStatusString(): string {
        let s = "";
        for (let regNo = 0; regNo < this.transparentMap.length; regNo++) {
            if (this.transparentMap[regNo] != null) {
               s += Util.toHex12Bit(this.map[regNo] & (this.pages - 1)) + " ";
            }
        }
        return s;
    }

    getState(): object {
        return {
            size: this.size,
            pages: this.pages,
            registerAccess: this.registerAccess,
            ram: this.ram,
            transparentMap: this.transparentMap,
            registerMap: this.registerMap,
            map: this.map
        };
    }

    restoreState(state: any) {
        this.size = state.size;
        this.pages = state.pages;
        this.registerAccess = state.registerAccess;
        this.ram = state.ram;
        this.transparentMap = state.transparentMap;
        this.registerMap = state.registerMap;
        this.map = state.map;
    }
}
