import {Software} from "../../classes/software";
import {MemoryDevice} from "../interfaces/memory-device";
import {MemoryView} from "../../classes/memory-view";
import {CPU} from "../interfaces/cpu";
import {GROMArray} from "./grom-array";
import {Memory} from "./memory";
import {Settings} from "../../classes/settings";
import {CruDevice} from "../interfaces/cru-device";
import {Stateful} from "../interfaces/stateful";

export class Cartridge implements MemoryDevice, CruDevice, Stateful  {

    private cartImage?: Uint8Array;
    private gromBases: GROMArray[];
    private inverted = false;
    private cruBankSwitched = false;
    private bankCount = 0;
    private currentBank = 0;
    private addrOffset = -0x6000;
    private ramFG99Paged = false;
    private currentRAMBank = 0;
    private addrRAMOffset = -0x6000;
    private ramAt6000 = false;
    private ramAt7000 = false;

constructor(software: Software, private settings: Settings) {
        this.init(software);
    }

    private init(software: Software) {
        this.cartImage = software.rom;
        this.bankCount = this.cartImage ? Math.floor(this.cartImage.length / 0x2000) : 0;
        this.inverted = software.inverted;
        this.setCurrentCartBank(!this.inverted ? 0 : this.bankCount - 1);
        this.cruBankSwitched = software.cruBankSwitched;
        this.ramFG99Paged = software.ramFG99Paged;
        this.ramAt6000 = software.ramAt6000;
        this.ramAt7000 = software.ramAt7000;
        this.gromBases = [];
        for (const data of software.grom ? [software.grom] : software.groms || []) {
            const gromBase = new GROMArray();
            gromBase.setData(data, 0x6000);
            this.gromBases.push(gromBase);
        }
        console.log(this);
    }

    public reset() {
        this.setCurrentCartBank(!this.inverted ? 0 : this.bankCount - 1);
    }

    public read(addr: number): number {
        if (addr < 0x7000) {
            return this.ramAt6000 ? this.readRAM(addr) : this.readROM(addr);
        } else {
            return this.ramAt7000 ? this.readRAM(addr) : this.readROM(addr);
        }
    }

    public write(addr: number, word: number): void {
        if (addr < 0x7000) {
            this.ramAt6000 ? this.writeRAM(addr, word) : this.writeROM(addr, word);
        } else {
            this.ramAt7000 ? this.writeRAM(addr, word) : this.writeROM(addr, word);
        }
    }

    public getCruAddress(): number {
        return this.cruBankSwitched ? 0x800 : 0;
    }

    public getId(): string {
        return "CART";
    }

    public readCruBit(bit: number): boolean {
        return false;
    }

    public writeCruBit(bit: number, value: boolean): void {
        if (value && bit > 0) {
            const bank = (bit - 1) >> 1;
            this.setCRUCartBank(bank);
        }
    }

    private readROM(addr: number): number {
        return this.cartImage ? (this.cartImage[addr + this.addrOffset] << 8) | this.cartImage[addr + this.addrOffset + 1] : 0;
    }

    private writeROM(addr: number, w: number) {
        if (!this.cruBankSwitched) {
            let bank = (addr >> 1) & (this.bankCount - 1);
            if (!this.ramFG99Paged || addr < 0x6800) {
                if (this.inverted) {
                    bank = this.bankCount - bank - 1;
                }
                this.setCurrentCartBank(bank);
            } else {
                this.setCurrentCartRAMBank(bank);
            }
        }
    }

    private readRAM(addr: number): number {
        // this.log.info("Read cartridge RAM: " + addr.toHexWord());
        return this.cartImage ? (this.cartImage[addr + this.addrRAMOffset] << 8) | this.cartImage[addr + this.addrRAMOffset + 1] : 0;
    }

    private writeRAM(addr: number, w: number) {
        // this.log.info("Write cartridge RAM: " + addr.toHexWord());
        if (this.cartImage) {
            this.cartImage[addr + this.addrRAMOffset] = w >> 8;
            this.cartImage[addr + this.addrRAMOffset + 1] = w & 0xFF;
        }
    }

    public hasGROM() {
        return this.gromBases.length > 0;
    }

    public readGROM(addr: number): number {
        let value = 0;
        if (this.gromBases.length) {
            const base = this.gromBases.length === 1 ? 0 : (addr & 0x003C) >> 2;
            if (base !== 0) {
                console.log("Base=" + base);
            }
            addr = addr & 0x9802;
            if (addr === Memory.GRMRD) {
                // Read data from GROM
                this.gromBases.forEach((gromBase, i) => {
                    if (gromBase) {
                        const w = gromBase.readData();
                        if (i === base) {
                            value = w;
                        }
                    }
                });
            } else if (addr === Memory.GRMRA) {
                // Get GROM address
                this.gromBases.forEach((gromBase, i) => {
                    if (gromBase) {
                        const w = gromBase.readAddress();
                        if (i === base) {
                            value = w;
                        }
                    }
                });
            }
        }
        return value;
    }

    public writeGROM(addr: number, w: number) {
        if (this.gromBases.length) {
            addr = addr & 0x9C02;
            if (addr === Memory.GRMWD) {
                if (this.settings.isGRAMEnabled()) {
                    // Write data to GROM
                    this.gromBases.forEach((grom, i) => {
                        if (grom) {
                            grom.writeData(w);
                        }
                    });
                }
            } else if (addr === Memory.GRMWA) {
                // Set GROM address
                this.gromBases.forEach((grom) => {
                    if (grom) {
                        grom.writeAddress(w);
                    }
                });
            }
        }
    }

    setCRUCartBank(bank: number) {
        if (this.cruBankSwitched) {
            // this.log.info("Set CRU cart bank " + bank);
            this.setCurrentCartBank(bank);
        }
    }

    private setCurrentCartBank(bank: number) {
        this.currentBank = bank;
        this.addrOffset = (this.currentBank << 13) - 0x6000;
        if (!this.ramFG99Paged) {
            this.setCurrentCartRAMBank(bank);
        }
        // this.log.info("Cartridge ROM bank selected: " + this.currentCartBank);
    }

    private setCurrentCartRAMBank(bank: number) {
        this.currentRAMBank = bank;
        this.addrRAMOffset = (this.currentRAMBank << 13) - 0x6000;
        // this.log.info("Cartridge RAM bank selected: " + this.currentCartRAMBank);
    }

    getByte(addr: number) {
        return this.cartImage ? this.cartImage[addr + this.addrOffset] : 0;
    }

    getMemorySize(): number {
        return this.cartImage ? this.cartImage.length : 0;
    }

    getWord(addr: number): number {
        return this.cartImage ? (this.cartImage[addr] << 8) | this.cartImage[addr + 1] : 0;
    }

    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
            return this.cartImage ? this.cartImage[addr] : 0;
        });
    }

    getStatus(): string {
        return 'bank ' + this.currentBank + (this.ramFG99Paged ? '/' + this.currentRAMBank : '') + ' of ' + this.bankCount;
    }

    isExtendedBasic() {
        if (this.gromBases.length === 0) {
            const grom = this.gromBases[0];
            return grom.getByte(0x6343) === 0x45 && grom.getByte(0x6344) === 0x58 && grom.getByte(0x6345) === 0x54;
        }
        return false;
    }

    getState(): any {
        return {
            cartImage: this.cartImage,
            gromBases: this.gromBases.map(gb => gb.getState()),
            inverted: this.inverted,
            cruBankSwitched: this.cruBankSwitched,
            bankCount: this.bankCount,
            currentBank: this.currentBank,
            addrOffset: this.addrOffset,
            ramFG99Paged: this.ramFG99Paged,
            currentRAMBank: this.currentRAMBank,
            addrRAMOffset: this.addrRAMOffset,
            ramAt6000: this.ramAt6000,
            ramAt7000: this.ramAt7000
        };
    }

    restoreState(state: any): void {
        this.cartImage = state.cartImage;
        this.gromBases = state.gromBases.map((data: any) => {
            const gromBase = new GROMArray();
            gromBase.restoreState(data);
            return gromBase;
        });
        this.inverted = state.inverted;
        this.cruBankSwitched = state.cruBankSwitched;
        this.bankCount = state.bankCount;
        this.currentBank = state.currentBank;
        this.addrOffset = state.addrOffset;
        this.ramFG99Paged = state.ramFG99Paged;
        this.currentRAMBank = state.currentRAMBank;
        this.addrRAMOffset = state.addrRAMOffset;
        this.ramAt6000 = state.ramAt6000;
        this.ramAt7000 = state.ramAt7000;
    }
}
