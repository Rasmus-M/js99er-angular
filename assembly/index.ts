const MODE_GRAPHICS = 0;
const MODE_TEXT = 1;
const MODE_BITMAP = 2;
const MODE_MULTICOLOR = 3;
const MODE_BITMAP_TEXT = 4;
const MODE_BITMAP_MULTICOLOR = 5;
const MODE_ILLEGAL = 6;

const vdpRAMAddr = 0x0000;
const paletteAddr = 0x4000;
const scanlineColorBufferAddr = 0x5000;
const spriteBufferAddr = 0x6000;

export function drawScanline(
    y: i32,
    width: i32,
    height: i32,
    screenMode: i32,
    textMode: bool,
    bitmapMode: bool,
    fgColor: i32,
    bgColor: i32,
    nameTable: i32,
    colorTable: i32,
    charPatternTable: i32,
    colorTableMask: i32,
    patternTableMask: i32,
    spriteAttributeTable: i32,
    spritePatternTable: i32,
    vr1: i32,
    vr4: i32,
    displayOn: bool,
    statusRegister: u8
): u8 {
    const
        drawWidth: i32 = !textMode ? 256 : 240,
        drawHeight: i32 = 192,
        hBorder: i32 = (width - drawWidth) >> 1,
        vBorder: i32 = (height - drawHeight) >> 1,
        spriteSize: bool = (vr1 & 0x2) !== 0,
        spriteMagnify: i32 = vr1 & 0x1,
        spriteDimension: i32 = (spriteSize ? 16 : 8) << (spriteMagnify ? 1 : 0),
        maxSpritesOnLine: i32 = 4;
    let
        imageDataAddr: i32 = 0,
        collision: bool = false,
        fifthSprite: bool = false,
        fifthSpriteIndex: i32 = 31,
        x: i32,
        color: i32 = 0,
        rgbColor: u32,
        name: i32,
        tableOffset: i32,
        colorByte: i32,
        patternByte: i32;

    if (y >= vBorder && y < vBorder + drawHeight && displayOn) {
        const y1: i32 = y - vBorder;
        // Pre-process sprites
        if (!textMode) {
            initSpriteBuffer();
            let spritesOnLine: i32 = 0;
            let endMarkerFound: bool = false;
            let spriteAttributeAddr: i32 = spriteAttributeTable;
            let s: i32;
            for (s = 0; s < 32 && spritesOnLine <= maxSpritesOnLine && !endMarkerFound; s++) {
                let sy: i32 = getRAMByte(spriteAttributeAddr);
                if (sy !== 0xD0) {
                    if (sy > 0xD0) {
                        sy -= 256;
                    }
                    sy++;
                    const sy1: i32 = sy + spriteDimension;
                    let y2: i32 = -1;
                    if (s < 8 || !bitmapMode || (vr4 & 0x03) === 3) {
                        if (y1 >= sy && y1 < sy1) {
                            y2 = y1;
                        }
                    } else {
                        // Emulate sprite duplication bug
                        const yMasked: i32 = (y1 - 1) & (((vr4 & 0x03) << 6) | 0x3F);
                        if (yMasked >= sy && yMasked < sy1) {
                            y2 = yMasked;
                        } else if (y1 >= 64 && y1 < 128 && y1 >= sy && y1 < sy1) {
                            y2 = y1;
                        }
                    }
                    if (y2 !== -1) {
                        if (spritesOnLine < maxSpritesOnLine) {
                            let sx: i32 = getRAMByte(spriteAttributeAddr + 1);
                            const sPatternNo: i32 = getRAMByte(spriteAttributeAddr + 2) & (spriteSize ? 0xFC : 0xFF);
                            const sColor: i32 = getRAMByte(spriteAttributeAddr + 3) & 0x0F;
                            if ((getRAMByte(spriteAttributeAddr + 3) & 0x80) !== 0) {
                                sx -= 32;
                            }
                            const sLine: i32 = (y2 - sy) >> spriteMagnify;
                            const sPatternBase: i32 = spritePatternTable + (sPatternNo << 3) + sLine;
                            for (let sx1: i32 = 0; sx1 < spriteDimension; sx1++) {
                                const sx2: i32 = sx + sx1;
                                if (sx2 >= 0 && sx2 < drawWidth) {
                                    const sx3: i32 = sx1 >> spriteMagnify;
                                    const sPatternByte: i32 = getRAMByte(sPatternBase + (sx3 >= 8 ? 16 : 0));
                                    if ((sPatternByte & (0x80 >> (sx3 & 0x07))) !== 0) {
                                        if (getSpriteBuffer(sx2) === -1) {
                                            setSpriteBuffer(sx2, sColor);
                                        } else {
                                            collision = true;
                                        }
                                    }
                                }
                            }
                        }
                        spritesOnLine++;
                    }
                    spriteAttributeAddr += 4;
                } else {
                    endMarkerFound = true;
                }
            }
            if (spritesOnLine > 4) {
                fifthSprite = true;
                fifthSpriteIndex = s;
            }
        }
        // Draw
        const rowOffset: i32 = !textMode ? (y1 >> 3) << 5 : (y1 >> 3) * 40;
        let lineOffset: i32 = y1 & 7;
        for (x = 0; x < width; x++) {
            if (x >= hBorder && x < hBorder + drawWidth) {
                const x1: i32 = x - hBorder;
                // Tiles
                switch (screenMode) {
                    case MODE_GRAPHICS:
                        name = getRAMByte(nameTable + rowOffset + (x1 >> 3));
                        colorByte = getRAMByte(colorTable + (name >> 3));
                        patternByte = getRAMByte(charPatternTable + (name << 3) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case MODE_BITMAP:
                        name = getRAMByte(nameTable + rowOffset + (x1 >> 3));
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        colorByte = getRAMByte(colorTable + (tableOffset & colorTableMask) + lineOffset);
                        patternByte = getRAMByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case MODE_MULTICOLOR:
                        name = getRAMByte(nameTable + rowOffset + (x1 >> 3));
                        lineOffset = (y1 & 0x1C) >> 2;
                        patternByte = getRAMByte(charPatternTable + (name << 3) + lineOffset);
                        color = (x1 & 4) === 0 ? (patternByte & 0xF0) >> 4 : patternByte & 0x0F;
                        break;
                    case MODE_TEXT:
                        name = getRAMByte(nameTable + rowOffset + x1 / 6);
                        patternByte = getRAMByte(charPatternTable + (name << 3) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 % 6))) !== 0 ? fgColor : bgColor;
                        break;
                    case MODE_BITMAP_TEXT:
                        name = getRAMByte(nameTable + rowOffset + x1 / 6);
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        patternByte = getRAMByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 % 6))) !== 0 ? fgColor : bgColor;
                        break;
                    case MODE_BITMAP_MULTICOLOR:
                        name = getRAMByte(nameTable + rowOffset + (x1 >> 3));
                        lineOffset = (y1 & 0x1C) >> 2;
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        patternByte = getRAMByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
                        color = (x1 & 4) === 0 ? (patternByte & 0xF0) >> 4 : patternByte & 0x0F;
                        break;
                    case MODE_ILLEGAL:
                        color = (x1 & 4) === 0 ? fgColor : bgColor;
                        break;
                }
                if (color === 0) {
                    color = bgColor;
                }
                // Sprites
                if (!textMode) {
                    const spriteColor: i32 = getSpriteBuffer(x1);
                    if (spriteColor > 0) {
                        color = spriteColor;
                    }
                }
            } else {
                color = bgColor;
            }
            rgbColor = getColor(color);
            setImageData(imageDataAddr++, rgbColor);
        }
    } else {
        // Top/bottom border
        rgbColor = getColor(bgColor);
        for (x = 0; x < width; x++) {
            setImageData(imageDataAddr++, rgbColor);
        }
    }
    if (y === vBorder + drawHeight) {
        statusRegister |= 0x80;
    }
    if (collision) {
        statusRegister |= 0x20;
    }
    if ((statusRegister & 0x40) === 0) {
        statusRegister |= <u8>fifthSpriteIndex;
    }
    if (fifthSprite) {
        statusRegister |= 0x40;
    }
    return statusRegister;
}

// @ts-ignore
@inline
function getRAMByte(addr: i32): u8 {
    return load<u8>(vdpRAMAddr + addr);
}

// @ts-ignore
@inline
function getColor(i: i32): u32 {
    return load<u32>(paletteAddr + (i << 2));
}

function initSpriteBuffer(): void {
    memory.fill(spriteBufferAddr, 0xff, 256 << 2);
}

// @ts-ignore
@Inline
function setSpriteBuffer(offset: i32, value: i32): void {
    store<i32>(spriteBufferAddr + (offset << 2), value);
}

// @ts-ignore
@inline
function getSpriteBuffer(offset: i32): i32 {
    return load<i32>(spriteBufferAddr + (offset << 2));
}

// @ts-ignore
@inline
function setImageData(addr: i32, value: u32): void {
    store<u32>(scanlineColorBufferAddr + (addr << 2), value);
}
