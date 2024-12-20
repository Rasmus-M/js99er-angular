import {MemoryMappedCard} from "../interfaces/memory-mapped-card";
import {CPU} from "../interfaces/cpu";
import {RAMDisk} from "../interfaces/ram-disk";
import {Console} from '../interfaces/console';
import {Log} from "../../classes/log";
import {DatabaseService} from "../../services/database.service";

export class Horizon implements RAMDisk, MemoryMappedCard {

    static ID = 'HORIZON';
    static SIZE = 4096;

    private databaseService: DatabaseService;
    private saveTimeoutId?: number;
    private log = Log.getLog();

    private enabled: boolean;
    private dsrRAM: number[];
    private dsrPage: number;
    private ram: Uint8Array;
    private ramPage: number;
    private ramboMode: boolean;

    constructor(console: Console) {
        this.databaseService = console.getDatabaseService();
        this.init();
    }

    init() {
        this.dsrRAM = [];
        for (let i = 0; i < 0x4000; i++) {
            this.dsrRAM[i] = 0;
        }
        this.ram = new Uint8Array(Horizon.SIZE * 1024);
    }

    reset() {
        this.enabled = false;
        this.dsrPage = 0;
        this.ramPage = 0;
    }

    getId(): string {
        return Horizon.ID;
    }

    getCruAddress(): number {
        return 0x1400;
    }

    getDSR(): number[] {
        return this.dsrRAM;
    }

    setDSR(dsr: number[]): void {
        this.dsrRAM = dsr;
    }

    getDSRBankOffset(): number {
        return this.dsrPage << 13;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getRAM(): Uint8Array {
        return this.ram;
    }

    setRAM(ram: Uint8Array): void {
        this.ram = ram;
    }

    isRamboEnabled() {
        return this.ramboMode;
    }

    readMemoryMapped(addr: number, cpu: CPU): number {
        if (addr < 0x5800 || this.ramboMode) {
            const dsrAddr = (addr - 0x4000) + (this.dsrPage << 13);
            return (this.dsrRAM[dsrAddr] << 8) | this.dsrRAM[dsrAddr + 1];
        } else {
            const ramAddr = (addr & 0x7ff) + (this.ramPage << 11);
            return (this.ram[ramAddr] << 8) | this.ram[ramAddr + 1];
        }
    }

    writeMemoryMapped(addr: number, word: number, cpu: CPU): void {
        if (addr < 0x5800 || this.ramboMode) {
            const dsrAddr = (addr - 0x4000) + (this.dsrPage << 13);
            this.dsrRAM[dsrAddr] = word >> 8;
            this.dsrRAM[dsrAddr + 1] = word & 0xff;
        } else {
            const ramAddr = (addr & 0x7ff) + (this.ramPage << 11);
            this.ram[ramAddr] = word >> 8;
            this.ram[ramAddr + 1] = word & 0xff;
        }
        this.scheduleSaveContents();
    }

    readCartridgeSpace(addr: number): number {
        const ramAddr = this.getRamboAddr(addr);
        return (this.ram[ramAddr] << 8) | this.ram[ramAddr + 1];
    }

    writeCartridgeSpace(addr: number, word: number) {
        const ramAddr = this.getRamboAddr(addr);
        this.ram[ramAddr] = word >> 8;
        this.ram[ramAddr + 1] = word & 0xff;
        this.scheduleSaveContents();
    }

    getRamboAddr(addr: number) {
        const ramPage = (this.ramPage & 0xfffc) | ((addr & 0x1000) >> 12) | ((addr & 0x0800) >> 10);
        return (addr & 0x07ff) + (ramPage << 11);
    }

    readCruBit(bit: number): boolean {
        return false;
    }

    writeCruBit(bit: number, value: boolean): void {
        switch (bit & 0x0f) {
            case 0:
                this.enabled = value;
                break;
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
                const mask = 1 << (bit - 1);
                if (value) {
                    this.ramPage |= mask;
                } else {
                    this.ramPage &= ~mask;
                }
                this.ramPage &= (Horizon.SIZE / 2) - 1;
                break;
            case 14:
                this.dsrPage = value ? 1 : 0;
                break;
            case 15:
                console.log("RAMBO mode " + (value ? "enabled" : "disabled"));
                this.ramboMode = value;
                break;
        }
    }

    getByte(addr: number): number {
        if (addr < 0x5800 || this.ramboMode) {
            const dsrAddr = (addr - 0x4000) + (this.dsrPage << 13);
            return this.dsrRAM[dsrAddr];
        } else {
            const ramAddr = (addr & 0x7ff) + (this.ramPage << 11);
            return this.ram[ramAddr];
        }
    }

    scheduleSaveContents() {
        if (!this.databaseService.isSupported()) {
            return;
        }
        window.clearTimeout(this.saveTimeoutId);
        this.saveTimeoutId = window.setTimeout(() => {
            this.databaseService.saveRAMDisk(this).then((result) => {
                console.log("RAM disk " + (result ? "" : "not ") + "saved.");
            });
        }, 2000);
    }

    getState(): any {
        return {
            enabled: this.enabled,
            dsrRAM: this.dsrRAM,
            dsrPage: this.dsrPage,
            ram: this.ram,
            ramPage: this.ramPage,
            ramboMode: this.ramboMode
        };
    }

    restoreState(state: any): void {
        this.enabled = state.enabled;
        this.dsrRAM = state.dsrRAM;
        this.dsrPage = state.dsrPage;
        this.ram = state.ram;
        this.ramPage = state.ramPage;
        this.ramboMode = state.ramboMode;
    }
}
