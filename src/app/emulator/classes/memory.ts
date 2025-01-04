import {Log} from '../../classes/log';
import {VDP} from '../interfaces/vdp';
import {SAMS} from './sams';
import {System} from './system';
import {Util} from '../../classes/util';
import {CPU} from '../interfaces/cpu';
import {Stateful} from '../interfaces/stateful';
import {Settings} from '../../classes/settings';
import {PSG} from '../interfaces/psg';
import {Speech} from '../interfaces/speech';
import {MemoryDevice} from '../interfaces/memory-device';
import {MemoryView} from "../../classes/memory-view";
import {Console} from '../interfaces/console';
import {PCodeCard} from "./p-code-card";
import {GROMArray} from "./grom-array";
import {DSRCard} from "../interfaces/dsr-card";
import {PeripheralCard} from "../interfaces/peripheral-card";
import {MemoryMappedCard} from "../interfaces/memory-mapped-card";
import {Cartridge} from "./cartridge";
import {Software} from "../../classes/software";
import {RAM32K} from "./ram-32k";
import {Horizon} from "./horizon";

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

    private ram: Uint8Array;
    private sams: SAMS | null;
    private ram32K: RAM32K | null;

    private rom: Uint8Array;
    private grom: GROMArray;

    private ramAt0000: boolean;
    private ramAt4000: boolean;
    private ramAt6000: boolean;
    private ramAt7000: boolean;

    private cartridge: Cartridge | null;

    private peripheralCards: PeripheralCard[] = [];
    private pCodeCard: PCodeCard | null;
    private horizonCard: Horizon | null = null;

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
        if (card instanceof Horizon) {
            this.horizonCard = card;
        }
    }

    public deregisterPeripheralCard(card: PeripheralCard) {
        this.log.info("Deregister card: " + card.getId());
        const index = this.peripheralCards.indexOf(card);
        if (index !== -1) {
            this.peripheralCards.splice(index, 1);
        }
        this.console.getCRU().deregisterCruDevice(card);
        if (card instanceof Horizon) {
            this.horizonCard = null;
        }
    }

    public getCartridge() {
        return this.cartridge;
    }

    public setCartridge(cartridge: Cartridge | null) {
        if (this.cartridge) {
            this.console.getCRU().deregisterCruDevice(this.cartridge);
        }
        this.cartridge = cartridge;
        if (cartridge) {
            this.console.getCRU().registerCruDevice(cartridge);
        }
        this.buildMemoryMap();
    }

    public loadSoftware(software: Software) {
        this.setRAMAt0000(software.ramAt0000);
        this.setRAMAt4000(software.ramAt4000);
        this.setRAMAt6000(software.ramAt6000);
        this.setRAMAt7000(software.ramAt7000);
        for (let i = 0; i < software.memoryBlocks.length; i++) {
            const memoryBlock = software.memoryBlocks[i];
            this.loadRAM(memoryBlock.address, memoryBlock.data);
        }
        this.buildMemoryMap();
    }

    public loadRAM(baseAddr: number, byteArray: Uint8Array) {
        for (let i = 0; i < byteArray.length; i++) {
            const addr = baseAddr + i;
            if (addr < 0x2000 && this.ramAt0000 || addr >= 0x4000 && addr < 0x6000 && this.ramAt4000) {
                this.ram[addr] = byteArray[i];
            } else if (this.ram32K) {
                this.ram32K.setByte(addr, byteArray[i]);
            } else if (this.sams) {
                this.sams.setByte(addr, byteArray[i]);
            }
        }
    }

    public reset(keepCart: boolean) {
        this.vdp = this.console.getVDP();
        this.psg = this.console.getPSG();
        this.speech = this.console.getSpeech();

        // RAM
        this.ram = new Uint8Array(0x10000);
        if (this.settings.isDebugResetEnabled()) {
            for (let i = 0; i < this.ram.length; i++) {
                this.ram[i] = i & 0xff;
            }
        }
        if (this.sams) {
            this.deregisterPeripheralCard(this.sams);
        }
        switch (this.settings.getRAM()) {
            case 'NONE':
                this.ram32K = null;
                this.sams = null;
                break;
            case '32K':
                this.ram32K = new RAM32K();
                this.sams = null;
                break;
            case 'SAMS1M':
                this.sams = new SAMS(1024, this.settings);
                this.registerPeripheralCard(this.sams);
                this.ram32K = null;
                break;
            case 'SAMS4M':
                this.sams = new SAMS(4096, this.settings);
                this.registerPeripheralCard(this.sams);
                this.ram32K = null;
                break;
            case 'SAMS16M':
                this.sams = new SAMS(16384, this.settings);
                this.registerPeripheralCard(this.sams);
                this.ram32K = null;
                break;
        }
        this.ramAt0000 = false;
        this.ramAt4000 = false;
        this.ramAt6000 = false;
        this.ramAt7000 = false;

        // ROM
        this.rom = new Uint8Array(System.ROM);
        this.patchROMForTapeUsage();

        // GROM
        this.grom = new GROMArray();
        this.grom.setData(new Uint8Array(System.GROM), 0);

        // Cartridge
        if (keepCart) {
            if (this.cartridge) {
                this.cartridge.reset();
            }
        } else {
            this.cartridge = null;
        }

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

    private patchROMForTapeUsage() {
        this.rom[0x14a7] = 0x03; // Fix cassette sync (LI instead of CI)
        this.rom[0x14a9] = 0x37; // Cassette read time (original 0x1f)
        this.rom[0x1353] = 0x1f; // Cassette write time (original 0x23)
    }

    private buildMemoryMap() {
        console.log(this.getState());
        this.memoryMap = [];
        const romAccessors = [this.readROM, this.writeROM];
        const ramAccessors = [this.readRAM, this.writeRAM];
        const expansionRAMAccessors = [this.readExpansionRAM, this.writeExpansionRAM];
        const peripheralCardAccessors = [this.readPeripheralCard, this.writePeripheralCard];
        const cartridgeAccessors = [this.readCartridge, this.writeCartridge];
        const padAccessors = [this.readPAD, this.writePAD];
        const soundAccessors = [this.readSound, this.writeSound];
        const vdpReadAccessors = [this.readVDP, this.writeNull];
        const vdpWriteAccessors = [this.readNull, this.writeVDP];
        const speechReadAccessors = [this.readSpeech, this.writeNull];
        const speechWriteAccessors = [this.readNull, this.writeSpeech];
        const gromReadAccessors = [this.readGROM, this.writeNull];
        const gromWriteAccessors = [this.readNull, this.writeGROM];
        const nullAccessors = [this.readNull, this.writeNull];
        let i: number;
        for (i = 0; i < 0x2000; i++) {
            this.memoryMap[i] = this.ramAt0000 ? ramAccessors : romAccessors;
        }
        for (i = 0x2000; i < 0x4000; i++) {
            this.memoryMap[i] = this.ram32K || this.sams ? expansionRAMAccessors : nullAccessors;
        }
        for (i = 0x4000; i < 0x6000; i++) {
            this.memoryMap[i] = this.ramAt4000 ? ramAccessors : peripheralCardAccessors;
        }
        for (i = 0x6000; i < 0x7000; i++) {
            if (this.ramAt6000) {
                this.memoryMap[i] = ramAccessors;
            } else if (this.cartridge) {
                this.memoryMap[i] = cartridgeAccessors;
            } else {
                this.memoryMap[i] = nullAccessors;
            }
        }
        for (i = 0x7000; i < 0x8000; i++) {
            if (this.ramAt7000) {
                this.memoryMap[i] = ramAccessors;
            } else if (this.cartridge) {
                this.memoryMap[i] = cartridgeAccessors;
            } else {
                this.memoryMap[i] = nullAccessors;
            }
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
            this.memoryMap[i] = this.ram32K || this.sams ? expansionRAMAccessors : nullAccessors;
        }
    }

    private readROM(addr: number, cpu: CPU): number {
        return (this.rom[addr] << 8) | this.rom[addr + 1];
    }

    private writeROM(addr: number, w: number, cpu: CPU) {
    }

    private readRAM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return (this.ram[addr] << 8) | this.ram[addr + 1];
    }

    private writeRAM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        this.ram[addr] = w >> 8;
        this.ram[addr + 1] = w & 0xFF;
    }

    private readExpansionRAM(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.ram32K) {
            return this.ram32K.readWord(addr);
        } else if (this.sams) {
            return this.sams.readWord(addr);
        } else {
            return 0;
        }
    }

    private writeExpansionRAM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (this.ram32K) {
            this.ram32K.writeWord(addr, w);
        } else if (this.sams) {
            this.sams.writeWord(addr, w);
        }
    }

    private readPeripheralCard(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
        if (activeCard) {
            if (this.isMemoryMappedCard(activeCard)) {
                return activeCard.readMemoryMapped(addr, cpu);
            } else if (this.isDsrCard(activeCard)) {
                const rom = activeCard.getDSR();
                const romAddr = addr - 0x4000 + activeCard.getDSRBankOffset();
                // this.log.info("Read peripheral ROM " + addr.toHexWord() + ": " + (rom[romAddr] << 8 | rom[romAddr + 1]).toHexWord());
                return rom[romAddr] << 8 | rom[romAddr + 1];
            }
        }
        return 0;
    }

    private writePeripheralCard(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
        if (activeCard && this.isMemoryMappedCard(activeCard)) {
            activeCard.writeMemoryMapped(addr, w, cpu);
        }
    }

    private readCartridge(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        if (this.horizonCard && this.horizonCard.isRamboEnabled()) {
            return this.horizonCard.readCartridgeSpace(addr);
        } else {
            return this.cartridge ? this.cartridge.read(addr) : 0;
        }
    }

    private writeCartridge(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
        if (this.horizonCard && this.horizonCard.isRamboEnabled()) {
            this.horizonCard.writeCartridgeSpace(addr, w);
        } else if (this.cartridge) {
            this.cartridge.write(addr, w);
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
        let value = 0;
        const gromAddr = this.grom.getAddress();
        cpu.addCycles(17);
        const maskedAddr = addr & 0x9802;
        if (maskedAddr === Memory.GRMRD) {
            // Read data from GROM
            cpu.addCycles(6);
            value = this.grom.readData();
        } else if (maskedAddr === Memory.GRMRA) {
            // Get GROM address
            value = this.grom.readAddress();
        }
        if (this.cartridge && this.cartridge.hasGROM()) {
            const cartValue = this.cartridge.readGROM(addr);
            if (gromAddr >= 0x6001) {
                value = cartValue;
            }
        }
        return value;
    }

    private writeGROM(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(23 + 6);
        const maskedAddr = addr & 0x9C02;
        if (maskedAddr === Memory.GRMWD) {
            if (this.settings.isGRAMEnabled()) {
                // Write data to GROM
                this.grom.writeData(w);
            }
        } else if (maskedAddr === Memory.GRMWA) {
            // Set GROM address
            this.grom.writeAddress(w);
        }
        if (this.cartridge) {
            this.cartridge.writeGROM(addr, w);
        }
    }

    private readNull(addr: number, cpu: CPU): number {
        cpu.addCycles(4);
        return 0;
    }

    private writeNull(addr: number, w: number, cpu: CPU) {
        cpu.addCycles(4);
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
            return this.ramAt0000 ? this.ram[addr] : this.rom[addr];
        }
        if (addr < 0x4000) {
            if (this.ram32K) {
                return this.ram32K.getByte(addr);
            } else if (this.sams) {
                return this.sams.getByte(addr);
            } else {
                return 0;
            }
        }
        if (addr < 0x6000) {
            if (this.ramAt4000) {
                return this.ram[addr];
            } else if (this.sams && this.sams.isEnabled()) {
                const w = this.sams.readRegister((addr & 0x1F) >> 1);
                return (addr & 1) === 0 ? (w & 0xFF) : (w >> 8);
            } else {
                const activeCard = this.peripheralCards.find(dsrDevice => dsrDevice.isEnabled());
                if (activeCard) {
                    if (this.isMemoryMappedCard(activeCard)) {
                        return activeCard.getByte(addr);
                    } else if (this.isDsrCard(activeCard)) {
                        const peripheralROM = activeCard.getDSR();
                        const romAddr = addr - 0x4000 + activeCard.getDSRBankOffset();
                        return peripheralROM ? peripheralROM[romAddr] : 0;
                    }
                }
                return 0;
            }
        }
        if (addr < 0x7000) {
            return this.ramAt6000 ? this.ram[addr] : (this.cartridge ? this.cartridge.getByte(addr) : 0);
        }
        if (addr < 0x8000) {
            return this.ramAt7000 ? this.ram[addr] : (this.cartridge ? this.cartridge.getByte(addr) : 0);
        }
        if (addr < 0x8400) {
            return this.ram[addr | 0x0300];
        }
        if (addr < 0xA000) {
            return 0;
        }
        if (addr < 0x10000) {
            if (this.ram32K) {
                return this.ram32K.getByte(addr);
            } else if (this.sams) {
                return this.sams.getByte(addr);
            } else {
                return 0;
            }
        }
        return 0;
    }

    public getWord(addr: number): number {
        return (this.getByte(addr) << 8) | this.getByte(addr + 1);
    }

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
        const gromAddress = this.grom.getAddress();
        return 'GROM:' + Util.toHexWord(gromAddress) + ' (bank:' + ((gromAddress & 0xE000) >> 13) +
            ', addr:' + Util.toHexWord(gromAddress & 0x1FFF) + ') ' +
            (this.cartridge ? 'Cart:' + this.cartridge.getStatus() : '') +
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

    setRAMAt6000(enabled: boolean) {
        this.ramAt6000 = enabled;
    }

    setRAMAt7000(enabled: boolean) {
        this.ramAt7000 = enabled;
    }

    getGROM(): GROMArray {
        return this.grom;
    }

    getSAMS(): SAMS | null {
        return this.sams;
    }

    isMemoryMappedCard(card: PeripheralCard): card is MemoryMappedCard {
        return (card as MemoryMappedCard).readMemoryMapped !== undefined;
    }

    isDsrCard(card: PeripheralCard): card is DSRCard {
        return (card as DSRCard).getDSR !== undefined;
    }

    getCardById(id: string): PeripheralCard | null {
        switch (id) {
            case SAMS.ID:
                return this.sams;
            case PCodeCard.ID:
                return this.pCodeCard;
            default:
                return this.console.getCardById(id);
        }
    }

    getState(): object {
        return {
            ramAt0000: this.ramAt0000,
            ramAt4000: this.ramAt4000,
            ramAt6000: this.ramAt6000,
            ramAt7000: this.ramAt7000,
            ram: this.ram,
            rom: this.rom,
            grom: this.grom.getState(),
            cartridge: this.cartridge ? this.cartridge.getState() : null,
            ram32K: this.ram32K ? this.ram32K.getState() : null,
            sams: this.sams ? this.sams.getState() : null,
            pCodeCard: this.pCodeCard ? this.pCodeCard.getState() : null,
            peripheralCarts: this.peripheralCards.map(card => card.getId())
        };
    }

    restoreState(state: any) {
        this.ramAt0000 = state.ramAt0000;
        this.ramAt4000 = state.ramAt4000;
        this.ramAt6000 = state.ramAt6000;
        this.ramAt7000 = state.ramAt7000;
        this.ram = state.ram;
        this.rom = state.rom;
        this.grom.restoreState(state.grom);
        if (state.cartridge) {
            if (!this.cartridge) {
                this.cartridge = new Cartridge(new Software(), this.settings);
            }
            this.cartridge!.restoreState(state.cartridge);
        } else {
            this.cartridge = null;
        }
        if (state.ram32K) {
            if (!this.ram32K) {
                this.ram32K = new RAM32K();
            }
            this.ram32K.restoreState(state.ram32K);
        }
        if (state.sams) {
            if (!this.sams) {
                this.sams = new SAMS(state.sams.size, this.settings);
            }
            this.sams.restoreState(state.sams);
        }
        if (state.pCodeCard) {
            if (!this.pCodeCard) {
                this.pCodeCard = new PCodeCard();
            }
            this.pCodeCard.restoreState(state.pCodeCard);
        }
        if (state.peripheralCards) {
            this.peripheralCards = [];
            state.peripheralCards.forEach((id: string) => {
                const card = this.getCardById(id);
                if (card) {
                    this.peripheralCards.push(card);
                }
            });
        }
        this.buildMemoryMap();
    }
}
