import {Log} from '../../classes/log';
import {VDP} from '../interfaces/vdp';
import {SAMS} from './sams';
import {System} from './system';
import {Util} from '../../classes/util';
import {CPU} from '../interfaces/cpu';
import {Stateful} from '../interfaces/stateful';
import {RAMType, Settings} from '../../classes/settings';
import {PSG} from '../interfaces/psg';
import {Speech} from '../interfaces/speech';
import {MemoryDevice} from '../interfaces/memory-device';
import {MemoryView} from "../../classes/memory-view";
import {Console} from '../interfaces/console';
import {PCodeCard} from "./p-code-card";
import {GROMArray} from "./grom-array";
import {DsrCard} from "../interfaces/dsr-card";
import {PeripheralCard} from "../interfaces/peripheral-card";
import {MemoryMappedCard} from "../interfaces/memory-mapped-card";

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

    private console: Console;
    private vdp: VDP;
    private psg: PSG;
    private speech: Speech;
    private settings: Settings;

    private ramType: RAMType;
    private samsSize: number;
    private gramEnabled: boolean;
    private debugReset: boolean;

    private ram: Uint8Array;
    private sams: SAMS | null;

    private rom: Uint8Array;
    private gromBases: GROMArray[];

    private ramAt0000: boolean;
    private ramAt4000: boolean;
    private ramAt6000: boolean;
    private ramAt7000: boolean;

    private cartImage: Uint8Array | null;
    private cartInverted: boolean;
    private cartCRUBankSwitched: boolean;
    private cartBankCount: number;
    private currentCartBank: number;
    private cartAddrOffset: number;
    private cartRAMFG99Paged: boolean;
    private currentCartRAMBank: number;
    private cartAddrRAMOffset: number;

    private peripheralCards: PeripheralCard[] = [];
    private pCodeCard: PCodeCard | null;

    private memoryMap: Function[][];

    private log: Log = Log.getLog();

    constructor(console: Console, settings: Settings) {
        this.console = console;
        this.settings = settings;
    }

    public registerPeripheralCard(card: PeripheralCard) {
        this.log.info("Register card: " + card.getId());
        this.peripheralCards.push(card);
        this.console.getCRU().registerCruDevice(card);
    }

    public deregisterPeripheralCard(card: PeripheralCard) {
        this.log.info("Deregister card: " + card.getId());
        const index = this.peripheralCards.indexOf(card);
        if (index !== -1) {
            this.peripheralCards.splice(index, 1);
        }
        this.console.getCRU().deregisterCruDevice(card);
    }

    public reset(keepCart: boolean) {

        this.vdp = this.console.getVDP();
        this.psg = this.console.getPSG();
        this.speech = this.console.getSpeech();

        // Settings
        this.ramType = this.settings.getRAM();
        this.samsSize = this.settings.getSAMSSize();
        this.gramEnabled = this.settings.isGRAMEnabled();
        this.debugReset = this.settings.isDebugResetEnabled();

        // RAM
        this.ram = new Uint8Array(0x10000);
        if (this.debugReset) {
            for (let i = 0; i < this.ram.length; i++) {
                this.ram[i] = i & 0xff;
            }
        }

        // SAMS
        if (this.sams) {
            this.deregisterPeripheralCard(this.sams);
        }
        if (this.settings.isSAMSEnabled()) {
            this.sams = new SAMS(this.samsSize, this.debugReset);
            this.registerPeripheralCard(this.sams);
        } else {
            this.sams = null;
        }

        // ROM
        this.rom = new Uint8Array(System.ROM);
        this.patchROMForTapeUsage();

        // GROM
        if (!keepCart) {
            this.gromBases = [];
            this.loadGROM(new Uint8Array(System.GROM), 0, 0);
        }

        // Cartridge
        if (!keepCart) {
            this.ramAt6000 = false;
            this.ramAt7000 = false;
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

        // P-code
        if (this.pCodeCard) {
            this.deregisterPeripheralCard(this.pCodeCard);
        }
        if (this.settings.isPCodeEnabled()) {
            this.pCodeCard = new PCodeCard();
            this.registerPeripheralCard(this.pCodeCard);
        } else {
            this.pCodeCard = null;
        }

        this.buildMemoryMap();
    }

    public patchROMForTapeUsage() {
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

    setCRUCartBank(bank: number) {
        if (this.cartCRUBankSwitched) {
            // this.log.info("Set CRU cart bank " + bank);
            this.setCurrentCartBank(bank);
        }
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
        const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
        if (activeCard) {
            if (this.isMemoryMappedCard(activeCard)) {
                return activeCard.readMemoryMapped(addr, cpu);
            } else if (this.isDsrCard(activeCard)) {
                const rom = activeCard.getROM();
                const romAddr = addr - 0x4000 + (activeCard.getROMBank() << 13);
                // this.log.info("Read peripheral ROM " + addr.toHexWord() + ": " + (rom[romAddr] << 8 | rom[romAddr + 1]).toHexWord());
                return rom[romAddr] << 8 | rom[romAddr + 1];
            }
        }
        return 0;
    }

    private writePeripheralROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
        if (activeCard && this.isMemoryMappedCard(activeCard)) {
            activeCard.writeMemoryMapped(addr, w, cpu);
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
            this.gromBases.forEach((grom) => {
                if (grom) {
                    grom.writeAddress(w);
                }
            });
        }
    }

    private readNull(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return 0;
    }

    private writeNull(addr: number, w: number, cpu: CPU) {
    }

    public readWord(addr: number, cpu: CPU): number {
        addr &= 0xFFFE;
        return this.memoryMap[addr][0].call(this, addr, cpu);
    }

    public writeWord(addr: number, w: number, cpu: CPU) {
        addr &= 0xFFFE;
        this.memoryMap[addr][1].call(this, addr, w, cpu);
    }

    // Fast methods that don't produce wait states. For debugger etc.

    private getByte(addr: number): number {
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
            } else {
                const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
                if (activeCard && this.isDsrCard(activeCard)) {
                    const peripheralROM = activeCard.getROM();
                    const romAddr = addr - 0x4000 + (activeCard.getROMBank() << 13);
                    return peripheralROM ? peripheralROM[romAddr] : 0;
                } else {
                    return 0;
                }
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

    public getWord(addr: number): number {
        return (this.getByte(addr) << 8) | this.getByte(addr + 1);
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
            (this.sams ? '\nSAMS Regs: ' + this.sams.getStatusString(detailed) : '');
    }

    public hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
            return this.getByte(addr);
        });
    }

    public getMemorySize(): number {
        return 0x10000;
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

    setDebugResetEnabled(enabled: boolean) {
        this.debugReset = enabled;
        if (this.sams) {
            this.sams.setDebugResetEnabled(enabled);
        }
    }

    getCartridgeROM(): MemoryDevice {
        const cartImage = this.cartImage;
        return {
            getMemorySize(): number {
                return cartImage ? cartImage.length : 0;
            }, getWord(addr: number): number {
                return cartImage ? (cartImage[addr] << 8) | cartImage[addr + 1] : 0;
            }, hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
                return MemoryView.hexView(start, length, width, anchorAddr, (addr: number) => {
                    return cartImage ? cartImage[addr] : 0;
                });
            }
        };
    }

    getGROMs(): GROMArray[] {
        return this.gromBases;
    }

    getSAMS(): SAMS | null {
        return this.sams;
    }

    getVDP(): VDP {
        return this.vdp;
    }

    isMemoryMappedCard(card: PeripheralCard): card is MemoryMappedCard {
        return (card as MemoryMappedCard).readMemoryMapped !== undefined;
    }

    isDsrCard(card: PeripheralCard): card is DsrCard {
        return (card as DsrCard).getROM !== undefined;
    }

    getState(): object {
        return {
            ramType: this.ramType,
            samsSize: this.samsSize,
            enableGRAM: this.gramEnabled,
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
            sams: this.sams ? this.sams.getState() : null,
            pCodeCard: this.pCodeCard ? this.pCodeCard.getState() : null,
        };
    }

    restoreState(state: any) {
        this.ramType = state.ramType;
        this.samsSize = state.samsSize;
        this.gramEnabled = state.gramEnabled;
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
        if (state.sams) {
            if (!this.sams) {
                this.sams = new SAMS(this.samsSize, false);
                this.registerPeripheralCard(this.sams);
            }
            this.sams.restoreState(state.sams);
        }
        if (state.pCodeCard) {
            if (!this.pCodeCard) {
                this.pCodeCard = new PCodeCard();
                this.registerPeripheralCard(this.pCodeCard);
            }
            this.pCodeCard.restoreState(state.pCodeCard);
        }
        this.buildMemoryMap();
    }
}
