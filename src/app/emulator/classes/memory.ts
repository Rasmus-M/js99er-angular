import {Log} from '../../classes/log';
import {VDP} from '../interfaces/vdp';
import {AMS} from './ams';
import {DiskDrive} from './diskdrive';
import {GoogleDrive} from './googledrive';
import {System} from './system';
import {Util} from '../../classes/util';
import {CPU} from '../interfaces/cpu';
import {State} from '../interfaces/state';
import {TI994A} from './ti994a';
import {Settings} from '../../classes/settings';
import {PSG} from '../interfaces/psg';
import {Speech} from '../interfaces/speech';
import {MemoryDevice} from '../interfaces/memory-device';

export class Memory implements State, MemoryDevice {

    static SOUND = 0x8400;  // Sound write data
    static VDPRD = 0x8800;  // VDP read data
    static VDPSTA = 0x8802;  // VDP status
    static VDPWD = 0x8C00;  // VDP write data
    static VDPWA = 0x8C02;  // VDP set read/write address
    static GRMRD = 0x9800;  // GROM read data
    static GRMRA = 0x9802;  // GROM read address
    static GRMWD = 0x9C00;  // GROM write data
    static GRMWA = 0x9C02;  // GROM write address

    static GROM_BASES = 16;

    private console: TI994A;
    private vdp: VDP;
    private psg: PSG;
    private speech: Speech;
    private settings: Settings;

    private enable32KRAM: boolean;
    private enableAMS: boolean;
    private enableGRAM: boolean;
    private ramAt6000: boolean;
    private ramAt7000: boolean;

    private ram: Uint8Array;
    private rom: Uint8Array;

    private groms: Uint8Array[];
    private ams: AMS;

    private gromAddress: number;
    private gromAccess: number;
    private gromPrefetch: Uint8Array;
    private multiGROMBases: boolean;

    private cartImage: Uint8Array;
    private cartInverted: boolean;
    private cartCRUBankSwitched: boolean;
    private cartBankCount: number;
    private currentCartBank: number;
    private cartAddrOffset: number;
    private cartRAMFG99Paged: boolean;
    private currentCartRAMBank: number;
    private cartAddrRAMOffset: number;

    private peripheralROMs: Uint8Array[];
    private peripheralROMEnabled: boolean;
    private peripheralROMNumber: number;

    private memoryMap: Function[][];

    private log: Log = Log.getLog();

    constructor(console: TI994A, settings: Settings) {
        this.console = console;
        this.settings = settings;
    }

    reset(keepCart: boolean) {

        this.vdp = this.console.getVDP();
        this.psg = this.console.getPSG();
        this.speech = this.console.getSpeech();

        // RAM
        this.enable32KRAM = this.settings.is32KRAMEnabled();
        this.enableAMS = this.settings.isAMSEnabled();
        this.enableGRAM = this.settings.isGRAMEnabled();
        this.ramAt6000 = false;
        this.ramAt7000 = false;
        this.ram = new Uint8Array(0x10000);
        if (this.enableAMS) {
            if (this.ams) {
                this.ams.reset();
            } else {
                this.ams = new AMS(1024);
            }
        } else {
            this.ams = null;
        }

        // ROM
        this.rom = new Uint8Array(System.ROM);
        this.patchROMForTapeUsage();

        if (!keepCart) {
            // GROM
            this.groms = [];
            for (let i = 0; i < Memory.GROM_BASES; i++) {
                this.groms[i] = new Uint8Array(0x10000);
            }
            this.loadGROM(new Uint8Array(System.GROM), 0, 0);
            this.gromAddress = 0;
            this.gromAccess = 2;
            this.gromPrefetch = new Uint8Array(Memory.GROM_BASES);
            this.multiGROMBases = false;

            // Cartridge
            this.cartImage = null;
            this.cartInverted = false;
            this.cartCRUBankSwitched = false;
            this.cartBankCount = 0;
            this.currentCartBank = 0;
            this.cartAddrOffset = -0x6000;
            this.cartRAMFG99Paged = false;
            this.currentCartRAMBank = 0;
            this.cartAddrRAMOffset = -0x6000;
        }

        // Peripheral ROM
        this.peripheralROMs = [];
        this.peripheralROMEnabled = false;
        this.peripheralROMNumber = 0;
        this.loadPeripheralROM(new Uint8Array(DiskDrive.DSR_ROM), 1);
        if (this.settings.isGoogleDriveEnabled()) {
            this.loadPeripheralROM(new Uint8Array(GoogleDrive.DSR_ROM), 2);
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
        const nullAccessors = [this.readNull, this.writeNull];
        let i;
        for (i = 0; i < 0x2000; i++) {
            this.memoryMap[i] = romAccessors;
        }
        for (i = 0x2000; i < 0x4000; i++) {
            this.memoryMap[i] = ramAccessors;
        }
        for (i = 0x4000; i < 0x6000; i++) {
            this.memoryMap[i] = peripheralROMAccessors;
        }
        for (i = 0x6000; i < 0x7000; i++) {
            this.memoryMap[i] = this.ramAt6000 ? cartridgeRAMAccessors : cartridgeROMAccessors;
        }
        for (i = 0x7000; i < 0x8000; i++) {
            this.memoryMap[i] = this.ramAt7000 ? cartridgeRAMAccessors : cartridgeROMAccessors;
        }
        for (i = 0x8000; i < 0x8400; i++) {
            this.memoryMap[i] = padAccessors;
        }
        for (i = 0x8400; i < 0x8600; i++) {
            this.memoryMap[i] = soundAccessors;
        }
        for (i = 0x8600; i < 0x8800; i++) {
            this.memoryMap[i] = nullAccessors;
        }
        for (i = 0x8800; i < 0x8C00; i++) {
            this.memoryMap[i] = vdpReadAccessors;
        }
        for (i = 0x8C00; i < 0x9000; i++) {
            this.memoryMap[i] = vdpWriteAccessors;
        }
        for (i = 0x9000; i < 0x9400; i++) {
            this.memoryMap[i] = speechReadAccessors;
        }
        for (i = 0x9400; i < 0x9800; i++) {
            this.memoryMap[i] = speechWriteAccessors;
        }
        for (i = 0x9800; i < 0x9C00; i++) {
            this.memoryMap[i] = gromReadAccessors;
        }
        for (i = 0x9C00; i < 0xA000; i++) {
            this.memoryMap[i] = gromWriteAccessors;
        }
        for (i = 0xA000; i < 0x10000; i++) {
            this.memoryMap[i] = ramAccessors;
        }
    }

    loadRAM(addr: number, byteArray: Uint8Array) {
        for (let i = 0; i < byteArray.length; i++) {
            const a = addr + i;
            if (this.enableAMS && (a >= 0x2000 && a < 0x4000 || a >= 0xa000 && a < 0x10000)) {
                this.ams.setByte(a, byteArray[i]);
            } else if (a >= 0x6000 && a < 0x8000) {
                this.cartImage[a + this.cartAddrRAMOffset] = byteArray[i];
            } else {
                this.ram[a] = byteArray[i];
            }
        }
    }

    loadGROM(byteArray: Uint8Array, bank: number, base: number) {
        const grom = this.groms[base];
        const addr = bank * 0x2000;
        for (let i = 0; i < byteArray.length; i++) {
            grom[addr + i] = byteArray[i];
        }
        if (base > 0) {
            this.multiGROMBases = true;
        }
    }

    setCartridgeImage(byteArray: Uint8Array, inverted: boolean, cruBankSwitched: boolean, ramAt6000: boolean, ramAt7000: boolean, ramFG99Paged: boolean) {
        let i;
        const length = ((byteArray.length / 0x2000) + (byteArray.length % 0x2000 === 0 ? 0 : 1)) * 0x2000;
        this.log.info('Cartridge size: ' + Util.toHexWord(length));
        this.cartImage = new Uint8Array(length);
        for (i = 0; i < this.cartImage.length; i++) {
            this.cartImage[i] = i < byteArray.length ? byteArray[i] : 0;
        }
        this.cartInverted = inverted;
        this.cartCRUBankSwitched = cruBankSwitched;
        this.cartBankCount = this.cartImage.length / 0x2000;
        this.currentCartBank = 0;
        this.cartAddrOffset = -0x6000;
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
        this.peripheralROMs[number] = new Uint8Array(0x2000);
        for (let i = 0; i < byteArray.length; i++) {
            this.peripheralROMs[number][i] = byteArray[i];
        }
    }

    setPeripheralROM(romNo: number, enabled: boolean) {
        // this.log.info("Toggle ROM " + romNo + " " + (enabled ? "on" : "off") + ".");
        if (romNo > 0 && romNo < this.peripheralROMs.length) {
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

    private setCurrentCartBank(bank: number) {
        this.currentCartBank = bank;
        this.cartAddrOffset = this.currentCartBank * 0x2000 - 0x6000;
        if (!this.cartRAMFG99Paged) {
            this.setCurrentCartRAMBank(bank);
        }
        // this.log.info("Cartridge ROM bank selected: " + this.currentCartBank);
    }

    private setCurrentCartRAMBank(bank: number) {
        this.currentCartRAMBank = bank;
        this.cartAddrRAMOffset = this.currentCartRAMBank * 0x2000 - 0x6000;
        // this.log.info("Cartridge RAM bank selected: " + this.currentCartRAMBank);
    }

    private readROM(addr: number, cpu: CPU): number {
        return (this.rom[addr] << 8) | this.rom[addr + 1];
    }

    private writeROM(addr: number, w: number, cpu: CPU) {
    }

    private readRAM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.enableAMS) {
            return this.ams.readWord(addr);
        } else if (this.enable32KRAM) {
            return (this.ram[addr] << 8) | this.ram[addr + 1];
        }
        return 0;
    }

    private writeRAM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (this.enableAMS) {
            this.ams.writeWord(addr, w);
        } else if (this.enable32KRAM) {
            this.ram[addr] = w >> 8;
            this.ram[addr + 1] = w & 0xFF;
        }
    }

    private readPeripheralROM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.enableAMS && this.ams.hasRegisterAccess()) {
            const w = this.ams.readRegister((addr & 0x1F) >> 1);
            return ((w & 0xFF) << 8) | (w >> 8);
        } else if (this.peripheralROMEnabled) {
            const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
            if (peripheralROM) {
                // this.log.info("Read peripheral ROM " + addr.toHexWord() + ": " + (peripheralROM[addr - 0x4000] << 8 | peripheralROM[addr + 1 - 0x4000]).toHexWord());
                return peripheralROM[addr - 0x4000] << 8 | peripheralROM[addr + 1 - 0x4000];
            }
        }
        return 0;
    }

    private writePeripheralROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (this.enableAMS && this.ams.hasRegisterAccess()) {
            this.ams.writeRegister((addr & 0x1F) >> 1, ((w & 0xFF) << 8) | (w >> 8));
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
        cpu.addCycles(4);
        this.psg.writeData(w >> 8);
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
        addr = addr & 0x8C02;
        if (addr === Memory.VDPWD) {
            this.vdp.writeData(w >> 8);
        } else if (addr === Memory.VDPWA) {
            this.vdp.writeAddress(w >> 8);
        }
    }

    private readSpeech(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return this.speech.readSpeechData() << 8;
    }

    private writeSpeech(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        this.speech.writeSpeechData(w >> 8);
    }

    private readGROM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        const base = !this.multiGROMBases || this.gromAddress - 1 < 0x6000 ? 0 : (addr & 0x003C) >> 2;
        addr = addr & 0x9802;
        if (addr === Memory.GRMRD) {
            // Read data from GROM
            this.gromAccess = 2;
            const w = this.gromPrefetch[base] << 8;
            // Prefetch for all bases
            for (let i = 0; i < Memory.GROM_BASES; i++) {
                this.gromPrefetch[i] = this.groms[i][this.gromAddress];
            }
            this.gromAddress++;
            return w;
        } else if (addr === Memory.GRMRA) {
            // Get GROM address
            this.gromAccess = 2;
            const wa = this.gromAddress & 0xFF00;
            // this.log.info("GROM read address: " + wa.toHexWord());
            this.gromAddress = ((this.gromAddress << 8) | this.gromAddress & 0xFF) & 0xFFFF;
            return wa;
        }
        return 0;
    }

    private writeGROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(23);
        addr = addr & 0x9C02;
        if (addr === Memory.GRMWD) {
            if (this.enableGRAM) {
                // Write data to GROM
                const base = !this.multiGROMBases || this.gromAddress - 1 < 0x6000 ? 0 : (addr & 0x003C) >> 2;
                this.gromAccess = 2;
                this.groms[base][this.gromAddress - 1] = w >> 8;
                // Prefetch for all bases
                for (let i = 0; i < Memory.GROM_BASES; i++) {
                    this.gromPrefetch[i] = this.groms[i][this.gromAddress];
                }
                this.gromAddress++;
            }
        } else if (addr === Memory.GRMWA) {
            // Set GROM address
            this.gromAddress = ((this.gromAddress << 8) | w >> 8) & 0xFFFF;
            this.gromAccess--;
            if (this.gromAccess === 0) {
                this.gromAccess = 2;
                // Prefetch for all bases
                for (let b = 0; b < Memory.GROM_BASES; b++) {
                    this.gromPrefetch[b] = this.groms[b][this.gromAddress];
                }
                // this.log.info("GROM address set to: " + this.gromAddress.toHexWord());
                this.gromAddress++;
            }
        }
    }

    private readNull(addr: number, cpu: CPU): number {
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
            if (this.enableAMS) {
                return this.ams.getByte(addr);
            } else {
                return this.ram[addr];
            }
        }
        if (addr < 0x6000) {
            if (this.peripheralROMEnabled) {
                const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
                return peripheralROM ? peripheralROM[addr - 0x4000] : 0;
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
            if (this.enableAMS) {
                return this.ams.getByte(addr);
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
            if (this.enableAMS) {
                return this.ams.readWord(addr);
            } else {
                return this.ram[addr] << 8 | this.ram[addr + 1];
            }
        }
        if (addr < 0x6000) {
            if (this.peripheralROMEnabled) {
                const peripheralROM = this.peripheralROMs[this.peripheralROMNumber];
                return peripheralROM ? peripheralROM[addr - 0x4000] << 8 | peripheralROM[addr + 1 - 0x4000] : 0;
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
            if (this.enableAMS) {
                return this.ams.readWord(addr);
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
        this.ram[addr] = w & 0xFF;
    }

    getStatusString(): string {
        return 'GROM:' + Util.toHexWord(this.gromAddress) + ' (bank:' + ((this.gromAddress & 0xE000) >> 13) +
            ', addr:' + Util.toHexWord(this.gromAddress & 0x1FFF) + ') ' +
            (this.cartImage ? 'CART: bank ' + this.currentCartBank + (this.cartRAMFG99Paged ? '/' + this.currentCartRAMBank : '') + ' of ' + this.cartBankCount : '') +
            (this.enableAMS ? '\nAMS Regs: ' + this.ams.getStatusString() : '');
    }

    hexView(start: number, length: number, anchorAddr: number): {lines: string[], anchorLine: number} {
        const lines: string[] = [];
        let anchorLine: number = null;
        let addr = start;
        let lineNo = 0;
        let line = "";
        for (let i = 0; i < length; addr++, i++) {
            if (anchorAddr === addr) {
                anchorLine = lineNo;
            }
            if ((i & 0xF) === 0) {
                line += Util.toHexWord(addr) + ': ';
            }
            line += Util.toHexByteShort(this.getByte(addr));
            if ((i & 0xF) === 0xF) {
                lines.push(line);
                line = "";
                lineNo++;
            } else {
                line += ' ';
            }
        }
        return {lines: lines, anchorLine: anchorLine};
    }

    set32KRAMEnabled(enabled: boolean) {
        this.enable32KRAM = enabled;
    }

    setAMSEnabled(enabled: boolean) {
        this.enableAMS = enabled;
    }

    setGRAMEnabled(enabled: boolean) {
        this.enableGRAM = enabled;
    }

    getPeripheralROMNumber(): number {
        return this.peripheralROMNumber;
    }

    getGROMs(): Uint8Array[] {
        return this.groms;
    }

    isAMSEnabled(): boolean {
        return this.enableAMS;
    }

    getAMS(): AMS {
        return this.ams;
    }

    getVDP(): VDP {
        return this.vdp;
    }

    setVDP(vdp: VDP) {
        this.vdp = vdp;
    }

    getState(): object {
        return {
            enable32KRAM: this.enable32KRAM,
            enableAMS: this.enableAMS,
            enableGRAM: this.enableGRAM,
            ramAt6000: this.ramAt6000,
            ramAt7000: this.ramAt7000,
            ram: this.ram,
            rom: this.rom,
            groms: this.groms,
            gromAddress: this.gromAddress,
            gromAccess: this.gromAccess,
            gromPrefetch: this.gromPrefetch,
            multiGROMBases: this.multiGROMBases,
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
            ams: this.enableAMS ? this.ams.getState() : null
        };
    }

    restoreState(state: any) {
        this.enable32KRAM = state.enable32KRAM;
        this.enableAMS = state.enableAMS;
        this.enableGRAM = state.enableGRAM;
        this.ramAt6000 = state.ramAt6000;
        this.ramAt7000 = state.ramAt7000;
        this.ram = state.ram;
        this.rom = state.rom;
        this.groms = state.groms;
        this.gromAddress = state.gromAddress;
        this.gromAccess = state.gromAccess;
        this.gromPrefetch = state.gromPrefetch;
        this.multiGROMBases = state.multiGROMBases;
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
        if (this.enableAMS) {
            this.ams.restoreState(state.ams);
        }
        this.buildMemoryMap();
    }
}
