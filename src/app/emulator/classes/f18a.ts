import {VDP} from '../interfaces/vdp';
import {CRU} from './cru';
import {PSG} from '../interfaces/psg';
import {TI994A} from './ti994a';
import {F18AGPU} from './f18agpu';
import {Log, LogLevel} from '../../classes/log';
import {Util} from '../../classes/util';
import {MemoryLine, MemoryView} from "../../classes/memoryview";

export class F18A implements VDP {

    static VERSION = 0x19;

    static MAX_SCANLINE_SPRITES_JUMPER = true;
    static SCANLINES_JUMPER = false;

    static MODE_GRAPHICS = 0;
    static MODE_TEXT = 1;
    static MODE_TEXT_80 = 2;
    static MODE_BITMAP = 3;
    static MODE_MULTICOLOR = 4;

    static COLOR_MODE_NORMAL = 0;
    static COLOR_MODE_ECM_1 = 1;
    static COLOR_MODE_ECM_2 = 2;
    static COLOR_MODE_ECM_3 = 3;

    static PALETTE = [
        // Palette 0, original 9918A NTSC color approximations
        "000", //  0 Transparent
        "000", //  1 Black
        "2C3", //  2 Medium Green
        "5D6", //  3 Light Green
        "54F", //  4 Dark Blue
        "76F", //  5 Light Blue
        "D54", //  6 Dark Red
        "4EF", //  7 Cyan
        "F54", //  8 Medium Red
        "F76", //  9 Light Red
        "DC3", // 10 Dark Yellow
        "ED6", // 11 Light Yellow
        "2B2", // 12 Dark Green
        "C5C", // 13 Magenta
        "CCC", // 14 Gray
        "FFF", // 15 White
        // Palette 1, ECM1 (0 index is always 000) version of palette 0
        "000", //  0 Black
        "2C3", //  1 Medium Green
        "000", //  2 Black
        "54F", //  3 Dark Blue
        "000", //  4 Black
        "D54", //  5 Dark Red
        "000", //  6 Black
        "4EF", //  7 Cyan
        "000", //  8 Black
        "CCC", //  9 Gray
        "000", // 10 Black
        "DC3", // 11 Dark Yellow
        "000", // 12 Black
        "C5C", // 13 Magenta
        "000", // 14 Black
        "FFF", // 15 White
        // Palette 2, CGA colors
        "000", //  0 >000000 (  0   0   0) black
        "00A", //  1 >0000AA (  0   0 170) blue
        "0A0", //  2 >00AA00 (  0 170   0) green
        "0AA", //  3 >00AAAA (  0 170 170) cyan
        "A00", //  4 >AA0000 (170   0   0) red
        "A0A", //  5 >AA00AA (170   0 170) magenta
        "A50", //  6 >AA5500 (170  85   0) brown
        "AAA", //  7 >AAAAAA (170 170 170) light gray
        "555", //  8 >555555 ( 85  85  85) gray
        "55F", //  9 >5555FF ( 85  85 255) light blue
        "5F5", // 10 >55FF55 ( 85 255  85) light green
        "5FF", // 11 >55FFFF ( 85 255 255) light cyan
        "F55", // 12 >FF5555 (255  85  85) light red
        "F5F", // 13 >FF55FF (255  85 255) light magenta
        "FF5", // 14 >FFFF55 (255 255  85) yellow
        "FFF", // 15 >FFFFFF (255 255 255) white
        // Palette 3, ECM1 (0 index is always 000) version of palette 2
        "000", //  0 >000000 (  0   0   0) black
        "555", //  1 >555555 ( 85  85  85) gray
        "000", //  2 >000000 (  0   0   0) black
        "00A", //  3 >0000AA (  0   0 170) blue
        "000", //  4 >000000 (  0   0   0) black
        "0A0", //  5 >00AA00 (  0 170   0) green
        "000", //  6 >000000 (  0   0   0) black
        "0AA", //  7 >00AAAA (  0 170 170) cyan
        "000", //  8 >000000 (  0   0   0) black
        "A00", //  9 >AA0000 (170   0   0) red
        "000", // 10 >000000 (  0   0   0) black
        "A0A", // 11 >AA00AA (170   0 170) magenta
        "000", // 12 >000000 (  0   0   0) black
        "A50", // 13 >AA5500 (170  85   0) brown
        "000", // 14 >000000 (  0   0   0) black
        "FFF"  // 15 >FFFFFF (255 255 255) white
    ];

    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;
    private console: TI994A;
    private psg: PSG;
    private cru: CRU;

    // Allocate full 64K, but actually only using 16K VDP RAM + 2K VDP GRAM
    // + 32 bytes for GPU registers
    private ram = new Uint8Array(0x10000);
    private registers = new Uint8Array(64);
    private addressRegister: number;
    private statusRegister: number;
    private palette: number[][];

    private latch: boolean;
    private prefetchByte: number;
    private addressIncrement: number;

    private unlocked: boolean;
    private statusRegisterNo: number;
    private dataPortMode: boolean;
    private autoIncPaletteReg: boolean;
    private paletteRegisterNo: number;
    private paletteRegisterData: number;
    private currentScanline: number;
    private blanking: number;

    private displayOn: boolean;
    private interruptsOn: boolean;
    private screenMode: number;
    private colorTable: number;
    private nameTable: number;
    private charPatternTable: number;
    private spriteAttributeTable: number;
    private spritePatternTable: number;
    private colorTableMask: number;
    private patternTableMask: number;
    private fgColor: number;
    private bgColor: number;
    private spriteSize: number;
    private spriteMag: number;

    private tileColorMode: number;
    private tilePaletteSelect1: number;
    private tilePaletteSelect2: number;
    private spriteColorMode: number;
    private spritePaletteSelect: number;
    private realSpriteYCoord: boolean;
    private colorTable2: number;
    private nameTable2: number;
    private tileLayer1Enabled: boolean;
    private tileLayer2Enabled: boolean;
    private row30Enabled: boolean;
    private spriteLinkingEnabled: boolean;
    private hScroll1: number;
    private vScroll1: number;
    private hScroll2: number;
    private vScroll2: number;
    private hPageSize1: number;
    private vPageSize1: number;
    private hPageSize2: number;
    private vPageSize2: number;
    private bitmapEnable: boolean;
    private bitmapPriority: boolean;
    private bitmapTransparent: boolean;
    private bitmapFat: boolean;
    private bitmapPaletteSelect: number;
    private bitmapBaseAddr: number;
    private bitmapX: number;
    private bitmapY: number;
    private bitmapWidth: number;
    private bitmapHeight: number;
    private interruptScanline: number;
    private maxScanlineSprites: number;
    private maxSprites: number;
    private tileMap2AlwaysOnTop: boolean;
    private ecmPositionAttributes: boolean;
    private reportMax: boolean;
    private scanLines: boolean;
    private gpuHsyncTrigger: boolean;
    private gpuVsyncTrigger: boolean;
    private spritePlaneOffset: number;
    private tilePlaneOffset: number;
    private counterElapsed: number;
    private counterStart: number;
    private counterSnap: number;

    private collision: boolean;
    private fifthSprite: boolean;
    private fifthSpriteIndex: number;

    private canvasWidth: number;
    private canvasHeight: number;
    private drawWidth: number;
    private drawHeight: number;
    private leftBorder: number;
    private topBorder: number;
    private imageData: ImageData;
    private imageDataAddr: number;
    private imageDataData: Uint8ClampedArray;
    private frameCounter: number;
    private lastTime: number;

    private splashImage: HTMLImageElement;

    private gpu: F18AGPU;

    private spritePatternColorMap: {};

    private log: Log = Log.getLog();

    constructor(canvas: HTMLCanvasElement, console: TI994A) {
        this.canvas = canvas;
        this.canvasContext = canvas.getContext('2d');
        this.console = console;

        const imageObj = new Image();
        imageObj.onload = () => {
            this.splashImage = imageObj;
        };
        imageObj.src = 'assets/images/f18a_bitmap_v' + this.getVersionNoString() + '.png';

        this.log.info("F18A emulation enabled");
    }

    getGPU() {
        return this.gpu;
    }

    reset() {
        this.cru = this.console.getCRU();
        this.psg = this.console.getPSG();

        for (let i = 0; i < 0x4000; i++) {
            this.ram[i] = 0;
        }
        for (let i = 0; i < this.registers.length; i++) {
            this.registers[i] = 0;
        }
        this.addressRegister = 0;
        this.statusRegister = 0;
        this.palette = [];
        for (let i = 0; i < 64; i++) {
            const rgbColor = F18A.PALETTE[i];
            this.palette[i] = [
                parseInt(rgbColor.charAt(0), 16) * 17,
                parseInt(rgbColor.charAt(1), 16) * 17,
                parseInt(rgbColor.charAt(2), 16) * 17
            ];
        }

        this.prefetchByte = 0;
        this.latch = false;
        this.addressIncrement = 1;

        this.unlocked = false;
        this.statusRegisterNo = 0;
        this.dataPortMode = false;
        this.autoIncPaletteReg = false;
        this.paletteRegisterNo = 0;
        this.paletteRegisterData = -1;
        this.currentScanline = 0;
        this.blanking = 0;

        this.displayOn = true;
        this.interruptsOn = false;
        this.screenMode = F18A.MODE_GRAPHICS;
        this.colorTable = 0;
        this.nameTable = 0;
        this.charPatternTable = 0;
        this.spriteAttributeTable = 0;
        this.spritePatternTable = 0;
        this.colorTableMask = 0x3FFF;
        this.patternTableMask = 0x3FFF;
        this.fgColor = 0;
        this.bgColor = 7;
        this.spriteSize = 0;
        this.spriteMag = 0;

        this.tileColorMode = 0;
        this.tilePaletteSelect1 = 0;
        this.tilePaletteSelect2 = 0;
        this.spriteColorMode = 0;
        this.spritePaletteSelect = 0;
        this.realSpriteYCoord = false;
        this.colorTable2 = 0;
        this.nameTable2 = 0;
        this.tileLayer1Enabled = true;
        this.tileLayer2Enabled = false;
        this.row30Enabled = false;
        this.spriteLinkingEnabled = false;
        this.hScroll1 = 0;
        this.vScroll1 = 0;
        this.hScroll2 = 0;
        this.vScroll2 = 0;
        this.hPageSize1 = 0;
        this.vPageSize1 = 0;
        this.hPageSize2 = 0;
        this.vPageSize2 = 0;
        this.bitmapEnable = false;
        this.bitmapPriority = false;
        this.bitmapTransparent = false;
        this.bitmapFat = false;
        this.bitmapPaletteSelect = 0;
        this.bitmapBaseAddr = 0;
        this.bitmapX = 0;
        this.bitmapY = 0;
        this.bitmapWidth = 0;
        this.bitmapHeight = 0;
        this.interruptScanline = 0;
        this.maxScanlineSprites = F18A.MAX_SCANLINE_SPRITES_JUMPER ? 32 : 4;
        this.maxSprites = 32;
        this.tileMap2AlwaysOnTop = true;
        this.ecmPositionAttributes = false;
        this.reportMax = false;
        this.scanLines = F18A.SCANLINES_JUMPER;
        this.gpuHsyncTrigger = false;
        this.gpuVsyncTrigger = false;
        this.spritePlaneOffset = 0x800;
        this.tilePlaneOffset = 0x800;
        this.counterElapsed = 0;
        this.counterStart = this.getTime();
        this.counterSnap = 0;
        this.resetRegs();

        this.collision = false;
        this.fifthSprite = false;
        this.fifthSpriteIndex = 0x1F;

        this.setDimensions(true);
        this.imageDataAddr = 0;
        this.frameCounter = 0;
        this.lastTime = 0;

        if (!this.gpu) {
            this.gpu = new F18AGPU(this);
        }
        this.gpu.reset();

        this.spritePatternColorMap = {};
    }

    resetRegs() {
        this.log.info("F18A reset");
        this.log.setMinLevel(LogLevel.NONE);
        this.writeRegister(0, 0);
        this.writeRegister(1, 0x40);
        this.writeRegister(2, 0);
        this.writeRegister(3, 0x10);
        this.writeRegister(4, 0x01);
        this.writeRegister(5, 0x0A);
        this.writeRegister(6, 0x02);
        this.writeRegister(7, 0xF2);
        this.writeRegister(10, 0);
        this.writeRegister(11, 0);
        this.writeRegister(15, 0);
        this.writeRegister(19, 0);
        this.writeRegister(24, 0);
        this.writeRegister(25, 0);
        this.writeRegister(26, 0);
        this.writeRegister(27, 0);
        this.writeRegister(28, 0);
        this.writeRegister(29, 0);
        this.writeRegister(30, 0);
        this.writeRegister(31, 0);
        this.writeRegister(47, 0);
        this.writeRegister(48, 1);
        this.writeRegister(49, 0);
        this.writeRegister(50, 0);
        this.writeRegister(51, 32);
        this.writeRegister(54, 0x40);
        this.writeRegister(57, 0);
        this.writeRegister(58, 6);
        this.log.setMinLevel(LogLevel.INFO);
    }

    setDimensions(force) {
        const newCanvasWidth = this.screenMode === F18A.MODE_TEXT_80 ? 640 : 320;
        const newCanvasHeight = this.screenMode === F18A.MODE_TEXT_80 ? 480 : 240;
        const newDimensions = force || newCanvasWidth !== this.canvas.width || newCanvasHeight !== this.canvas.height;
        if (newDimensions) {
            this.canvas.width = this.canvasWidth = newCanvasWidth;
            this.canvas.height = this.canvasHeight = newCanvasHeight;
        }
        this.drawWidth = this.screenMode === F18A.MODE_TEXT_80 ? 512 : 256;
        this.drawHeight = this.row30Enabled ? 240 : 192;
        this.leftBorder = Math.floor((this.canvasWidth - this.drawWidth) >> 1);
        this.topBorder = Math.floor(((this.canvasHeight >> (this.screenMode === F18A.MODE_TEXT_80 ? 1 : 0)) - this.drawHeight) >> 1);
        if (newDimensions) {
            this.fillCanvas(this.bgColor);
            this.imageData = this.canvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
            this.imageDataData = this.imageData.data;
        }
    }

    fillCanvas(color) {
        this.canvasContext.fillStyle = 'rgba(' + this.palette[color].join(',') + ',1.0)';
        this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    initFrame() {
        this.imageDataAddr = 0;
    }

    drawScanline(y) {
        this.currentScanline = y >= this.topBorder ? y - this.topBorder : 255;
        this.collision = false;
        this.fifthSprite = false;
        this.fifthSpriteIndex = 0x1F;
        this.blanking = (y < this.topBorder || y >= this.topBorder + this.drawHeight) ? 1 : 0;
        this._drawScanline(y);
        if (this.screenMode === F18A.MODE_TEXT_80) {
            this._duplicateScanline();
        }
        this.blanking = 1; // GPU code after scanline may depend on this
        if (this.collision) {
            this.statusRegister |= 0x20;
        }
        if ((this.statusRegister & 0x40) === 0) {
            this.statusRegister = (this.statusRegister & 0xe0) | (this.reportMax ? this.registers[30] : this.fifthSpriteIndex);
            if (this.fifthSprite) {
                this.statusRegister |= 0x40;
            }
        }
        if (this.gpuHsyncTrigger) {
            this.gpu.setIdle(false);
        }
        if (y === this.topBorder + this.drawHeight - 1) {
            this.statusRegister |= 0x80;
            if (this.interruptsOn) {
                this.cru.setVDPInterrupt(true);
            }
            if (this.gpuVsyncTrigger) {
                this.gpu.setIdle(false);
            }
            this.frameCounter++;
        }
    }

    drawInvisibleScanline(y: number): void {
        this.currentScanline = Math.min(y, 255);
        if (this.gpuHsyncTrigger) {
            this.gpu.setIdle(false);
        }
    }

    updateCanvas() {
        this.canvasContext.putImageData(this.imageData, 0, 0);
        if (this.splashImage && this.frameCounter < 300) {
            this.canvasContext.drawImage(this.splashImage, 0, 0);
        }
    }

    _drawScanline(y) {
        const imageData = this.imageDataData;
        let imageDataAddr = this.imageDataAddr;
        if (this.displayOn && y >= this.topBorder && y < this.topBorder + this.drawHeight) {
            y -= this.topBorder;
            // Prepare sprites
            let spriteColorBuffer: Uint8Array, spritePaletteBaseIndexBuffer: Uint8Array;
            if (this.unlocked || (this.screenMode !== F18A.MODE_TEXT && this.screenMode !== F18A.MODE_TEXT_80)) {
                spriteColorBuffer = new Uint8Array(this.drawWidth);
                spritePaletteBaseIndexBuffer = new Uint8Array(this.drawWidth);
                this.prepareSprites(y, spriteColorBuffer, spritePaletteBaseIndexBuffer);
            }
            let scrollWidth = this.drawWidth;
            const scrollHeight = this.drawHeight;
            // Border in text modes
            const borderWidth = this.screenMode === F18A.MODE_TEXT ? 8 : (this.screenMode === F18A.MODE_TEXT_80 ? 16 : 0);
            scrollWidth -= (borderWidth << 1);
            // Prepare values for Tile layer 1
            const nameTableCanonicalBase = this.vPageSize1 ? this.nameTable & 0x3000 : (this.hPageSize1 ? this.nameTable & 0x3800 : this.nameTable);
            let nameTableBaseAddr = this.nameTable;
            let y1 = y + this.vScroll1;
            if (y1 >= scrollHeight) {
                y1 -= scrollHeight;
                nameTableBaseAddr ^= this.vPageSize1;
            }
            let rowOffset;
            switch (this.screenMode) {
                case F18A.MODE_GRAPHICS:
                case F18A.MODE_BITMAP:
                case F18A.MODE_MULTICOLOR:
                    rowOffset = (y1 >> 3) << 5;
                    break;
                case F18A.MODE_TEXT:
                    rowOffset = (y1 >> 3) * 40;
                    break;
                case F18A.MODE_TEXT_80:
                    rowOffset = (y1 >> 3) * 80;
                    break;
            }
            const lineOffset = y1 & 7;
            // Prepare values for Tile layer 2
            let rowOffset2, nameTableCanonicalBase2, nameTableBaseAddr2, lineOffset2, y12;
            if (this.tileLayer2Enabled) {
                nameTableCanonicalBase2 = this.vPageSize2 ? this.nameTable2 & 0x3000 : (this.hPageSize2 ? this.nameTable2 & 0x3800 : this.nameTable2);
                nameTableBaseAddr2 = this.nameTable2;
                y12 = y + this.vScroll2;
                if (y12 >= scrollHeight) {
                    y12 -= scrollHeight;
                    nameTableBaseAddr2 ^= this.vPageSize2;
                }
                switch (this.screenMode) {
                    case F18A.MODE_GRAPHICS:
                    case F18A.MODE_BITMAP:
                    case F18A.MODE_MULTICOLOR:
                        rowOffset2 = (y12 >> 3) << 5;
                        break;
                    case F18A.MODE_TEXT:
                        rowOffset2 = (y12 >> 3) * 40;
                        break;
                    case F18A.MODE_TEXT_80:
                        rowOffset2 = (y12 >> 3) * 80;
                        break;
                }
                lineOffset2 = y12 & 7;
            }
            // Prepare values for Bitmap layer
            let bitmapX2, bitmapY1, bitmapY2, bitmapYOffset;
            if (this.bitmapEnable) {
                bitmapX2 = this.bitmapX + this.bitmapWidth;
                bitmapY1 = y - this.bitmapY;
                bitmapY2 = this.bitmapY + this.bitmapHeight;
                bitmapYOffset = bitmapY1 * this.bitmapWidth;
            }
            // Prepare values for sprite layer
            const spritesEnabled = this.unlocked || (this.screenMode !== F18A.MODE_TEXT && this.screenMode !== F18A.MODE_TEXT_80);
            // Draw line
            for (let xc = 0; xc < this.canvasWidth; xc++) {
                // Draw pixel
                let color = this.bgColor;
                let paletteBaseIndex = 0;
                if (xc >= this.leftBorder && xc < this.leftBorder + this.drawWidth) {
                    const x = xc - this.leftBorder;
                    let havePixel = false,
                        tilePriority = false;
                    // Tile layer 1
                    if (this.tileLayer1Enabled) {
                        const {tilePriority: tilePriority1, transparentColor0: transparentColor01, color: tileColor1, paletteBaseIndex: tilePaletteBaseIndex1} =
                            this.drawTileLayer(x, y, y1, rowOffset, lineOffset, nameTableCanonicalBase, nameTableBaseAddr, this.colorTable, borderWidth, scrollWidth, this.hScroll1, this.hPageSize1, this.tilePaletteSelect1);
                        if (tileColor1 > 0 || !transparentColor01) {
                            color = tileColor1;
                            paletteBaseIndex = tilePaletteBaseIndex1;
                            tilePriority = tilePriority1;
                            havePixel = true;
                        }
                    }
                    // Tile layer 2
                    if (this.tileLayer2Enabled) {
                        const {tilePriority: tilePriority2, transparentColor0: transparentColor02, color: tileColor2, paletteBaseIndex: tilePaletteBaseIndex2} =
                            this.drawTileLayer(x, y, y1, rowOffset2, lineOffset2, nameTableCanonicalBase2, nameTableBaseAddr2, this.colorTable2, borderWidth, scrollWidth, this.hScroll2, this.hPageSize2, this.tilePaletteSelect2);
                        if (tileColor2 > 0 || !transparentColor02) {
                            color = tileColor2;
                            paletteBaseIndex = tilePaletteBaseIndex2;
                            tilePriority = tilePriority2 || this.tileMap2AlwaysOnTop;
                            havePixel = true;
                        }
                    }
                    // Bitmap layer
                    if (this.bitmapEnable) {
                        const bmpX = this.screenMode !== F18A.MODE_TEXT_80 ? x : x >> 1;
                        if (bmpX >= this.bitmapX && bmpX < bitmapX2 && y >= this.bitmapY && y < bitmapY2) {
                            const bitmapX1 = x - this.bitmapX;
                            const bitmapPixelOffset = bitmapX1 + bitmapYOffset;
                            const bitmapByte = this.ram[this.bitmapBaseAddr + (bitmapPixelOffset >> 2)];
                            let bitmapBitShift, bitmapColor;
                            if (this.bitmapFat) {
                                // 16 color bitmap with fat pixels
                                bitmapBitShift = (2 - (bitmapPixelOffset & 2)) << 1;
                                bitmapColor = (bitmapByte >> bitmapBitShift) & 0x0F;
                            } else {
                                // 4 color bitmap
                                bitmapBitShift = (3 - (bitmapPixelOffset & 3)) << 1;
                                bitmapColor = (bitmapByte >> bitmapBitShift) & 0x03;
                            }
                            if ((bitmapColor > 0 || !this.bitmapTransparent) && (this.bitmapPriority || !havePixel)) {
                                color = bitmapColor;
                                paletteBaseIndex = this.bitmapPaletteSelect;
                            }
                        }
                    }
                    // Sprite layer
                    if (spritesEnabled && !(tilePriority && havePixel)) {
                        const spriteColor = spriteColorBuffer[x] - 1;
                        if (spriteColor > 0) {
                            color = spriteColor;
                            paletteBaseIndex = spritePaletteBaseIndexBuffer[x];
                        }
                    }
                }
                // Draw pixel
                const rgbColor = this.palette[color + paletteBaseIndex];
                imageData[imageDataAddr++] = rgbColor[0];
                imageData[imageDataAddr++] = rgbColor[1];
                imageData[imageDataAddr++] = rgbColor[2];
                imageDataAddr++;
            }
        } else {
            // Empty scanline
            const rgbColor = this.palette[this.bgColor];
            for (let xc = 0; xc < this.canvasWidth; xc++) {
                imageData[imageDataAddr++] = rgbColor[0]; // R
                imageData[imageDataAddr++] = rgbColor[1]; // G
                imageData[imageDataAddr++] = rgbColor[2]; // B
                imageDataAddr++; // Skip alpha
            }
        }
        if (this.scanLines && (y & 1) !== 0) {
            // Dim last scan line
            let imagedataAddr2 = imageDataAddr - (this.canvasWidth << 2);
            for (let xc = 0; xc < this.canvasWidth; xc++) {
                imageData[imagedataAddr2++] *= 0.75;
                imageData[imagedataAddr2++] *= 0.75;
                imageData[imagedataAddr2++] *= 0.75;
                imagedataAddr2++;
            }
        }
        this.imageDataAddr = imageDataAddr;
    }

    drawTileLayer(
        x: number,
        y: number,
        y1: number,
        rowOffset: number,
        lineOffset: number,
        nameTableCanonicalBase: number,
        nameTableBaseAddr: number,
        colorTable: number,
        borderWidth: number,
        scrollWidth: number,
        hScroll: number,
        hPageSize: number,
        tilePaletteSelect: number
    ): { tilePriority: boolean; transparentColor0: boolean; color: number; paletteBaseIndex: number } {
        let tilePriority = false;
        let transparentColor0 = false;
        let tileColor = 0;
        let paletteBaseIndex = 0;
        let nameTableAddr = nameTableBaseAddr;
        let x1 = x - borderWidth + (hScroll << (this.screenMode === F18A.MODE_TEXT_80 ? 1 : 0));
        if (x1 >= scrollWidth) {
            x1 -= scrollWidth;
            nameTableAddr ^= hPageSize;
        }
        let charNo, bitShift, bit, patternAddr, patternByte;
        let colorByte, tileAttributeByte;
        let tilePaletteBaseIndex, lineOffset1;
        switch (this.screenMode) {
            case F18A.MODE_GRAPHICS:
                nameTableAddr += (x1 >> 3) + rowOffset;
                charNo = this.ram[nameTableAddr];
                bitShift = x1 & 7;
                lineOffset1 = lineOffset;
                if (this.tileColorMode !== F18A.COLOR_MODE_NORMAL) {
                    tileAttributeByte = this.ram[colorTable + (this.ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo)];
                    tilePriority = (tileAttributeByte & 0x80) !== 0;
                    if ((tileAttributeByte & 0x40) !== 0) {
                        // Flip X
                        bitShift = 7 - bitShift;
                    }
                    if ((tileAttributeByte & 0x20) !== 0) {
                        // Flip y
                        lineOffset1 = 7 - lineOffset1;
                    }
                    transparentColor0 = (tileAttributeByte & 0x10) !== 0;
                }
                bit = 0x80 >> bitShift;
                patternAddr = this.charPatternTable + (charNo << 3) + lineOffset1;
                patternByte = this.ram[patternAddr];
                switch (this.tileColorMode) {
                    case F18A.COLOR_MODE_NORMAL:
                        const colorSet = this.ram[colorTable + (charNo >> 3)];
                        tileColor = (patternByte & bit) !== 0 ? (colorSet & 0xF0) >> 4 : colorSet & 0x0F;
                        tilePaletteBaseIndex = tilePaletteSelect;
                        transparentColor0 = true;
                        tilePriority = false;
                        break;
                    case F18A.COLOR_MODE_ECM_1:
                        tileColor = ((patternByte & bit) >> (7 - bitShift));
                        tilePaletteBaseIndex = (tilePaletteSelect & 0x20) | ((tileAttributeByte & 0x0f) << 1);
                        break;
                    case F18A.COLOR_MODE_ECM_2:
                        tileColor =
                            ((patternByte & bit) >> (7 - bitShift)) |
                            (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                        break;
                    case F18A.COLOR_MODE_ECM_3:
                        tileColor =
                            ((patternByte & bit) >> (7 - bitShift)) |
                            (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1) |
                            (((this.ram[(patternAddr + (this.tilePlaneOffset << 1)) & 0x3fff] & bit) >> (7 - bitShift)) << 2);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                        break;
                }
                paletteBaseIndex = tilePaletteBaseIndex;
                break;
            case F18A.MODE_BITMAP:
                charNo = this.ram[nameTableAddr + (x1 >> 3) + rowOffset];
                bitShift = x1 & 7;
                bit = 0x80 >> bitShift;
                const charSetOffset = (y & 0xC0) << 5;
                patternByte = this.ram[this.charPatternTable + (((charNo << 3) + charSetOffset) & this.patternTableMask) + lineOffset];
                const colorAddr = colorTable + (((charNo << 3) + charSetOffset) & this.colorTableMask) + lineOffset;
                colorByte = this.ram[colorAddr];
                tileColor = (patternByte & bit) !== 0 ? (colorByte & 0xF0) >> 4 : (colorByte & 0x0F);
                paletteBaseIndex = tilePaletteSelect;
                transparentColor0 = true;
                break;
            case F18A.MODE_TEXT:
            case F18A.MODE_TEXT_80:
                if (x >= borderWidth && x < this.drawWidth - borderWidth) {
                    nameTableAddr += Math.floor(x1 / 6) + rowOffset;
                    charNo = this.ram[nameTableAddr];
                    bitShift = x1 % 6;
                    lineOffset1 = lineOffset;
                    if (this.tileColorMode !== F18A.COLOR_MODE_NORMAL) {
                        tileAttributeByte = this.ram[colorTable + (this.ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo)];
                        tilePriority = (tileAttributeByte & 0x80) !== 0;
                        if ((tileAttributeByte & 0x40) !== 0) {
                            // Flip X
                            bitShift = 5 - bitShift;
                        }
                        if ((tileAttributeByte & 0x20) !== 0) {
                            // Flip y
                            lineOffset1 = 7 - lineOffset1;
                        }
                        transparentColor0 = (tileAttributeByte & 0x10) !== 0;
                    }
                    bit = 0x80 >> bitShift;
                    patternAddr = this.charPatternTable + (charNo << 3) + lineOffset1;
                    patternByte = this.ram[patternAddr];
                    switch (this.tileColorMode) {
                        case F18A.COLOR_MODE_NORMAL:
                            if (this.unlocked && this.ecmPositionAttributes) {
                                tileAttributeByte = this.ram[colorTable + nameTableAddr - nameTableCanonicalBase];
                                tileColor = (patternByte & bit) !== 0 ? tileAttributeByte >> 4 : tileAttributeByte & 0xF;
                            } else {
                                tileColor = (patternByte & bit) !== 0 ? this.fgColor : this.bgColor;
                            }
                            tilePaletteBaseIndex = tilePaletteSelect;
                            transparentColor0 = true;
                            tilePriority = false;
                            break;
                        case F18A.COLOR_MODE_ECM_1:
                            tileColor = ((patternByte & bit) >> (7 - bitShift));
                            tilePaletteBaseIndex = (tilePaletteSelect & 0x20) | ((tileAttributeByte & 0x0f) << 1);
                            break;
                        case F18A.COLOR_MODE_ECM_2:
                            tileColor =
                                ((patternByte & bit) >> (7 - bitShift)) |
                                (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1);
                            tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                            break;
                        case F18A.COLOR_MODE_ECM_3:
                            tileColor =
                                ((patternByte & bit) >> (7 - bitShift)) |
                                (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1) |
                                (((this.ram[(patternAddr + (this.tilePlaneOffset << 1)) & 0x3fff] & bit) >> (7 - bitShift)) << 2);
                            tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                            break;
                    }
                } else {
                    transparentColor0 = true;
                }
                break;
            case F18A.MODE_MULTICOLOR:
                charNo = this.ram[nameTableAddr + (x1 >> 3) + rowOffset];
                colorByte = this.ram[this.charPatternTable + (charNo << 3) + ((y1 & 0x1c) >> 2)];
                tileColor = (x1 & 4) === 0 ? (colorByte & 0xf0) >> 4 : (colorByte & 0x0f);
                paletteBaseIndex = tilePaletteSelect;
                transparentColor0 = true;
                break;
        }
        return {
            tilePriority: tilePriority,
            transparentColor0: transparentColor0,
            color: tileColor,
            paletteBaseIndex: paletteBaseIndex
        };
    }

    prepareSprites(y: number, spriteColorBuffer: Uint8Array, spritePaletteBaseIndexBuffer: Uint8Array) {
        let spritesOnLine = 0;
        const outOfScreenY = this.row30Enabled ? 0xF0 : 0xC0;
        const negativeScreenY = this.row30Enabled ? 0xF0 : 0xD0;
        const maxSpriteAttrAddr = this.spriteAttributeTable + (this.maxSprites << 2);
        for (let spriteAttrAddr = this.spriteAttributeTable, index = 0;
             (this.row30Enabled || this.ram[spriteAttrAddr] !== 0xd0) && spriteAttrAddr < maxSpriteAttrAddr && spritesOnLine <= this.maxScanlineSprites; spriteAttrAddr += 4, index++) {
            let parentSpriteAttrAddr = null;
            if (this.spriteLinkingEnabled) {
                const spriteLinkingAttr = this.ram[this.spriteAttributeTable + 0x80 + ((spriteAttrAddr - this.spriteAttributeTable) >> 2)];
                if ((spriteLinkingAttr & 0x20) !== 0) {
                    parentSpriteAttrAddr = this.spriteAttributeTable + ((spriteLinkingAttr & 0x1F) << 2);
                }
            }
            let spriteY = this.ram[spriteAttrAddr];
            if (parentSpriteAttrAddr !== null) {
                spriteY = (spriteY + this.ram[parentSpriteAttrAddr]) & 0xFF;
            }
            if (!this.realSpriteYCoord) {
                spriteY++;
            }
            if (spriteY < outOfScreenY || spriteY > negativeScreenY) {
                if (spriteY > negativeScreenY) {
                    spriteY -= 256;
                }
                const spriteAttr = this.ram[spriteAttrAddr + 3];
                const spriteSize = !this.unlocked || (spriteAttr & 0x10) === 0 ? this.spriteSize : 1;
                const spriteMag = this.spriteMag;
                const spriteHeight = 8 << spriteSize; // 8 or 16
                const spriteDimensionY = spriteHeight << spriteMag; // 8, 16 or 32
                if (y >= spriteY && y < spriteY + spriteDimensionY) {
                    if (spritesOnLine < this.maxScanlineSprites) {
                        //noinspection JSSuspiciousNameCombination
                        const spriteWidth = spriteHeight;
                        //noinspection JSSuspiciousNameCombination
                        const spriteDimensionX = spriteDimensionY;
                        let spriteX = this.ram[spriteAttrAddr + 1];
                        if (parentSpriteAttrAddr === null) {
                            if ((spriteAttr & 0x80) !== 0) {
                                spriteX -= 32; // Early clock
                            }
                        } else {
                            // Linked
                            spriteX = (spriteX + this.ram[parentSpriteAttrAddr + 1]) & 0xFF;
                            if ((this.ram[parentSpriteAttrAddr + 3] & 0x80) !== 0) {
                                spriteX -= 32; // Early clock of parent
                            }
                        }
                        const patternNo = (this.ram[spriteAttrAddr + 2] & (spriteSize !== 0 ? 0xFC : 0xFF));
                        const spriteFlipY: boolean = this.unlocked && (spriteAttr & 0x20) !== 0;
                        const spriteFlipX: boolean = this.unlocked && (spriteAttr & 0x40) !== 0;
                        const baseColor = spriteAttr & 0x0F;
                        let sprPaletteBaseIndex = 0;
                        switch (this.spriteColorMode) {
                            case F18A.COLOR_MODE_NORMAL:
                                sprPaletteBaseIndex = this.spritePaletteSelect;
                                break;
                            case F18A.COLOR_MODE_ECM_1:
                                sprPaletteBaseIndex = (this.spritePaletteSelect & 0x20) | (baseColor << 1);
                                break;
                            case F18A.COLOR_MODE_ECM_2:
                                sprPaletteBaseIndex = (baseColor << 2);
                                break;
                            case F18A.COLOR_MODE_ECM_3:
                                sprPaletteBaseIndex = ((baseColor & 0x0e) << 2);
                                break;
                        }
                        const spritePatternBaseAddr = this.spritePatternTable + (patternNo << 3);
                        let dy = (y - spriteY) >> spriteMag;
                        if (spriteFlipY) {
                            dy = spriteHeight - dy - 1;
                        }
                        for (let dx = 0; dx < spriteWidth; dx += 8) {
                            const spritePatternAddr = spritePatternBaseAddr + dy + (dx << 1);
                            const spritePatternByte0 = this.ram[spritePatternAddr];
                            const spritePatternByte1 = this.ram[(spritePatternAddr + this.spritePlaneOffset) & 0x3fff];
                            const spritePatternByte2 = this.ram[(spritePatternAddr + (this.spritePlaneOffset << 1)) & 0x3fff];
                            let spriteBit = 0x80;
                            let spriteBitShift2 = 7;
                            for (let spriteBitShift1 = 0; spriteBitShift1 < 8; spriteBitShift1++) {
                                let sprColor;
                                let pixelOn = false;
                                switch (this.spriteColorMode) {
                                    case F18A.COLOR_MODE_NORMAL:
                                        pixelOn = (spritePatternByte0 & spriteBit) !== 0;
                                        sprColor = pixelOn ? baseColor : 0;
                                        break;
                                    case F18A.COLOR_MODE_ECM_1:
                                        sprColor = (spritePatternByte0 & spriteBit) >> spriteBitShift2;
                                        break;
                                    case F18A.COLOR_MODE_ECM_2:
                                        sprColor =
                                            ((spritePatternByte0 & spriteBit) >> spriteBitShift2) |
                                            (((spritePatternByte1 & spriteBit) >> spriteBitShift2) << 1);
                                        break;
                                    case F18A.COLOR_MODE_ECM_3:
                                        sprColor =
                                            ((spritePatternByte0 & spriteBit) >> spriteBitShift2) |
                                            (((spritePatternByte1 & spriteBit) >> spriteBitShift2) << 1) |
                                            (((spritePatternByte2 & spriteBit) >> spriteBitShift2) << 2);
                                        break;
                                }
                                if (sprColor > 0 || pixelOn) {
                                    let x2 = spriteX + ((spriteFlipX ? spriteDimensionX - (dx + spriteBitShift1) - 1 : dx + spriteBitShift1) << spriteMag);
                                    if (x2 >= 0 && x2 < this.drawWidth) {
                                        if (spriteColorBuffer[x2] === 0) {
                                            spriteColorBuffer[x2] = sprColor + 1; // Add one here so 0 means uninitialized. Subtract one before drawing.
                                            spritePaletteBaseIndexBuffer[x2] = sprPaletteBaseIndex;
                                        } else {
                                            this.collision = true;
                                        }
                                    }
                                    if (spriteMag) {
                                        x2++;
                                        if (x2 >= 0 && x2 < this.drawWidth) {
                                            if (spriteColorBuffer[x2] === 0) {
                                                spriteColorBuffer[x2] = sprColor + 1; // Add one here so 0 means uninitialized. Subtract one before drawing.
                                                spritePaletteBaseIndexBuffer[x2] = sprPaletteBaseIndex;
                                            } else {
                                                this.collision = true;
                                            }
                                        }
                                    }
                                }
                                spriteBit >>= 1;
                                spriteBitShift2--;
                            }
                        }
                    }
                    spritesOnLine++;
                    if (spritesOnLine === 5 && !this.fifthSprite) {
                        this.fifthSprite = true;
                        this.fifthSpriteIndex = index;
                    }
                }
            }
        }
        if (this.screenMode === F18A.MODE_TEXT_80) {
            for (let x1 = this.drawWidth >> 1; x1 >= 0; x1--) {
                spriteColorBuffer[x1 << 1] = spriteColorBuffer[x1];
                spritePaletteBaseIndexBuffer[x1 << 1] = spritePaletteBaseIndexBuffer[x1];
                spriteColorBuffer[(x1 << 1) + 1] = spriteColorBuffer[x1];
                spritePaletteBaseIndexBuffer[(x1 << 1) + 1] = spritePaletteBaseIndexBuffer[x1];
            }
        }
    }

    _duplicateScanline() {
        const lineBytes = this.canvasWidth << 2;
        let imagedataAddr2 = this.imageDataAddr - lineBytes;
        for (let i = 0; i < lineBytes; i++) {
            this.imageDataData[this.imageDataAddr++] = this.imageDataData[imagedataAddr2++];
        }
    }

    writeAddress(i) {
        if (!this.latch) {
            this.addressRegister = (this.addressRegister & 0xFF00) | i;
        } else {
            const cmd = (i & 0xc0) >> 6;
            const msb = i & 0x3f;
            switch (cmd) {
                // Set read address
                case 0:
                    this.addressRegister = (msb << 8) | (this.addressRegister & 0x00FF);
                    this.prefetchByte = this.ram[this.addressRegister];
                    this.addressRegister += this.addressIncrement;
                    this.addressRegister &= 0x3FFF;
                    this.registers[15] = this.registers[msb];
                    break;
                // Set write address
                case 1:
                    this.addressRegister =  (msb << 8) | (this.addressRegister & 0x00FF);
                    break;
                // Write register
                case 2:
                case 3:
                    const reg = msb;
                    if (this.unlocked || reg < 8 || reg === 57) {
                        this.writeRegister(reg, this.addressRegister & 0x00FF);
                    } else {
                        this.log.info("Write " + Util.toHexByte(this.addressRegister & 0x00FF) + " to F18A register " + reg + " (" + Util.toHexByte(reg) + ") without unlocking.");
                        if ((this.registers[0] & 0x04) === 0) {  // 1.8 firmware: writes to registers > 7 are masked if 80 columns mode is not enabled
                            this.writeRegister(reg & 0x07, this.addressRegister & 0x00FF);
                        } else {
                            this.log.info("Register write ignored.");
                        }
                    }
                    break;
            }
        }
        this.latch = !this.latch;
    }

    writeRegister(reg, value) {
        const oldValue = this.registers[reg];
        this.registers[reg] = value;
        switch (reg) {
            // Mode
            case 0:
                this.updateMode(this.registers[0], this.registers[1]);
                break;
            case 1:
                this.displayOn = (this.registers[1] & 0x40) !== 0;
                this.interruptsOn = (this.registers[1] & 0x20) !== 0;
                this.spriteSize = (this.registers[1] & 0x02) >> 1;
                this.spriteMag = this.registers[1] & 0x01;
                this.updateMode(this.registers[0], this.registers[1]);
                break;
            // Name table
            case 2:
                this.nameTable = (this.registers[2] & (this.screenMode !== F18A.MODE_TEXT_80 || this.unlocked ? 0xf : 0xc)) << 10;
                break;
            // Color table
            case 3:
                if (this.screenMode === F18A.MODE_BITMAP) {
                    this.colorTable = (this.registers[3] & 0x80) << 6;
                } else {
                    this.colorTable = this.registers[3] << 6;
                }
                this.updateTableMasks();
                break;
            // Pattern table
            case 4:
                if (this.screenMode === F18A.MODE_BITMAP) {
                    this.charPatternTable = (this.registers[4] & 0x4) << 11;
                } else {
                    this.charPatternTable = (this.registers[4] & 0x7) << 11;
                }
                this.updateTableMasks();
                break;
            // Sprite attribute table
            case 5:
                this.spriteAttributeTable = (this.registers[5] & 0x7f) << 7;
                break;
            // Sprite pattern table
            case 6:
                this.spritePatternTable = (this.registers[6] & 0x7) << 11;
                break;
            // Background
            case 7:
                this.fgColor = (this.registers[7] & 0xf0) >> 4;
                this.bgColor = this.registers[7] & 0x0f;
                break;
            // Name table 2 base address
            case 10:
                this.nameTable2 = (this.registers[10] & 0x0f) << 10;
                break;
            // Color Table 2 Base Address, 64-byte boundaries
            case 11:
                this.colorTable2 = this.registers[11] << 6;
                break;
            // Status register select / counter control
            case 15:
                this.statusRegisterNo = this.registers[15] & 0x0f;
                this.log.info("F18A status register " + this.statusRegisterNo + " selected.");
                const wasRunning: boolean = (oldValue & 0x10) !== 0;
                const running: boolean = (this.registers[15] & 0x10) !== 0;
                if (wasRunning && !running) {
                    // Stop
                    this.counterElapsed += (this.getTime() - this.counterStart);
                } else if (!wasRunning && running) {
                    // Start
                    this.counterStart = this.getTime();
                }
                if ((this.registers[15] & 0x20) !== 0) {
                    // Snapshot
                    if (running) {
                        // Started
                        this.counterSnap = (this.getTime() - this.counterStart); // + this.counterElapsed;
                    } else {
                        // Stopped
                        this.counterSnap = this.counterElapsed;
                    }
                    this.registers[15] &= 0xdf; // Clear trigger bit
                }
                if ((this.registers[15] & 0x40) !== 0) {
                    // Reset
                    this.counterElapsed = 0;
                    this.counterStart = this.getTime();
                    this.counterSnap = 0;
                    this.registers[15] &= 0xbf; // Clear trigger bit
                }
                break;
            // Horz interrupt scan line, 0 to disable
            case 19:
                this.interruptScanline = this.registers[19];
                this.log.info("F18A interrupt scanline set to " + Util.toHexByte(this.interruptScanline) + " (not implemented)");
                break;
            // Palette select
            case 24:
                this.spritePaletteSelect = this.registers[24] & 0x30;
                this.tilePaletteSelect1 = (this.registers[24] & 0x03) << 4; // Shift into position
                this.tilePaletteSelect2 = (this.registers[24] & 0x0C) << 2; // Shift into position
                break;
            // Horizontal scroll offset 2
            case 25:
                this.hScroll2 = this.registers[25];
                break;
            // Vertical scroll offset 2
            case 26:
                this.vScroll2 = this.registers[26];
                break;
            // Horizontal scroll offset 1
            case 27:
                this.log.debug("Horizontal scroll offset 1: " + Util.toHexByte(this.registers[27]));
                this.hScroll1 = this.registers[27];
                break;
            // Vertical scroll offset 1
            case 28:
                this.log.debug("Vertical scroll offset 1: " + Util.toHexByte(this.registers[28]));
                this.vScroll1 = this.registers[28];
                break;
            // Page size
            case 29:
                this.hPageSize1 = (this.registers[29] & 0x02) << 9;
                this.vPageSize1 = (this.registers[29] & 0x01) << 11;
                this.hPageSize2 = (this.registers[29] & 0x20) << 5;
                this.vPageSize2 = (this.registers[29] & 0x10) << 7;
                this.spritePlaneOffset = 0x100 << (3 - ((this.registers[29] & 0xC0) >> 6));
                this.log.info("Sprite plane offset: " + Util.toHexWord(this.spritePlaneOffset));
                this.tilePlaneOffset = 0x100 << (3 - ((this.registers[29] & 0x0C) >> 2));
                this.log.info("Tile plane offset: " + Util.toHexWord(this.tilePlaneOffset));
                break;
            // Max displayable sprites on a scanline
            // Setting this to 0 restores the jumper value (4 or 32). Here assumed to be 32.
            // Setting this to 31 means all 32 sprites can be displayed.
            // You cannot choose to have 31 displayable sprites on a scanline.
            case 30:
                if (this.registers[30] === 0) {
                    this.registers[30] = F18A.MAX_SCANLINE_SPRITES_JUMPER ? 31 : 4;
                }
                this.maxScanlineSprites = this.registers[30];
                if (this.maxScanlineSprites === 31) {
                    this.maxScanlineSprites = 32;
                }
                this.log.info("Max scanline sprites set to " + this.maxScanlineSprites);
                break;
            // Bitmap control
            case 31:
                this.bitmapEnable = (this.registers[31] & 0x80) !== 0;
                this.bitmapPriority = (this.registers[31] & 0x40) !== 0;
                this.bitmapTransparent = (this.registers[31] & 0x20) !== 0;
                this.bitmapFat = (this.registers[31] & 0x10) !== 0;
                this.bitmapPaletteSelect = (this.registers[31] & (this.bitmapFat ? 0x0C : 0x0F)) << 2; // Shift into position
                break;
            // Bitmap base address
            case 32:
                this.bitmapBaseAddr = this.registers[32] << 6;
                this.log.info("Bitmap layer base set to " + Util.toHexWord(this.bitmapBaseAddr));
                break;
            // Bitmap x
            case 33:
                this.bitmapX = this.registers[33];
                this.log.debug("Bitmap X set to " + Util.toHexWord(this.bitmapX));
                break;
            // Bitmap y
            case 34:
                this.bitmapY = this.registers[34];
                this.log.debug("Bitmap Y set to " + Util.toHexWord(this.bitmapY));
                break;
            // Bitmap width
            case 35:
                this.bitmapWidth = this.registers[35];
                if (this.bitmapWidth === 0) {
                    this.bitmapWidth = 256;
                }
                this.log.debug("Bitmap width set to " + Util.toHexWord(this.bitmapWidth));
                break;
            // Bitmap height
            case 36:
                this.bitmapHeight = this.registers[36];
                this.log.debug("Bitmap height set to " + Util.toHexWord(this.bitmapHeight));
                break;
            // Palette control
            case 47:
                this.dataPortMode = (this.registers[47] & 0x80) !== 0;
                this.autoIncPaletteReg = (this.registers[47] & 0x40) !== 0;
                this.paletteRegisterNo = this.registers[47] & 0x3f;
                this.paletteRegisterData = -1;
                if (this.dataPortMode) {
                    this.log.info("F18A Data port mode on.");
                } else {
                    this.log.info("F18A Data port mode off.");
                }
                break;
            // SIGNED two's-complement increment amount for VRAM address, defaults to 1
            case 48:
                this.addressIncrement = this.registers[48] < 128 ? this.registers[48] : this.registers[48] - 256;
                break;
            // Enhanced color mode
            case 49:
                this.tileLayer2Enabled = (this.registers[49] & 0x80) !== 0;
                const oldRow30: boolean = this.row30Enabled;
                this.row30Enabled = (this.registers[49] & 0x40) !== 0;
                if (oldRow30 !== this.row30Enabled) {
                    this.setDimensions(false);
                    this.log.info("30 rows mode " + (this.row30Enabled ? "enabled" : "disabled") + ".");
                }
                this.tileColorMode = (this.registers[49] & 0x30) >> 4;
                this.log.info("F18A Enhanced Color Mode " + this.tileColorMode + " selected for tiles.");
                this.realSpriteYCoord = (this.registers[49] & 0x08) !== 0;
                if (this.getVersion() <= 0x18) {
                    this.spriteLinkingEnabled = (this.registers[49] & 0x04) !== 0;
                }
                this.spriteColorMode = this.registers[49] & 0x03;
                this.log.info("F18A Enhanced Color Mode " + this.spriteColorMode + " selected for sprites.");
                break;
            // Position vs name attributes, TL2 always on top
            case 50:
                // Write 1 to reset all VDP registers
                if ((this.registers[50] & 0x80) !== 0) {
                    this.resetRegs();
                    this.unlocked = false;
                    this.updateMode(this.registers[0], this.registers[1]);
                    return;
                }
                this.gpuHsyncTrigger = (this.registers[50] & 0x40) !== 0;
                if (this.gpuHsyncTrigger) {
                    this.log.debug("F18A Hsync trigger set");
                }
                this.gpuVsyncTrigger = (this.registers[50] & 0x20) !== 0;
                if (this.gpuVsyncTrigger) {
                    this.log.info("F18A Vsync trigger set");
                }
                // 0 = normal, 1 = disable GM1, GM2, MCM, T40, T80
                this.tileLayer1Enabled = (this.registers[50] & 0x10) === 0;
                // Report sprite max vs 5th sprite
                this.reportMax = (this.registers[50] & 0x08) !== 0;
                // Draw scan lines
                this.scanLines = (this.registers[50] & 0x04) !== 0;
                // 0 = per name attributes in ECMs, 1 = per position attributes
                this.ecmPositionAttributes = (this.registers[50] & 0x02) !== 0;
                // 0 = TL2 always on top, 1 = TL2 vs sprite priority is considered
                this.tileMap2AlwaysOnTop = (this.registers[50] & 0x01) === 0;
                break;
            // Stop Sprite (zero based) to limit the total number of sprites to process.
            // Defaults to 32, i.e. no stop sprite
            case 51:
                this.maxSprites = this.registers[51] & 0x3F;
                this.log.debug("Max processed sprites set to " + this.maxSprites);
                break;
            // GPU address MSB
            case 54:
                break;
            // GPU address LSB
            case 55:
                this.gpu.intReset();
                this.log.info("F18A GPU triggered at " + Util.toHexWord((this.registers[54] << 8) | this.registers[55]));
                this.gpu.setPc(this.registers[54] << 8 | this.registers[55]);
                break;
            case 56:
                this.gpu.setPc(this.registers[54] << 8 | this.registers[55]);
                if ((this.registers[56] & 1) === 0) {
                    this.gpu.setIdle(true);
                    this.log.info("F18A GPU stopped.");
                }
                break;
            case 57:
                if (!this.unlocked) {
                    if ((oldValue & 0x1c) === 0x1c && (this.registers[57] & 0x1c) === 0x1c) {
                        this.unlocked = true;
                        this.log.info("F18A unlocked");
                    }
                } else {
                    this.registers[57] = 0;
                    this.unlocked = false;
                    this.log.info("F18A locked");
                }
                this.updateMode(this.registers[0], this.registers[1]);
                break;
            case 58:
                if (this.getVersion() <= 0x18) {
                    let gromClock = this.registers[58] & 0x0F;
                    if (gromClock < 7) {
                        gromClock = 6;
                    }
                    gromClock = (gromClock << 4) | 0x0F;
                    this.psg.setGROMClock(gromClock);
                }
                break;
            default:
                this.log.info("Write " + Util.toHexByte(this.registers[reg]) + " to F18A register " + reg + " (" + Util.toHexByte(reg) + ").");
                break;
        }
    }

    readRegister(reg) {
        return this.registers[reg];
    }

    updateMode(reg0, reg1) {
        const oldMode = this.screenMode;
        // Check bitmap mode bit, not text or multicolor
        if ((reg0 & 0x2) !== 0 && (reg1 & 0x18) === 0) {
            // Bitmap mode
            this.screenMode = F18A.MODE_BITMAP;
            this.log.debug("Bitmap mode selected");
        } else {
            switch ((reg1 & 0x18) >> 3) {
                case 0:
                    // Graphics mode 0
                    this.screenMode = F18A.MODE_GRAPHICS;
                    // this.log.info("Graphics I mode selected");
                    break;
                case 1:
                    // Multicolor mode
                    this.screenMode = F18A.MODE_MULTICOLOR;
                    this.log.info("Multicolor mode selected");
                    break;
                case 2:
                    // Text mode
                    if ((reg0 & 0x04) === 0) {
                        this.screenMode = F18A.MODE_TEXT;
                        this.log.info("Text mode selected");
                    } else {
                        this.screenMode = F18A.MODE_TEXT_80;
                        this.log.info("Text 80 mode selected");
                    }
                    break;
            }
        }
        if (this.screenMode === F18A.MODE_BITMAP) {
            this.colorTable = (this.registers[3] & 0x80) << 6;
            this.charPatternTable = (this.registers[4] & 0x4) << 11;
            this.updateTableMasks();
        } else {
            this.colorTable = this.registers[3] << 6;
            this.charPatternTable = (this.registers[4] & 0x7) << 11;
        }
        this.nameTable = (this.registers[2] & (this.screenMode !== F18A.MODE_TEXT_80 || this.unlocked ? 0xf : 0xc)) << 10;
        this.spriteAttributeTable = (this.registers[5] & 0x7f) << 7;
        this.spritePatternTable = (this.registers[6] & 0x7) << 11;
        if (oldMode !== this.screenMode) {
            this.setDimensions(false);
        }
    }

    updateTableMasks() {
        if (this.screenMode === F18A.MODE_BITMAP) {
            this.colorTableMask = ((this.registers[3] & 0x7F) << 6) | 0x3F;
            this.patternTableMask  = ((this.registers[4] & 0x03) << 11) | (this.colorTableMask & 0x7FF);
            // this.log.info("colorTableMask:" + this.colorTableMask);
            // this.log.info("patternTableMask:" + this.patternTableMask);
        } else {
            this.colorTableMask = 0x3FFF;
            this.patternTableMask = 0x3FFF;
        }
    }

    writeData(b) {
        if (!this.dataPortMode) {
            this.ram[this.addressRegister] = b;
            this.addressRegister += this.addressIncrement;
            this.addressRegister &= 0x3FFF;
        } else {
            // Write data to F18A palette registers
            if (this.paletteRegisterData === -1) {
                // Read first byte
                this.paletteRegisterData = b;
            } else {
                // Read second byte
                this.palette[this.paletteRegisterNo][0] = (this.paletteRegisterData & 0x0f) * 17;
                this.palette[this.paletteRegisterNo][1] = ((b & 0xf0) >> 4) * 17;
                this.palette[this.paletteRegisterNo][2] = (b & 0x0f) * 17;
                // this.log.info("F18A palette register " + this.paletteRegisterNo.toHexByte() + " set to " + (this.paletteRegisterData << 8 | b).toHexWord());
                if (this.autoIncPaletteReg) {
                    this.paletteRegisterNo++;
                }
                // The F18A turns off DPM after each register is written if auto increment is off
                // or after writing to last register if auto increment in on
                if (!this.autoIncPaletteReg || this.paletteRegisterNo === 64) {
                    this.dataPortMode = false;
                    this.paletteRegisterNo = 0;
                    this.log.info("F18A Data port mode off (auto).");
                }
                this.paletteRegisterData = -1;
            }
        }
    }

    readStatus() {
        switch (this.statusRegisterNo) {
            case 0:
                // Normal status
                const i = this.statusRegister;
                this.statusRegister = 0x1F;
                this.cru.setVDPInterrupt(false);
                return i;
            case 1:
                // ID
                return 0xe0;
            case 2:
                // GPU status
                return (this.gpu.isIdle() ? 0 : 0x80) | (this.ram[0xb000] & 0x7f);
            case 3:
                // Current scanline
                return this.getCurrentScanline();
            case 4:
                // Counter nanos LSB
                return (Math.floor((this.counterSnap * 1000000) / 10) * 10 % 1000) & 0x00ff;
            case 5:
                // Counter nanos MSB
                return ((Math.floor((this.counterSnap * 1000000) / 10) * 10 % 1000) & 0x0300) >> 8;
            case 6:
                // Counter micros LSB
                return ((this.counterSnap * 1000) % 1000) & 0x00ff;
            case 7:
                // Counter micros MSB
                return (((this.counterSnap * 1000) % 1000) & 0x0300) >> 8;
            case 8:
                // Counter millis LSB
                return (this.counterSnap % 1000) & 0x00ff;
            case 9:
                // Counter millis MSB
                return ((this.counterSnap % 1000) & 0x0300) >> 8;
            case 10:
                // Counter seconds LSB
                return (this.counterSnap / 1000) & 0x00ff;
            case 11:
                // Counter seconds MSB
                return ((this.counterSnap / 1000) & 0xff00) >> 8;
            case 14:
                // Version
                return this.getVersion();
            case 15:
                // Status register number
                return this.registers[15];
        }
        this.latch = false; // According to Matthew
    }

    readData() {
        const i = this.prefetchByte;
        this.prefetchByte = this.ram[this.addressRegister++];
        this.addressRegister &= 0x3FFF;
        return i;
    }

    getRAM() {
        return this.ram;
    }

   getCurrentScanline() {
        this.log.debug("Get scanline=" + this.currentScanline);
        return this.currentScanline;
    }

    getBlanking() {
        this.log.debug("Get blanking=" + this.blanking);
        return this.blanking;
    }

    colorTableSize() {
        if (this.screenMode === F18A.MODE_BITMAP) {
            return Math.min(this.colorTableMask + 1, 0x1800);
        } else {
            return 0x20;
        }
    }

    patternTableSize() {
        if (this.screenMode === F18A.MODE_BITMAP) {
            return Math.min(this.patternTableMask + 1, 0x1800);
        } else {
            return 0x800;
        }
    }

    getRegsString() {
        let s = "";
        for (let i = 0; i < 8; i++) {
            s += "VR" + i + ":" + Util.toHexByte(this.registers[i]) + " ";
        }
        s += "\nSIT:" + Util.toHexWord(this.nameTable) + " PDT:" + Util.toHexWord(this.charPatternTable) + " (" + Util.toHexWord(this.patternTableSize()) + ")" +
            " CT:" + Util.toHexWord(this.colorTable) + " (" + Util.toHexWord(this.colorTableSize()) + ") SDT:" + Util.toHexWord(this.spritePatternTable) +
            " SAL:" + Util.toHexWord(this.spriteAttributeTable)  + "\nVDP:" + Util.toHexWord(this.addressRegister) + ' ST:' + Util.toHexByte(this.statusRegister);
        return s;
    }

    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        const mask = width - 1;
        const lines: MemoryLine[] = [];
        let anchorLine: number = null;
        let addr = start;
        let lineNo = 0;
        let line = "";
        let ascii = "";
        for (let i = 0; i < length; addr++, i++) {
            if (anchorAddr === addr) {
                anchorLine = lineNo;
            }
            if ((i & mask) === 0) {
                line += Util.toHexWord(addr) + ': ';
            }
            const byte = this.ram[addr];
            line += Util.toHexByteShort(byte);
            ascii += byte >= 32 && byte < 127 ? String.fromCharCode(byte) : "\u25a1";
            if ((i & mask) === mask) {
                line += " " + ascii;
                lines.push({addr: addr, text: line});
                line = "";
                ascii = "";
                lineNo++;
            } else {
                line += ' ';
            }
        }
        return new MemoryView(lines, anchorLine, 0);
    }

    getWord(addr) {
        return addr < 0x4800 ? this.ram[addr] << 8 | this.ram[addr + 1] : 0;
    }

    getCharAt(x, y) {
        if (this.screenMode === F18A.MODE_TEXT_80) {
            x *= 2;
        }
        x -= this.leftBorder;
        y -= this.topBorder;
        if (x >= 0 && x < this.drawWidth && y >= 0 && y < this.drawHeight) {
            switch (this.screenMode) {
                case F18A.MODE_GRAPHICS:
                case F18A.MODE_BITMAP:
                    return this.ram[this.nameTable + (x >> 3) + (y >> 3) * 32];
                case F18A.MODE_TEXT:
                    return this.ram[this.nameTable + Math.floor((x - 8) / 6) + (y >> 3) * 40];
                case F18A.MODE_TEXT_80:
                    return this.ram[this.nameTable + Math.floor((x - 16) / 6) + (y >> 3) * 80];
            }
        }
        return -1;
    }

    getTime() {
        return window.performance ? window.performance.now() : (new Date()).getTime();
    }

    getPalette(): number[][] {
        return this.palette;
    }

    getRegister(n): number {
        return this.registers[n];
    }

    getBitmapWidth(): number {
        return this.bitmapWidth;
    }

    getBitmapBaseAddr(): number {
        return this.bitmapBaseAddr;
    }

    getVersion() {
        return F18A.VERSION;
    }

    getVersionNoString() {
        const version = this.getVersion();
        return ((version >> 4) & 0x0f) + "." + (version & 0x0f);
    }

    drawPaletteImage(canvas: HTMLCanvasElement): void {
        const
            size = 16,
            width = canvas.width = 32 * size + 32,
            height = canvas.height = 2 * size + 2,
            canvasContext = canvas.getContext("2d");
        canvasContext.fillStyle = "rgba(255, 255, 255, 1)";
        canvasContext.fillRect(0, 0, width, height);
        let color = 0;
        for (let y = 0; y < height; y += size + 1) {
            for (let x = 0; x < width; x += size + 1) {
                const rgbColor  = this.palette[color];
                canvasContext.fillStyle = "rgba(" + rgbColor[0] + "," + rgbColor[1] + "," + rgbColor[2] + ",1)";
                canvasContext.fillRect(x, y, size, size);
                color++;
            }
        }
    }

    drawTilePatternImage(canvas: HTMLCanvasElement, section: number, gap: boolean) {
        const
            baseWidth = 256,
            width = canvas.width = baseWidth + (gap ? 32 : 0),
            baseHeight = 64,
            height = canvas.height = baseHeight + (gap ? 8 : 0),
            canvasContext = canvas.getContext("2d"),
            imageData = canvasContext.createImageData(width, height),
            screenMode = this.screenMode,
            ram = this.ram,
            baseTableOffset = section << 11,
            colorTable = this.colorTable,
            charPatternTable = this.charPatternTable,
            colorTableMask = this.colorTableMask,
            patternTableMask = this.patternTableMask,
            tileColorMode = this.tileColorMode,
            tilePaletteSelect = this.tilePaletteSelect1,
            palette = this.palette,
            fgColor = this.fgColor,
            bgColor = this.bgColor,
            imageDataData = imageData.data;
        let
            name: number,
            tableOffset: number,
            tileAttributeByte: number,
            colorByte: number,
            bit: number,
            transparentColor0: boolean,
            patternByte: number,
            patternAddr: number,
            rowNameOffset: number,
            lineOffset: number,
            pixelOffset: number,
            color: number,
            rgbColor: number[],
            imageDataAddr = 0;
        for (let y = 0; y < baseHeight; y++) {
            rowNameOffset = (y >> 3) << 5;
            lineOffset = y & 7;
            for (let x = 0; x < baseWidth; x++) {
                color = 0;
                pixelOffset = x & 7;
                switch (screenMode) {
                    case F18A.MODE_GRAPHICS:
                        name = rowNameOffset + (x >> 3);
                        if (tileColorMode !== F18A.COLOR_MODE_NORMAL) {
                            tileAttributeByte = this.ram[colorTable + name];
                            if ((tileAttributeByte & 0x40) !== 0) {
                                // Flip X
                                pixelOffset = 7 - pixelOffset;
                            }
                            if ((tileAttributeByte & 0x20) !== 0) {
                                // Flip y
                                lineOffset = 7 - lineOffset;
                            }
                            transparentColor0 = (tileAttributeByte & 0x10) !== 0;
                        }
                        bit = 0x80 >> pixelOffset;
                        patternAddr = this.charPatternTable + (name << 3) + lineOffset;
                        patternByte = this.ram[patternAddr];
                        switch (this.tileColorMode) {
                            case F18A.COLOR_MODE_NORMAL:
                                const colorSet = this.ram[colorTable + (name >> 3)];
                                color = (patternByte & bit) !== 0 ? (colorSet & 0xF0) >> 4 : (colorSet & 0x0F || bgColor) +
                                    tilePaletteSelect;
                                transparentColor0 = true;
                                break;
                            case F18A.COLOR_MODE_ECM_1:
                                color = ((patternByte & bit) >> (7 - pixelOffset)) +
                                    (tilePaletteSelect & 0x20) | ((tileAttributeByte & 0x0f) << 1);
                                break;
                            case F18A.COLOR_MODE_ECM_2:
                                color =
                                    (((patternByte & bit) >> (7 - pixelOffset)) |
                                    (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - pixelOffset)) << 1)) +
                                    ((tileAttributeByte & 0x0f) << 2);
                                break;
                            case F18A.COLOR_MODE_ECM_3:
                                color =
                                    (((patternByte & bit) >> (7 - pixelOffset)) |
                                    (((this.ram[(patternAddr + this.tilePlaneOffset) & 0x3fff] & bit) >> (7 - pixelOffset)) << 1) |
                                    (((this.ram[(patternAddr + (this.tilePlaneOffset << 1)) & 0x3fff] & bit) >> (7 - pixelOffset)) << 2)) +
                                    ((tileAttributeByte & 0x0e) << 2);
                                break;
                        }
                        break;
                    case F18A.MODE_BITMAP:
                        name = rowNameOffset + (x >> 3);
                        tableOffset = baseTableOffset + (name << 3);
                        colorByte = ram[colorTable + (tableOffset & colorTableMask) + lineOffset];
                        patternByte = ram[charPatternTable + (tableOffset & patternTableMask) + lineOffset];
                        color = (patternByte & (0x80 >> (x & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case F18A.MODE_TEXT:
                        name = rowNameOffset + (x >> 3);
                        patternByte = ram[charPatternTable + (name << 3) + lineOffset];
                        if (pixelOffset < 6) {
                            color = (patternByte & (0x80 >> pixelOffset)) !== 0 ? fgColor : bgColor;
                        } else {
                            color = bgColor;
                        }
                        break;
                }
                rgbColor = palette[color];
                imageDataData[imageDataAddr++] = rgbColor[0]; // R
                imageDataData[imageDataAddr++] = rgbColor[1]; // G
                imageDataData[imageDataAddr++] = rgbColor[2]; // B
                imageDataData[imageDataAddr++] = 255; // Alpha
                if (gap && pixelOffset === 7) {
                    imageDataAddr += 4;
                }
            }
            if (gap && lineOffset === 7) {
                imageDataAddr += width * 4;
            }
        }
        canvasContext.putImageData(imageData, 0, 0);
    }

    drawSpritePatternImage(canvas: HTMLCanvasElement, gap: boolean) {
        const
            baseWidth = 256,
            width = canvas.width = baseWidth + (gap ? 16 : 0),
            baseHeight = 64,
            height = canvas.height = baseHeight + (gap ? 4 : 0),
            canvasContext = canvas.getContext("2d"),
            imageData = canvasContext.createImageData(width, height),
            ram = this.ram,
            spritePatternTable = this.spritePatternTable,
            spriteAttributeTable = this.spriteAttributeTable,
            spriteColorMode = this.spriteColorMode,
            spritePaletteSelect = this.spritePaletteSelect,
            spritePlaneOffset = this.spritePlaneOffset,
            drawHeight = this.drawHeight - (this.realSpriteYCoord ? 0 : 1),
            maxSpriteAttrAddr = (this.maxSprites << 2),
            row30: boolean = this.row30Enabled,
            palette = this.palette,
            patternColorMap = this.spritePatternColorMap,
            imageDataData = imageData.data;
        let
            pattern: number,
            patternAddr: number,
            patternByte: number,
            patternByte1: number,
            patternByte2: number,
            rowPatternOffset: number,
            lineOffset: number,
            pixelOffset: number,
            bit: number,
            bitShift: number,
            baseColor: number,
            paletteBaseIndex: number,
            color: number,
            pixelOn: boolean,
            colorMapEntry: {paletteBaseIndex: number, baseColor: number},
            rgbColor: number[],
            imageDataAddr = 0;
        for (let i = 0; (row30 || ram[spriteAttributeTable + i] !== 0xd0) && i < maxSpriteAttrAddr; i += 4) {
            if (ram[spriteAttributeTable + i] < drawHeight) {
                baseColor = ram[spriteAttributeTable + i + 3] & 0x0f;
                paletteBaseIndex = 0;
                switch (spriteColorMode) {
                    case F18A.COLOR_MODE_NORMAL:
                        paletteBaseIndex = spritePaletteSelect;
                        break;
                    case F18A.COLOR_MODE_ECM_1:
                        paletteBaseIndex = (spritePaletteSelect & 0x20) | (baseColor << 1);
                        break;
                    case F18A.COLOR_MODE_ECM_2:
                        paletteBaseIndex = (baseColor << 2);
                        break;
                    case F18A.COLOR_MODE_ECM_3:
                        paletteBaseIndex = ((baseColor & 0x0e) << 2);
                        break;
                }
                pattern = ram[spriteAttributeTable + i + 2];
                patternColorMap[pattern] = {paletteBaseIndex: paletteBaseIndex, baseColor: baseColor};
            }
        }
        for (let y = 0; y < baseHeight; y++) {
            rowPatternOffset = ((y >> 4) << 6) + ((y & 8) >> 3);
            lineOffset = y & 7;
            for (let x = 0; x < baseWidth; x++) {
                pixelOffset = x & 7;
                bitShift = 7 - pixelOffset;
                bit = 0x80 >> pixelOffset;
                pattern = rowPatternOffset + ((x >> 3) << 1);
                patternAddr = spritePatternTable + (pattern << 3) + lineOffset;
                patternByte = ram[patternAddr];
                patternByte1 = ram[(patternAddr + spritePlaneOffset) & 0x3fff];
                patternByte2 = ram[(patternAddr + (spritePlaneOffset << 1)) & 0x3fff];
                color = 0;
                colorMapEntry = patternColorMap[pattern & 0xfc];
                switch (spriteColorMode) {
                    case F18A.COLOR_MODE_NORMAL:
                        pixelOn = (patternByte & bit) !== 0;
                        if (pixelOn && colorMapEntry) {
                            color = colorMapEntry.baseColor;
                        }
                        break;
                    case F18A.COLOR_MODE_ECM_1:
                        color = (patternByte & bit) >> bitShift;
                        break;
                    case F18A.COLOR_MODE_ECM_2:
                        color =
                            ((patternByte & bit) >> bitShift) |
                            (((patternByte1 & bit) >> bitShift) << 1);
                        break;
                    case F18A.COLOR_MODE_ECM_3:
                        color =
                            ((patternByte & bit) >> bitShift) |
                            (((patternByte1 & bit) >> bitShift) << 1) |
                            (((patternByte2 & bit) >> bitShift) << 2);
                        break;
                }
                if (color || pixelOn) {
                    if (colorMapEntry) {
                        rgbColor = palette[color + colorMapEntry.paletteBaseIndex];
                    } else {
                        rgbColor = palette[color + spritePaletteSelect];
                    }
                } else {
                   rgbColor = [224, 224, 255];
                }
                imageDataData[imageDataAddr++] = rgbColor[0]; // R
                imageDataData[imageDataAddr++] = rgbColor[1]; // G
                imageDataData[imageDataAddr++] = rgbColor[2]; // B
                imageDataData[imageDataAddr++] = 255; // Alpha
                if (gap && pixelOffset === 7 && (x & 8) === 8) {
                    imageDataAddr += 4;
                }
            }
            if (gap && lineOffset === 7 && (y & 8) === 8) {
                imageDataAddr += width * 4;
            }
        }
        canvasContext.putImageData(imageData, 0, 0);
    }

    getState() {
        return {
            ram: this.ram,
            registers: this.registers,
            addressRegister: this.addressRegister,
            statusRegister: this.statusRegister,
            palette: this.palette,
            latch: this.latch,
            prefetchByte: this.prefetchByte,
            addressIncrement: this.addressIncrement,
            unlocked: this.unlocked,
            statusRegisterNo: this.statusRegisterNo,
            dataPortMode: this.dataPortMode,
            autoIncPaletteReg: this.autoIncPaletteReg,
            paletteRegisterNo: this.paletteRegisterNo,
            paletteRegisterData: this.paletteRegisterData,
            currentScanline: this.currentScanline,
            blanking: this.blanking,
            displayOn: this.displayOn,
            interruptsOn: this.interruptsOn,
            screenMode: this.screenMode,
            colorTable: this.colorTable,
            nameTable: this.nameTable,
            charPatternTable: this.charPatternTable,
            spriteAttributeTable: this.spriteAttributeTable,
            spritePatternTable: this.spritePatternTable,
            colorTableMask: this.colorTableMask,
            patternTableMask: this.patternTableMask,
            fgColor: this.fgColor,
            bgColor: this.bgColor,
            spriteSize: this.spriteSize,
            spriteMag: this.spriteMag,
            tileColorMode: this.tileColorMode,
            tilePaletteSelect1: this.tilePaletteSelect1,
            tilePaletteSelect2: this.tilePaletteSelect2,
            spriteColorMode: this.spriteColorMode,
            spritePaletteSelect: this.spritePaletteSelect,
            realSpriteYCoord: this.realSpriteYCoord,
            colorTable2: this.colorTable2,
            nameTable2: this.nameTable2,
            tileLayer1Enabled: this.tileLayer1Enabled,
            tileLayer2Enabled: this.tileLayer2Enabled,
            row30Enabled: this.row30Enabled,
            spriteLinkingEnabled: this.spriteLinkingEnabled,
            hScroll1: this.hScroll1,
            vScroll1: this.vScroll1,
            hScroll2: this.hScroll2,
            vScroll2: this.vScroll2,
            hPageSize1: this.hPageSize1,
            vPageSize1: this.vPageSize1,
            hPageSize2: this.hPageSize2,
            vPageSize2: this.vPageSize2,
            bitmapEnable: this.bitmapEnable,
            bitmapPriority: this.bitmapPriority,
            bitmapTransparent: this.bitmapTransparent,
            bitmapFat: this.bitmapFat,
            bitmapPaletteSelect: this.bitmapPaletteSelect,
            bitmapBaseAddr: this.bitmapBaseAddr,
            bitmapX: this.bitmapX,
            bitmapY: this.bitmapY,
            bitmapWidth: this.bitmapWidth,
            bitmapHeight: this.bitmapHeight,
            interruptScanline: this.interruptScanline,
            maxScanlineSprites: this.maxScanlineSprites,
            maxSprites: this.maxSprites,
            tileMap2AlwaysOnTop: this.tileMap2AlwaysOnTop,
            ecmPositionAttributes: this.ecmPositionAttributes,
            reportMax: this.reportMax,
            scanLines: this.scanLines,
            gpuHsyncTrigger: this.gpuHsyncTrigger,
            gpuVsyncTrigger: this.gpuVsyncTrigger,
            spritePlaneOffset: this.spritePlaneOffset,
            tilePlaneOffset: this.tilePlaneOffset,
            counterElapsed: this.counterElapsed,
            counterStart: this.counterStart,
            counterSnap: this.counterSnap,
            collision: this.collision,
            fifthSprite: this.fifthSprite,
            fifthSpriteIndex: this.fifthSpriteIndex,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            drawWidth: this.drawWidth,
            drawHeight: this.drawHeight,
            leftBorder: this.leftBorder,
            topBorder: this.topBorder,
            frameCounter: this.frameCounter,
            lastTime: this.lastTime,
            gpu: this.gpu.getState()
        };
    }

    restoreState(state) {
        this.ram = state.ram;
        this.registers = state.registers;
        this.addressRegister = state.addressRegister;
        this.statusRegister = state.statusRegister;
        this.palette = state.palette;
        this.latch = state.latch;
        this.prefetchByte = state.prefetchByte;
        this.addressIncrement = state.addressIncrement;
        this.unlocked = state.unlocked;
        this.statusRegisterNo = state.statusRegisterNo;
        this.dataPortMode = state.dataPortMode;
        this.autoIncPaletteReg = state.autoIncPaletteReg;
        this.paletteRegisterNo = state.paletteRegisterNo;
        this.paletteRegisterData = state.paletteRegisterData;
        this.currentScanline = state.currentScanline;
        this.blanking = state.blanking;
        this.displayOn = state.displayOn;
        this.interruptsOn = state.interruptsOn;
        this.screenMode = state.screenMode;
        this.colorTable = state.colorTable;
        this.nameTable = state.nameTable;
        this.charPatternTable = state.charPatternTable;
        this.spriteAttributeTable = state.spriteAttributeTable;
        this.spritePatternTable = state.spritePatternTable;
        this.colorTableMask = state.colorTableMask;
        this.patternTableMask = state.patternTableMask;
        this.fgColor = state.fgColor;
        this.bgColor = state.bgColor;
        this.spriteSize = state.spriteSize;
        this.spriteMag = state.spriteMag;
        this.tileColorMode = state.tileColorMode;
        this.tilePaletteSelect1 = state.tilePaletteSelect1;
        this.tilePaletteSelect2 = state.tilePaletteSelect2;
        this.spriteColorMode = state.spriteColorMode;
        this.spritePaletteSelect = state.spritePaletteSelect;
        this.realSpriteYCoord = state.realSpriteYCoord;
        this.colorTable2 = state.colorTable2;
        this.nameTable2 = state.nameTable2;
        this.tileLayer1Enabled = state.tileLayer1Enabled;
        this.tileLayer2Enabled = state.tileLayer2Enabled;
        this.row30Enabled = state.row30Enabled;
        this.spriteLinkingEnabled = state.spriteLinkingEnabled;
        this.hScroll1 = state.hScroll1;
        this.vScroll1 = state.vScroll1;
        this.hScroll2 = state.hScroll2;
        this.vScroll2 = state.vScroll2;
        this.hPageSize1 = state.hPageSize1;
        this.vPageSize1 = state.vPageSize1;
        this.hPageSize2 = state.hPageSize2;
        this.vPageSize2 = state.vPageSize2;
        this.bitmapEnable = state.bitmapEnable;
        this.bitmapPriority = state.bitmapPriority;
        this.bitmapTransparent = state.bitmapTransparent;
        this.bitmapFat = state.bitmapFat;
        this.bitmapPaletteSelect = state.bitmapPaletteSelect;
        this.bitmapBaseAddr = state.bitmapBaseAddr;
        this.bitmapX = state.bitmapX;
        this.bitmapY = state.bitmapY;
        this.bitmapWidth = state.bitmapWidth;
        this.bitmapHeight = state.bitmapHeight;
        this.interruptScanline = state.interruptScanline;
        this.maxScanlineSprites = state.maxScanlineSprites;
        this.maxSprites = state.maxSprites;
        this.tileMap2AlwaysOnTop = state.tileMap2AlwaysOnTop;
        this.ecmPositionAttributes = state.ecmPositionAttributes;
        this.reportMax = state.reportMax;
        this.scanLines = state.scanLines;
        this.gpuHsyncTrigger = state.gpuHsyncTrigger;
        this.gpuVsyncTrigger = state.gpuVsyncTrigger;
        this.spritePlaneOffset = state.spritePlaneOffset;
        this.tilePlaneOffset = state.tilePlaneOffset;
        this.counterElapsed = state.counterElapsed;
        this.counterStart = state.counterStart;
        this.counterSnap = state.counterSnap;
        this.collision = state.collision;
        this.fifthSprite = state.fifthSprite;
        this.fifthSpriteIndex = state.fifthSpriteIndex;
        this.canvasWidth = state.canvasWidth;
        this.canvasHeight = state.canvasHeight;
        this.drawWidth = state.drawWidth;
        this.drawHeight = state.drawHeight;
        this.leftBorder = state.leftBorder;
        this.topBorder = state.topBorder;
        this.frameCounter = state.frameCounter;
        this.lastTime = state.lastTime;
        this.gpu.restoreState(state.gpu);
        this.setDimensions(true);
    }
}
