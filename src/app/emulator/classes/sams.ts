import {Log} from '../../classes/log';
import {Stateful} from '../interfaces/stateful';
import {Util} from '../../classes/util';
import {MemoryView} from "../../classes/memory-view";
import {MemoryDevice} from "../interfaces/memory-device";
import {PeripheralCard} from "../interfaces/peripheral-card";
import {MemoryMappedCard} from "../interfaces/memory-mapped-card";
import {CPU} from "../interfaces/cpu";

export class SAMS implements Stateful, MemoryDevice, PeripheralCard, MemoryMappedCard {

    static ID = 'SAMS';
    static MAPPING_MODE = 0;
    static TRANSPARENT_MODE = 1;

    private size: number;
    private pages: number;
    private registerAccess: boolean;
    private ram: Uint8Array;
    private transparentMap: (number | null)[];
    private registerMap: number[];
    private map: (number | null)[];
    private log: Log;
    private debugReset: boolean;

    constructor(size: number, debugReset: boolean) {
        this.size = size;
        this.pages = size >> 2;
        this.debugReset = debugReset;
        this.log = Log.getLog();
        this.reset();
    }

    reset() {
        this.registerAccess = false;
        this.ram = new Uint8Array(this.size * 1024);
        if (this.debugReset) {
            for (let i = 0; i < this.ram.length; i++) {
                this.ram[i] = i & 0xff;
            }
        }
        this.transparentMap = [
            null, null, 2, 3, null, null, null, null, null, null, 10, 11, 12, 13,  14, 15
        ];
        this.registerMap = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ];
        this.setMode(SAMS.TRANSPARENT_MODE);
    }

    public getId(): string {
        return SAMS.ID;
    }

    public isEnabled(): boolean {
        return this.registerAccess;
    }

    public getCruAddress(): number {
        return 0x1e00;
    }

    public readMemoryMapped(addr: number, cpu: CPU): number {
        const word = this.readRegister((addr & 0x1F) >> 1);
        return ((word & 0xFF) << 8) | (word >> 8);
    }

    public writeMemoryMapped(addr: number, word: number, cpu: CPU): void {
        this.writeRegister((addr & 0x1F) >> 1, ((word & 0xFF) << 8) | (word >> 8));
    }

    public readCruBit(bit: number): boolean {
        return false;
    }

    public writeCruBit(bit: number, value: boolean) {
        if (bit === 0) {
            // Controls access to mapping registers
            this.setRegisterAccess(value);
        } else if (bit === 1) {
            // Toggles between mapping mode and transparent mode
            this.setMode(value ? SAMS.MAPPING_MODE : SAMS.TRANSPARENT_MODE);
        }
    }

    setDebugResetEnabled(enabled: boolean) {
        this.debugReset = enabled;
    }

    hasRegisterAccess(): boolean {
        return this.registerAccess;
    }

    setRegisterAccess(enabled: boolean) {
        this.log.debug("SAMS mapping register access " + (enabled ? "on" : "off"));
        this.registerAccess = enabled;
    }

    setMode(mode: number) {
        this.log.info("SAMS " + (mode === SAMS.MAPPING_MODE ? "mapping" : "transparent") + " mode set");
        this.map = mode === SAMS.TRANSPARENT_MODE ? this.transparentMap : this.registerMap;
    }

    readRegister(regNo: number): number {
        const regValue = this.registerMap[regNo & 0xF];
        return this.registerAccess ? (this.size > 1024 ? regValue : ((regValue << 8) | regValue)) : 0;
    }

    writeRegister(regNo: number, page: number) {
        if (this.registerAccess) {
            this.log.debug("Write " + Util.toHexWord(page) + " to SAMS register " + Util.toHexByte(regNo));
            this.registerMap[regNo & 0xF] = page & ((this.size >> 2) - 1);
        }
    }

    readWord(addr: number): number {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const samsAddr = ((this.map[regNo]! & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            return this.ram[samsAddr] << 8 | this.ram[samsAddr + 1];
        }
        return 0;
    }

    writeWord(addr: number, w: number) {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const samsAddr = ((this.map[regNo]! & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            this.ram[samsAddr] = (w & 0xFF00) >> 8;
            this.ram[samsAddr + 1] = w & 0xFF;
        }
    }

    getByte(addr: number): number {
        const page = this.map[(addr & 0xF000) >> 12];
        if (page != null) {
            const samsAddr = (page & (this.pages - 1)) << 12 | (addr & 0x0FFF);
            return this.ram[samsAddr];
        }
        return 0;
    }

    setByte(addr: number, b: number) {
        const regNo = (addr & 0xF000) >> 12;
        if (this.transparentMap[regNo] != null) {
            const samsAddr = ((this.map[regNo]! & (this.pages - 1)) << 12) | (addr & 0x0FFF);
            this.ram[samsAddr] = b;
        }
    }

    getStatusString(detailed: boolean): string {
        let s = "";
        for (let regNo = 0; regNo < this.transparentMap.length; regNo++) {
            if (this.transparentMap[regNo] != null) {
               s += Util.toHexNybble(regNo) +  ":" + Util.toHexByte(this.map[regNo]! & (this.pages - 1)) + " ";
            }
        }
        return s;
    }

    getWord(addr: number): number {
        return this.ram[addr] << 8 | this.ram[addr + 1];
    }

    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
            return this.ram[addr];
        });
    }

    getMemorySize(): number {
        return this.ram.length;
    }

    getState(): any {
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
