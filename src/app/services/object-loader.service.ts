import {Injectable} from '@angular/core';
import {Util} from '../classes/util';
import {MemoryBlock, Software} from '../classes/software';

enum LoaderAction  {
    EA5,
    MEMORY_DUMP,
    CARTRIDGE
}

class FileReader {

    private file: string;
    private pos: number;

    constructor(file: string) {
        this.file = file;
        this.pos = 0;
    }

    readLine() {
        let line = "";
        if (this.pos < this.file.length) {
            let char = this.file.charAt(this.pos);
            while (char !== '\n' && char !== '\r' && this.pos < this.file.length && line.length < 80) {
                line += char;
                this.pos++;
                if (this.pos < this.file.length) {
                    char = this.file.charAt(this.pos);
                }
            }
            while ((char === '\n' || char === '\r') && this.pos < this.file.length) {
                this.pos++;
                if (this.pos < this.file.length) {
                    char = this.file.charAt(this.pos);
                }
            }
            // console.log(line);
            return line;
        } else {
            return null;
        }
    }
}

class LineReader {

    private line: string;
    private pos: number;

    constructor(line: string) {
        this.line = line;
        this.pos = 0;
    }

    read() {
        if (this.pos < this.line.length) {
            const char = this.line.charAt(this.pos);
            this.pos++;
            return char;
        } else {
            return "";
        }
    }

    readString(len) {
        if (this.pos + len < this.line.length) {
            const str = this.line.substr(this.pos, len);
            this.pos += len;
            return str;
        } else {
            return "";
        }
    }

    readWord() {
        if (this.pos + 4 < this.line.length) {
            const word = parseInt(this.line.substr(this.pos, 4), 16);
            this.pos += 4;
            return word;
        } else {
            return -1;
        }
    }
}

@Injectable()
export class ObjectLoaderService {

    constructor() { }

    private lowRAMStartAddress: number;
    private lowRAMEndAddress: number;
    private highRAMStartAddress: number;
    private highRAMEndAddress: number;
    private cartRAMStartAddress: number;
    private cartRAMEndAddress: number;
    private autoStartAddress: number;
    private ram: Uint8Array;
    private rom: Uint8Array;
    private action: LoaderAction;

    loadObjFile(objFile: string) {
        let action = LoaderAction.EA5;
        const ram = new Uint8Array(0x10000);
        const psegOffset = 0xA000;
        let loadAddress = psegOffset;
        let autoStartAddress = -1;
        let lowRAMStartAddress = 0x10000;
        let lowRAMEndAddress = 0;
        let highRAMStartAddress = 0x10000;
        let highRAMEndAddress = 0;
        let cartRAMStartAddress = 0x10000;
        let cartRAMEndAddress = 0;
        const rom = new Uint8Array(0x10000);
        let romBank = -1;
        let eof = false;
        const fileReader = new FileReader(objFile);
        let line = fileReader.readLine();
        let lineNumber = 1;
        while (line != null && !eof) {
            const lineReader = new LineReader(line);
            let eol = false;
            let tag = lineReader.read();
            let tagNumber = 1;
            let address, offset;
            let label;
            while (tag !== '' && !eol && !eof) {
                switch (tag) {
                    // Start of PSEG
                    case '0':
                        const size = lineReader.readWord();
                        const name = lineReader.readString(8).trim();
                        console.log("Name: " + (name.length > 0 ? name : "n/a"));
                        console.log("Size: " + size);
                        break;
                    // Auto start in AORG
                    case '1':
                        autoStartAddress = lineReader.readWord();
                        console.log("Auto start address set to: " + Util.toHexWord(autoStartAddress));
                        break;
                    // Auto start in PSEG
                    case '2':
                        offset = lineReader.readWord();
                        autoStartAddress = psegOffset + offset;
                        console.log("Auto start address set to offset " + Util.toHexWord(offset) + ": " + Util.toHexWord(autoStartAddress));
                        break;
                    // REF label in PSEG
                    case '3':
                        offset = lineReader.readWord();
                        label = lineReader.readString(6).trim();
                        console.log("REF " + label + " offset " + Util.toHexWord(offset) + ": " + Util.toHexWord(psegOffset + offset));
                        break;
                    // REF label in AORG
                    case '4':
                        address = lineReader.readWord();
                        label = lineReader.readString(6).trim();
                        console.log("REF " + label + ": " + Util.toHexWord(address));
                        break;
                    // DEF label in PSEG
                    case '5':
                        offset = lineReader.readWord();
                        label = lineReader.readString(6).trim();
                        if (autoStartAddress === -1) {
                            autoStartAddress = psegOffset + offset;
                        }
                        console.log("DEF " + label + " offset " + Util.toHexWord(offset) + ": " + Util.toHexWord(psegOffset + offset));
                        break;
                    // DEF label in AORG
                    case '6':
                        address = lineReader.readWord();
                        label = lineReader.readString(6).trim();
                        if (autoStartAddress === -1) {
                            autoStartAddress = address;
                        }
                        console.log("DEF " + label + ": " + Util.toHexWord(address));
                        break;
                    // Checksum
                    case '7':
                        let checksum = lineReader.readWord();
                        break;
                    // Ignored checksum
                    case '8':
                        checksum = lineReader.readWord();
                        break;
                    // Set load address in AORG
                    case '9':
                        loadAddress = lineReader.readWord();
                        if (loadAddress !== -1) {
                            if (action === LoaderAction.CARTRIDGE) {
                                if (loadAddress >= 0xA000 && loadAddress < 0xC000) {
                                    loadAddress -= 0x3F00;
                                } else if (loadAddress >= 0xC000 && loadAddress < 0x10000) {
                                    loadAddress -= 0x5F00;
                                }
                            }
                            // console.log("Load address set to: " + loadAddress.toHexWord());
                        } else {
                            throw new Error("Invalid load address at line " + lineNumber + " position " + tagNumber + ".");
                        }
                        break;
                    // Set load address offset in PSEG
                    case 'A':
                        offset = lineReader.readWord();
                        loadAddress = psegOffset + offset;
                        if (loadAddress !== -1) {
                            console.log("Load address set to offset " + Util.toHexWord(offset) + ": " + Util.toHexWord(loadAddress));
                        } else {
                            throw new Error("Invalid load address at line " + lineNumber + " position " + tagNumber + ".");
                        }
                        break;
                    // Load word into memory
                    case 'B':
                        let word = lineReader.readWord();
                        if (word !== -1) {
                            if (loadAddress >= 0x2000 && loadAddress < 0x4000 || loadAddress >= 0x6000 && loadAddress < 0x8000 || loadAddress >= 0xA000 && loadAddress < 0x10000) {
                                if (loadAddress >= 0x2000 && loadAddress < 0x4000) {
                                    // Low RAM
                                    if (loadAddress < lowRAMStartAddress) {
                                        console.log("Low ram start set to " + Util.toHexWord(loadAddress));
                                        lowRAMStartAddress = loadAddress;
                                    }
                                    if (loadAddress > lowRAMEndAddress) {
                                        lowRAMEndAddress = loadAddress;
                                    }

                                } else if (loadAddress >= 0x6000 && loadAddress < 0x8000) {
                                    // Cartridge RAM
                                    if (loadAddress < cartRAMStartAddress) {
                                        console.log("Cart ram start set to " + Util.toHexWord(loadAddress));
                                        cartRAMStartAddress = loadAddress;
                                    }
                                    if (loadAddress > cartRAMEndAddress) {
                                        cartRAMEndAddress = loadAddress;
                                    }
                                } else {
                                    // High RAM
                                    if (loadAddress < highRAMStartAddress) {
                                        console.log("High ram start set to " + Util.toHexWord(loadAddress));
                                        highRAMStartAddress = loadAddress;
                                    }
                                    if (loadAddress > highRAMEndAddress) {
                                        highRAMEndAddress = loadAddress;
                                    }
                                }
                                ram[loadAddress] = (word & 0xFF00) >> 8;
                                ram[loadAddress + 1] = word & 0x00FF;
                            } else if (loadAddress >= 0x6000 && loadAddress < 0x8000) {
                                const romAddress = (romBank << 13) + (loadAddress - 0x6000);
                                rom[romAddress] = (word & 0xFF00) >> 8;
                                rom[romAddress + 1] = word & 0x00FF;
                            }
                            loadAddress = (loadAddress + 2) & 0xFFFF;
                        } else {
                            throw new Error("Invalid word at line " + lineNumber + " position " + tagNumber + ".");
                        }
                        break;
                    // Add PSEG offset to word and load it in memory
                    case 'C':
                        word = lineReader.readWord();
                        if (word !== -1) {
                            console.log("PSEG word offset " + Util.toHexWord(word)  + ": " + Util.toHexWord(psegOffset + word));
                            word = (psegOffset + word) & 0xFFFF;
                            ram[loadAddress] = (word & 0xFF00) >> 8;
                            ram[loadAddress + 1] = word & 0x00FF;
                            loadAddress = (loadAddress + 2) & 0xFFFF;
                        } else {
                            throw new Error("Invalid word at line " + lineNumber + " position " + tagNumber + ".");
                        }
                        break;
                    // End of record
                    case 'F':
                        eol = true;
                        break;
                    // CSEG
                    case 'P':
                        offset = lineReader.readWord();
                        console.log("CSEG: " + Util.toHexWord(offset));
                        action = LoaderAction.CARTRIDGE;
                        if (action === LoaderAction.CARTRIDGE) {
                            romBank++;
                            console.log("ROM bank is now " + romBank);
                        }
                        break;
                    // End of file
                    case ':':
                        eof = true;
                        break;
                    // Other
                    default:
                        console.log("Unknown tag '" + tag + "' at line " + lineNumber + " position " + tagNumber + ".");
                }
                tag = lineReader.read();
                tagNumber++;
            }
            line = fileReader.readLine();
            lineNumber++;
        }
        this.lowRAMStartAddress = lowRAMStartAddress;
        this.lowRAMEndAddress = lowRAMEndAddress;
        this.highRAMStartAddress = highRAMStartAddress;
        this.highRAMEndAddress = highRAMEndAddress;
        this.cartRAMStartAddress = cartRAMStartAddress;
        this.cartRAMEndAddress = cartRAMEndAddress;
        this.autoStartAddress = autoStartAddress !== -1 ? autoStartAddress : loadAddress;
        this.ram = ram;
        this.rom = rom;
        this.action = action;
    }

    getRAMBlock(start, length) {
        const ramBlock = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            ramBlock[i] = this.ram[start + i];
        }
        return ramBlock;
    }

    getUpperMemory() {
        return this.getRAMBlock(0xa000, 0x6000);
    }

    getLowerMemory() {
        return this.getRAMBlock(0x2000, 0x2000);
    }

    getAutoStartAddress() {
        return this.autoStartAddress;
    }

    getSoftware(): Software {
        const software = new Software();
        if (this.action === LoaderAction.EA5) {
            software.memoryBlocks = [];
            software.startAddress = this.autoStartAddress;
            const highRAMLength = this.highRAMEndAddress - this.highRAMStartAddress + 2;
            if (highRAMLength > 0) {
                console.log(Util.toHexWord(highRAMLength) + " bytes of upper RAM");
                software.memoryBlocks.push(new MemoryBlock(
                    this.highRAMStartAddress,
                    this.getRAMBlock(this.highRAMStartAddress, highRAMLength)
                ));
            }
            const lowRAMLength = this.lowRAMEndAddress - this.lowRAMStartAddress + 2;
            if (lowRAMLength > 0) {
                console.log(Util.toHexWord(lowRAMLength) + " bytes of lower RAM");
                software.memoryBlocks.push(new MemoryBlock(
                    this.lowRAMStartAddress,
                    this.getRAMBlock(this.lowRAMStartAddress, lowRAMLength)
                ));
            }
            const cartRAMLength = this.cartRAMEndAddress - this.cartRAMStartAddress + 2;
            if (cartRAMLength > 0) {
                console.log(Util.toHexWord(cartRAMLength) + " bytes of cartridge RAM");
                software.memoryBlocks.push(new MemoryBlock(
                    this.cartRAMStartAddress,
                    this.getRAMBlock(this.cartRAMStartAddress, cartRAMLength)
                ));
                software.ramAt6000 = true;
                software.ramAt7000 = true;
            }
        } else {
            software.rom = this.rom;
            software.inverted = true;
        }
        return software;
    }
}
