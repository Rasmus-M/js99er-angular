import {Log} from '../../classes/log';
import {VDP} from '../interfaces/vdp';
import {SAMS} from './sams';
import {DiskDrive} from './diskdrive';
import {GoogleDrive} from './googledrive';
import {System} from './system';
import {Util} from '../../classes/util';
import {CPU} from '../interfaces/cpu';
import {Stateful} from '../interfaces/stateful';
import {RAMType, Settings, TIPIType} from '../../classes/settings';
import {PSG} from '../interfaces/psg';
import {Speech} from '../interfaces/speech';
import {MemoryDevice} from '../interfaces/memory-device';
import {MemoryLine, MemoryView} from "../../classes/memoryview";
import {TIPI} from "./tipi";
import {Console} from '../interfaces/console';
import {PCODE_GROM, PCODE_ROM} from "./pcode";
import {GROMArray} from "./gromArray";

export class Memory implements Stateful, MemoryDevice {

    static readonly SOUND = 0x8400;  // Sound write data
    static readonly VDPRD = 0x8800;  // VDP read data
    static readonly VDPSTA = 0x8802; // VDP status
    static readonly VDPWD = 0x8C00;  // VDP write data
    static readonly VDPWA = 0x8C02;  // VDP set read/write address
    static readonly VDPWP = 0x8C04;  // VDP write palette
    static readonly VDPWC = 0x8C06;  // VDP write register indirect
    static readonly SPCHRD = 0x9000; // Speech read data
    static readonly SPCHWD = 0x9400; // Speech write data
    static readonly GRMRD = 0x9800;  // GROM read data
    static readonly GRMRA = 0x9802;  // GROM read address
    static readonly GRMWD = 0x9C00;  // GROM write data
    static readonly GRMWA = 0x9C02;  // GROM write address

    static readonly GROM_BASES = 16;

    private console: Console;
    private vdp: VDP;
    private psg: PSG;
    private speech: Speech;
    private settings: Settings;

    private ramType: RAMType;
    private samsSize: number;
    private gramEnabled: boolean;
    private pCodeEnabled: boolean;
    private tipiType: TIPIType;
    private diskEnabled: boolean;
    private ramAt0000: boolean;
    private ramAt4000: boolean;
    private ramAt6000: boolean;
    private ramAt7000: boolean;
    private debugReset: boolean;

    private ram: Uint8Array;
    private sams: SAMS | null;

    private rom: Uint8Array;
    private gromBases: GROMArray[];
    private pcodeGroms: GROMArray;

    private cartImage: Uint8Array | null;
    private cartInverted: boolean;
    private cartCRUBankSwitched: boolean;
    private cartBankCount: number;
    private currentCartBank: number;
    private cartAddrOffset: number;
    private cartRAMFG99Paged: boolean;
    private currentCartRAMBank: number;
    private cartAddrRAMOffset: number;

    private peripheralROMs: Uint8Array[];
    private peripheralROMBanks: number[];
    private peripheralROMEnabled: boolean;
    private peripheralROMNumber: number;
    private diskROMNumber = -1;
    private tipiROMNumber = -1;
    private gdrROMNumber = -1;
    private pCodeROMNumber = -1;

    private memoryMap: Function[][];

    private log: Log = Log.getLog();

    constructor(console: Console, settings: Settings) {
        this.console = console;
        this.settings = settings;
    }

    reset(keepCart: boolean) {

        this.vdp = this.console.getVDP();
        this.psg = this.console.getPSG();
        this.speech = this.console.getSpeech();

        // RAM
        this.ramType = this.settings.getRAM();
        this.samsSize = this.settings.getSAMSSize();
        this.gramEnabled = this.settings.isGRAMEnabled();
        this.pCodeEnabled = this.settings.isPCodeEnabled();
        this.tipiType = this.settings.getTIPI();
        this.diskEnabled = this.settings.isDiskEnabled();
        this.debugReset = this.settings.isDebugResetEnabled();
        this.ram = new Uint8Array(0x10000);
        if (this.debugReset) {
            for (let i = 0; i < this.ram.length; i++) {
                this.ram[i] = i & 0xff;
            }
        }
        if (this.settings.isSAMSEnabled()) {
            this.sams = new SAMS(this.samsSize, this.debugReset);
        } else {
            this.sams = null;
        }

        // ROM
        this.rom = new Uint8Array(System.ROM);
        this.patchROMForTapeUsage();

        if (!keepCart) {
            this.ramAt6000 = false;
            this.ramAt7000 = false;
            // GROM
            this.gromBases = [];
            this.loadGROM(new Uint8Array(System.GROM), 0, 0);
            // Cartridge
            this.cartImage = null;
            this.cartInverted = false;
            this.cartCRUBankSwitched = false;
            this.cartBankCount = 0;
            this.cartRAMFG99Paged = false;
        }
        this.currentCartBank = 0;
        this.cartAddrOffset = -0x6000;
        this.currentCartRAMBank = 0;
        this.cartAddrRAMOffset = -0x6000;

        if (this.pCodeEnabled) {
            this.pcodeGroms = new GROMArray();
            this.pcodeGroms.setData(new Uint8Array(PCODE_GROM), 0);
        }

        // Peripheral ROM
        this.peripheralROMs = [];
        this.peripheralROMBanks = [];
        this.peripheralROMEnabled = false;
        this.peripheralROMNumber = 0;
        this.diskROMNumber = -1;
        this.tipiROMNumber = -1;
        this.gdrROMNumber = -1;
        this.pCodeROMNumber = -1;
        let romNumber = 1;
        if (this.tipiType === 'FULL') {
            this.tipiROMNumber = romNumber;
            this.loadPeripheralROM(new Uint8Array(TIPI.DSR_ROM), romNumber++);
        }
        if (this.diskEnabled) {
            this.diskROMNumber = romNumber;
            this.loadPeripheralROM(new Uint8Array(DiskDrive.DSR_ROM), romNumber++);
        }
        if (this.tipiType === 'MOUSE') {
            this.tipiROMNumber = romNumber;
            this.loadPeripheralROM(new Uint8Array(TIPI.DSR_ROM), romNumber++);
        }
        if (this.settings.isGoogleDriveEnabled()) {
            this.gdrROMNumber = romNumber;
            this.loadPeripheralROM(new Uint8Array(GoogleDrive.DSR_ROM), romNumber++);
        }
        if (this.pCodeEnabled) {
            this.pCodeROMNumber = 15;
            this.loadPeripheralROM(new Uint8Array(PCODE_ROM), this.pCodeROMNumber);
        }
        this.buildMemoryMap();
    }

    patchROMForTapeUsage() {
        this.rom[0x14a7] = 0x03; // Fix cassette sync (LI instead of CI)
        this.rom[0x14a9] = 0x37; // Cassette read time (original 0x1f)
        this.rom[0x1353] = 0x1f; // Cassette write time (original 0x23)
    }

    private buildMemoryMap() {
        this.memoryMap = [];
        const romAccessors = [this.readROM, this.writeROM];
        const ramAccessors = [this.readRAM, this.writeRAM];
        const peripheralROMAccessors = [this.readPeripheralROM, this.writePeripheralROM];
        const cartridgeROMAccessors = [this.readCartridgeROM, this.writeCartridgeROM];
        const cartridgeRAMAccessors = [this.readCartridgeRAM, this.writeCartridgeRAM];
        const padAccessors = [this.readPAD, this.writePAD];
        const soundAccessors = [this.readSound, this.writeSound];
        const vdpReadAccessors = [this.readVDP, this.writeNull];
        const vdpWriteAccessors = [this.readNull, this.writeVDP];
        const speechReadAccessors = [this.readSpeech, this.writeNull];
        const speechWriteAccessors = [this.readNull, this.writeSpeech];
        const gromReadAccessors = [this.readGROM, this.writeNull];
        const gromWriteAccessors = [this.readNull, this.writeGROM];
        const pCodeGROMReadAccessors = [this.readPCodeGROM, this.writeNull];
        const pCodeGROMWriteAccessors = [this.readNull, this.writePCodeGROM];
        let i: number;
        for (i = 0; i < 0x2000; i++) {
            this.memoryMap[i] = this.ramAt0000 ? ramAccessors : romAccessors;
        }
        for (i = 0x2000; i < 0x4000; i++) {
            this.memoryMap[i] = ramAccessors;
        }
        for (i = 0x4000; i < 0x6000; i++) {
            this.memoryMap[i] = this.ramAt4000 ? ramAccessors : peripheralROMAccessors;
        }
        for (i = 0x6000; i < 0x7000; i++) {
            this.memoryMap[i] = this.ramAt6000 ? cartridgeRAMAccessors : cartridgeROMAccessors;
        }
        for (i = 0x7000; i < 0x8000; i++) {
            this.memoryMap[i] = this.ramAt7000 ? cartridgeRAMAccessors : cartridgeROMAccessors;
        }
        for (i = 0x8000; i < Memory.SOUND; i++) {
            this.memoryMap[i] = padAccessors;
        }
        for (i = Memory.SOUND; i < Memory.VDPRD; i++) {
            this.memoryMap[i] = soundAccessors;
        }
        for (i = Memory.VDPRD; i < Memory.VDPWD; i++) {
            this.memoryMap[i] = vdpReadAccessors;
        }
        for (i = Memory.VDPWD; i < Memory.SPCHRD; i++) {
            this.memoryMap[i] = vdpWriteAccessors;
        }
        for (i = Memory.SPCHRD; i < Memory.SPCHWD; i++) {
            this.memoryMap[i] = speechReadAccessors;
        }
        for (i = Memory.SPCHWD; i < Memory.GRMRD; i++) {
            this.memoryMap[i] = speechWriteAccessors;
        }
        for (i = Memory.GRMRD; i < Memory.GRMWD; i++) {
            this.memoryMap[i] = gromReadAccessors;
        }
        for (i = Memory.GRMWD; i < 0xA000; i++) {
            this.memoryMap[i] = gromWriteAccessors;
        }
        for (i = 0xA000; i < 0x10000; i++) {
            this.memoryMap[i] = ramAccessors;
        }
        if (this.pCodeEnabled) {
            // GROMs map ONLY at addresses >5BFC (read data), >5BFE (read address), >5FFC (write data, not used) and >5FFE (write address).
            this.memoryMap[0x5bfc] = pCodeGROMReadAccessors;
            this.memoryMap[0x5bfe] = pCodeGROMReadAccessors;
            this.memoryMap[0x5ffc] = pCodeGROMWriteAccessors;
            this.memoryMap[0x5ffe] = pCodeGROMWriteAccessors;
        }
    }

    loadRAM(addr: number, byteArray: Uint8Array) {
        for (let i = 0; i < byteArray.length; i++) {
            const a = addr + i;
            if (this.sams && (a >= 0x2000 && a < 0x4000 || a >= 0xa000 && a < 0x10000)) {
                this.sams.setByte(a, byteArray[i]);
            } else if (this.cartImage && a >= 0x6000 && a < 0x8000) {
                this.cartImage[a + this.cartAddrRAMOffset] = byteArray[i];
            } else if (this.ramType === '32K') {
                this.ram[a] = byteArray[i];
            }
        }
    }

    loadGROM(byteArray: Uint8Array, bank: number, base: number) {
        let grom = this.gromBases[base];
        if (!grom) {
            grom = new GROMArray();
            this.gromBases[base] = grom;
        }
        grom.setData(byteArray, bank << 13);
    }

    setCartridgeImage(byteArray: Uint8Array, inverted: boolean, cruBankSwitched: boolean, ramAt6000: boolean, ramAt7000: boolean, ramFG99Paged: boolean) {
        let i;
        const length = Math.ceil(byteArray.length / 0x2000) * 0x2000;
        this.log.info('Cartridge size: ' + Util.toHexWord(length));
        this.cartImage = new Uint8Array(length);
        for (i = 0; i < this.cartImage.length; i++) {
            this.cartImage[i] = i < byteArray.length ? byteArray[i] : 0;
        }
        this.cartInverted = inverted;
        this.cartCRUBankSwitched = cruBankSwitched;
        this.cartBankCount = this.cartImage.length / 0x2000;
        this.setCurrentCartBank(!inverted ? 0 : this.cartBankCount - 1);
        this.cartRAMFG99Paged = ramFG99Paged;
        if (ramFG99Paged) {
            this.log.info('Paged RAM cart found.');
            this.currentCartRAMBank = 0;
            this.cartAddrRAMOffset = -0x6000;
        }
        this.ramAt6000 = ramAt6000;
        if (this.ramAt6000) {
            this.log.info('RAM at >6000');
        }
        this.ramAt7000 = ramAt7000;
        if (this.ramAt7000) {
            this.log.info('RAM at >7000');
        }
        this.buildMemoryMap();
    }

    loadPeripheralROM(byteArray: Uint8Array, number: number) {
        this.peripheralROMs[number] = new Uint8Array(byteArray.length);
        for (let i = 0; i < byteArray.length; i++) {
            this.peripheralROMs[number][i] = byteArray[i];
        }
    }

    setPeripheralROM(romNo: number, enabled: boolean) {
        // this.log.info("Toggle ROM " + romNo + " " + (enabled ? "on" : "off") + ".");
        if (this.peripheralROMs[romNo]) {
            this.peripheralROMNumber = romNo;
            this.peripheralROMEnabled = enabled;
        } else {
            this.peripheralROMEnabled = false;
        }
    }

    setCRUCartBank(bank: number) {
        if (this.cartCRUBankSwitched) {
            this.setCurrentCartBank(bank);
        }
    }

    setCurrentPeripheralROMBank(bank: number) {
        this.peripheralROMBanks[this.peripheralROMNumber] = bank;
    }

    private setCurrentCartBank(bank: number) {
        this.currentCartBank = bank;
        this.cartAddrOffset = (this.currentCartBank << 13) - 0x6000;
        if (!this.cartRAMFG99Paged) {
            this.setCurrentCartRAMBank(bank);
        }
        // this.log.info("Cartridge ROM bank selected: " + this.currentCartBank);
    }

    private setCurrentCartRAMBank(bank: number) {
        this.currentCartRAMBank = bank;
        this.cartAddrRAMOffset = (this.currentCartRAMBank << 13) - 0x6000;
        // this.log.info("Cartridge RAM bank selected: " + this.currentCartRAMBank);
    }

    private readROM(addr: number, cpu: CPU): number {
        return (this.rom[addr] << 8) | this.rom[addr + 1];
    }

    private writeROM(addr: number, w: number, cpu: CPU) {
    }

    private readRAM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.sams) {
            return this.sams.readWord(addr);
        } else if (this.ramType === '32K') {
            return (this.ram[addr] << 8) | this.ram[addr + 1];
        }
        return 0;
    }

    private writeRAM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (this.sams) {
            this.sams.writeWord(addr, w);
        } else if (this.ramType === '32K') {
            this.ram[addr] = w >> 8;
            this.ram[addr + 1] = w & 0xFF;
        }
    }

    private readPeripheralROM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.sams && this.sams.hasRegisterAccess()) {
            const w = this.sams.readRegister((addr & 0x1F) >> 1);
            return ((w & 0xFF) << 8) | (w >> 8);
        } else if (this.peripheralROMEnabled) {
            const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
            if (peripheralROM) {
                const isTIPIROM = this.isTIPIROMEnabled();
                if (isTIPIROM && addr === TIPI.RC_IN) {
                    return this.console.getTIPI()!.getRC();
                } else if (isTIPIROM && addr === TIPI.RD_IN) {
                    return this.console.getTIPI()!.getRD();
                } else if (isTIPIROM && addr === TIPI.TC_OUT) {
                    return this.console.getTIPI()!.getTC();
                } else if (isTIPIROM && addr === TIPI.TD_OUT) {
                    return this.console.getTIPI()!.getTD();
                } else {
                    const romAddr = addr - 0x4000 + (this.peripheralROMBanks[this.peripheralROMNumber] << 13);
                    // this.log.info("Read peripheral ROM " + addr.toHexWord() + ": " + (peripheralROM[romAddr] << 8 | peripheralROM[romAddr + 1]).toHexWord());
                    return peripheralROM[romAddr] << 8 | peripheralROM[romAddr + 1];
                }
            }
        }
        return 0;
    }

    private writePeripheralROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        const isTIPIROM = this.isTIPIROMEnabled();
        if (this.sams && this.sams.hasRegisterAccess()) {
            this.sams.writeRegister((addr & 0x1F) >> 1, ((w & 0xFF) << 8) | (w >> 8));
        } else if (isTIPIROM && addr === TIPI.TC_OUT) {
            this.console.getTIPI()!.setTC(w);
        } else if (isTIPIROM && addr === TIPI.TD_OUT) {
            this.console.getTIPI()!.setTD(w);
        }
    }

    private readCartridgeROM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return this.cartImage ? (this.cartImage[addr + this.cartAddrOffset] << 8) | this.cartImage[addr + this.cartAddrOffset + 1] : 0;
    }

    private writeCartridgeROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (!this.cartCRUBankSwitched) {
            let bank = (addr >> 1) & (this.cartBankCount - 1);
            if (!this.cartRAMFG99Paged || addr < 0x6800) {
                if (this.cartInverted) {
                    bank = this.cartBankCount - bank - 1;
                }
                this.setCurrentCartBank(bank);
            } else {
                this.setCurrentCartRAMBank(bank);
            }
        }
    }

    private readCartridgeRAM(addr: number, cpu: CPU): number {
        // this.log.info("Read cartridge RAM: " + addr.toHexWord());
        cpu.addCycles(4);
        return this.cartImage ? (this.cartImage[addr + this.cartAddrRAMOffset] << 8) | this.cartImage[addr + this.cartAddrRAMOffset + 1] : 0;
    }

    private writeCartridgeRAM(addr: number, w: number, cpu: CPU) {
        // this.log.info("Write cartridge RAM: " + addr.toHexWord());
        cpu.addCycles(4);
        if (this.cartImage) {
            this.cartImage[addr + this.cartAddrRAMOffset] = w >> 8;
            this.cartImage[addr + this.cartAddrRAMOffset + 1] = w & 0xFF;
        }
    }

    private readPAD(addr: number, cpu: CPU): number {
        addr = addr | 0x0300;
        return (this.ram[addr] << 8) | this.ram[addr + 1];
    }

    private writePAD(addr: number, w: number, cpu: CPU) {
        addr = addr | 0x0300;
        this.ram[addr] = w >> 8;
        this.ram[addr + 1] = w & 0xFF;
    }

    private readSound(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return 0;
    }

    private writeSound(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(32);
        this.psg.writeData(addr, w >> 8);
    }

    private readVDP(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        addr = addr & 0x8802;
        if (addr === Memory.VDPRD) {
            return this.vdp.readData() << 8;
        } else if (addr === Memory.VDPSTA) {
            return this.vdp.readStatus() << 8;
        }
        return 0;
    }

    private writeVDP(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        switch (addr & 0x8C06) {
            case Memory.VDPWD:
                this.vdp.writeData(w >> 8);
                break;
            case Memory.VDPWA:
                this.vdp.writeAddress(w >> 8);
                break;
            case Memory.VDPWP:
                this.vdp.writePalette(w >> 8);
                break;
            case Memory.VDPWC:
                this.vdp.writeRegisterIndirect(w >> 8);
                break;
        }
    }

    private readSpeech(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return this.speech.read() << 8;
    }

    private writeSpeech(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(68);
        this.speech.write(w >> 8);
    }

    private readGROM(addr: number, cpu: CPU): number {
        cpu.addCycles(17);
        const base = this.gromBases.length === 1 || this.gromBases[0].getAddress() - 1 < 0x6000 ? 0 : (addr & 0x003C) >> 2;
        let value = 0;
        addr = addr & 0x9802;
        if (addr === Memory.GRMRD) {
            // Read data from GROM
            cpu.addCycles(6);
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
        return value;
    }

    private writeGROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(23 + 6);
        addr = addr & 0x9C02;
        if (addr === Memory.GRMWD) {
            if (this.gramEnabled) {
                // Write data to GROM
                this.gromBases.forEach((grom, i) => {
                    if (grom) {
                        grom.writeData(w);
                    }
                });
            }
        } else if (addr === Memory.GRMWA) {
            // Set GROM address
            this.gromBases.forEach((grom, i) => {
                if (grom) {
                    grom.writeAddress(w);
                }
            });
        }
    }

    private readPCodeGROM(addr: number, cpu: CPU): number {
        cpu.addCycles(17);
        let value = 0;
        if (addr === 0x5BFC) {
            // Read data from GROM
            cpu.addCycles(6);
            value = this.pcodeGroms.readData();
        } else if (addr === 0x5BFE) {
            // Get GROM address
            value = this.pcodeGroms.readAddress();
        }
        return value;
    }

    private writePCodeGROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(23 + 6);
        if (addr === 0x5FFE) {
            // Set GROM address
            this.pcodeGroms.writeAddress(w);
        }
    }

    private readNull(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return 0;
    }

    private writeNull(addr: number, w: number, cpu: CPU) {
    }

    readWord(addr: number, cpu: CPU): number {
        addr &= 0xFFFE;
        return this.memoryMap[addr][0].call(this, addr, cpu);
    }

    writeWord(addr: number, w: number, cpu: CPU) {
        addr &= 0xFFFE;
        this.memoryMap[addr][1].call(this, addr, w, cpu);
    }

    // Fast methods that don't produce wait states. For debugger etc.

    getByte(addr: number): number {
        if (addr < 0x2000) {
            return this.rom[addr];
        }
        if (addr < 0x4000) {
            if (this.sams) {
                return this.sams.getByte(addr);
            } else {
                return this.ram[addr];
            }
        }
        if (addr < 0x6000) {
            if (this.sams && this.sams.hasRegisterAccess()) {
                const w = this.sams.readRegister((addr & 0x1F) >> 1);
                return (addr & 1) === 0 ? (w & 0xFF) : (w >> 8);
            } else if (this.peripheralROMEnabled) {
                const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
                const romAddr = addr - 0x4000 + (this.peripheralROMBanks[this.peripheralROMNumber] << 13);
                return peripheralROM ? peripheralROM[romAddr] : 0;
            } else {
                return 0;
            }
        }
        if (addr < 0x7000) {
            return this.cartImage ? this.cartImage[addr + this.cartAddrOffset] || 0 : 0;
        }
        if (addr < 0x8000) {
            if (this.cartRAMFG99Paged) {
                return this.cartImage ? this.cartImage[addr + this.cartAddrRAMOffset] : 0;
            } else {
                return this.cartImage ? this.cartImage[addr + this.cartAddrOffset] : 0;
            }
        }
        if (addr < 0x8400) {
            addr = addr | 0x0300;
            return this.ram[addr];
        }
        if (addr < 0xA000) {
            return 0;
        }
        if (addr < 0x10000) {
            if (this.sams) {
                return this.sams.getByte(addr);
            } else {
                return this.ram[addr];
            }
        }
        return 0;
    }

    getWord(addr: number): number {
        if (addr < 0x2000) {
            return (this.rom[addr] << 8) | this.rom[addr + 1];
        }
        if (addr < 0x4000) {
            if (this.sams) {
                return this.sams.readWord(addr);
            } else {
                return this.ram[addr] << 8 | this.ram[addr + 1];
            }
        }
        if (addr < 0x6000) {
            if (this.peripheralROMEnabled) {
                const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
                const romAddr = addr - 0x4000 + (this.peripheralROMBanks[this.peripheralROMNumber] << 13);
                return peripheralROM ? peripheralROM[romAddr] << 8 | peripheralROM[romAddr + 1] : 0;
            } else {
                return 0;
            }
        }
        if (addr < 0x7000) {
            return this.cartImage ? (this.cartImage[addr + this.cartAddrOffset] << 8) | this.cartImage[addr + this.cartAddrOffset + 1] : 0;
        }
        if (addr < 0x8000) {
            if (this.cartRAMFG99Paged) {
                return this.cartImage ? (this.cartImage[addr + this.cartAddrRAMOffset] << 8) | this.cartImage[addr + this.cartAddrRAMOffset + 1] : 0;
            } else {
                return this.cartImage ? (this.cartImage[addr + this.cartAddrOffset] << 8) | this.cartImage[addr + this.cartAddrOffset + 1] : 0;
            }
        }
        if (addr < 0x8400) {
            addr = addr | 0x0300;
            return this.ram[addr] << 8 | this.ram[addr + 1];
        }
        if (addr < 0xA000) {
            return 0;
        }
        if (addr < 0x10000) {
            if (this.sams) {
                return this.sams.readWord(addr);
            } else {
                return this.ram[addr] << 8 | this.ram[addr + 1];
            }
        }
        return 0;
    }

    // For disk IO etc. that's not faithfully emulated

    getPADByte(addr: number): number {
        return this.ram[addr];
    }

    getPADWord(addr: number): number {
        return this.ram[addr] << 8 | this.ram[addr + 1];
    }

    setPADByte(addr: number, b: number) {
        return this.ram[addr] = b;
    }

    setPADWord(addr: number, w: number) {
        this.ram[addr] = w >> 8;
        this.ram[addr + 1] = w & 0xFF;
    }

    getStatusString(detailed: boolean): string {
        const gromAddress = this.gromBases[0].getAddress();
        return 'GROM:' + Util.toHexWord(gromAddress) + ' (bank:' + ((gromAddress & 0xE000) >> 13) +
            ', addr:' + Util.toHexWord(gromAddress & 0x1FFF) + ') ' +
            (this.cartImage ? 'CART: bank ' + this.currentCartBank + (this.cartRAMFG99Paged ? '/' + this.currentCartRAMBank : '') + ' of ' + this.cartBankCount : '') +
            (this.sams ? '\nSAMS Regs: ' + this.sams.getStatusString() : '');
    }

     hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
            return this.getByte(addr);
        });
    }

    setRAMType(ramType: RAMType) {
        this.ramType = ramType;
    }

    setRAMAt0000(enabled: boolean) {
        this.ramAt0000 = enabled;
    }

    setRAMAt4000(enabled: boolean) {
        this.ramAt4000 = enabled;
    }

    setGRAMEnabled(enabled: boolean) {
        this.gramEnabled = enabled;
    }

    setPCodeEnabled(enabled: boolean) {
        this.pCodeEnabled = enabled;
    }

    setTIPIType(tipiType: TIPIType) {
        this.tipiType = tipiType;
    }

    setDebugResetEnabled(enabled: boolean) {
        this.debugReset = enabled;
        if (this.sams) {
            this.sams.setDebugResetEnabled(enabled);
        }
    }

    setDiskEnabled(enabled: boolean) {
        this.diskEnabled = enabled;
    }

    getGROMs(): GROMArray[] {
        return this.gromBases;
    }

    isTIPIEnabled(): boolean {
        return this.tipiType === 'FULL';
    }

    isSAMSEnabled(): boolean {
        return this.sams !== null;
    }

    getSAMS(): SAMS | null {
        return this.sams;
    }

    getVDP(): VDP {
        return this.vdp;
    }

    isDiskROMEnabled() {
        return this.peripheralROMNumber === this.diskROMNumber;
    }

    isTIPIROMEnabled() {
        return this.peripheralROMNumber === this.tipiROMNumber;
    }

    isGoogleDriveROMEnabled() {
        return this.peripheralROMNumber === this.gdrROMNumber;
    }

    getState(): object {
        return {
            ramType: this.ramType,
            samsSize: this.samsSize,
            enableGRAM: this.gramEnabled,
            tipiType: this.tipiType,
            enableDisk: this.diskEnabled,
            ramAt0000: this.ramAt0000,
            ramAt4000: this.ramAt4000,
            ramAt6000: this.ramAt6000,
            ramAt7000: this.ramAt7000,
            ram: this.ram,
            rom: this.rom,
            gromBases: this.gromBases.map(gromBase => gromBase ? gromBase.getState() : null),
            cartImage: this.cartImage,
            cartInverted: this.cartInverted,
            cartBankCount: this.cartBankCount,
            currentCartBank: this.currentCartBank,
            cartAddrOffset: this.cartAddrOffset,
            cartRAMFG99Paged: this.cartRAMFG99Paged,
            currentCartRAMBank: this.currentCartRAMBank,
            cartAddrRAMOffset: this.cartAddrRAMOffset,
            peripheralROMs: this.peripheralROMs,
            peripheralROMEnabled: this.peripheralROMEnabled,
            peripheralROMNumber: this.peripheralROMNumber,
            peripheralROMBanks: this.peripheralROMBanks,
            sams: this.sams ? this.sams.getState() : null
        };
    }

    restoreState(state: any) {
        this.ramType = state.ramType;
        this.samsSize = state.samsSize;
        this.gramEnabled = state.gramEnabled;
        this.tipiType = state.tipiType;
        this.diskEnabled = state.diskEnabled;
        this.ramAt0000 = state.ramAt0000;
        this.ramAt4000 = state.ramAt4000;
        this.ramAt6000 = state.ramAt6000;
        this.ramAt7000 = state.ramAt7000;
        this.ram = state.ram;
        this.rom = state.rom;
        this.gromBases = [];
        state.gromBases.forEach((gromBaseState: any, i: number) => {
            if (gromBaseState) {
                this.gromBases[i] = new GROMArray();
                this.gromBases[i].restoreState(gromBaseState);
            }
        });
        this.cartImage = state.cartImage;
        this.cartInverted = state.cartInverted;
        this.cartBankCount = state.cartBankCount;
        this.currentCartBank = state.currentCartBank;
        this.cartAddrOffset = state.cartAddrOffset;
        this.cartRAMFG99Paged = state.cartRAMFG99Paged;
        this.currentCartRAMBank = state.currentCartRAMBank;
        this.cartAddrRAMOffset = state.cartAddrRAMOffset;
        this.peripheralROMs = state.peripheralROMs;
        this.peripheralROMEnabled = state.peripheralROMEnabled;
        this.peripheralROMNumber = state.peripheralROMNumber;
        this.peripheralROMBanks = state.peripheralROMBanks;
        if (state.sams) {
            this.sams = new SAMS(this.samsSize, false);
            this.sams.restoreState(state.sams);
        }
        this.buildMemoryMap();
    }
}
