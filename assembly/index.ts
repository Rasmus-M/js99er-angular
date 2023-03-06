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
        MODE_GRAPHICS = 0,
        MODE_TEXT = 1,
        MODE_BITMAP = 2,
        MODE_MULTICOLOR = 3,
        MODE_BITMAP_TEXT = 4,
        MODE_BITMAP_MULTICOLOR = 5,
        MODE_ILLEGAL = 6,
        drawWidth = !textMode ? 256 : 240,
        drawHeight = 192,
        hBorder = (width - drawWidth) >> 1,
        vBorder = (height - drawHeight) >> 1,
        spriteSize: bool = (vr1 & 0x2) !== 0,
        spriteMagnify = vr1 & 0x1,
        spriteDimension = (spriteSize ? 16 : 8) << (spriteMagnify ? 1 : 0),
        maxSpritesOnLine = 4;
    let
        imageDataAddr: i32 = 0,
        collision = false,
        fifthSprite = false,
        fifthSpriteIndex = 31,
        x: i32,
        color: i32 = 0,
        rgbColor: u32,
        name: i32,
        tableOffset: i32,
        colorByte: i32,
        patternByte: i32;
    if (y >= vBorder && y < vBorder + drawHeight && displayOn) {
        const y1 = y - vBorder;
        // Pre-process sprites
        if (!textMode) {
            initSpriteBuffer();
            let spritesOnLine = 0;
            let endMarkerFound = false;
            let spriteAttributeAddr = spriteAttributeTable;
            let s: i32;
            for (s = 0; s < 32 && spritesOnLine <= maxSpritesOnLine && !endMarkerFound; s++) {
                let sy = <i32>ramByte(spriteAttributeAddr);
                if (sy !== 0xD0) {
                    if (sy > 0xD0) {
                        sy -= 256;
                    }
                    sy++;
                    const sy1 = sy + spriteDimension;
                    let y2 = -1;
                    if (s < 8 || !bitmapMode || (vr4 & 0x03) === 3) {
                        if (y1 >= sy && y1 < sy1) {
                            y2 = y1;
                        }
                    } else {
                        // Emulate sprite duplication bug
                        const yMasked = (y1 - 1) & (((vr4 & 0x03) << 6) | 0x3F);
                        if (yMasked >= sy && yMasked < sy1) {
                            y2 = yMasked;
                        } else if (y1 >= 64 && y1 < 128 && y1 >= sy && y1 < sy1) {
                            y2 = y1;
                        }
                    }
                    if (y2 !== -1) {
                        if (spritesOnLine < maxSpritesOnLine) {
                            let sx = ramByte(spriteAttributeAddr + 1);
                            const sPatternNo = ramByte(spriteAttributeAddr + 2) & (spriteSize ? 0xFC : 0xFF);
                            const sColor = ramByte(spriteAttributeAddr + 3) & 0x0F;
                            if ((ramByte(spriteAttributeAddr + 3) & 0x80) !== 0) {
                                sx -= 32;
                            }
                            const sLine = (y2 - sy) >> spriteMagnify;
                            const sPatternBase = spritePatternTable + (sPatternNo << 3) + sLine;
                            for (let sx1 = 0; sx1 < spriteDimension; sx1++) {
                                const sx2 = sx + sx1;
                                if (sx2 >= 0 && sx2 < drawWidth) {
                                    const sx3 = sx1 >> spriteMagnify;
                                    const sPatternByte = ramByte(sPatternBase + (sx3 >= 8 ? 16 : 0));
                                    if ((sPatternByte & (0x80 >> (<u8>sx3 & 0x07))) !== 0) {
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
        const rowOffset = !textMode ? (y1 >> 3) << 5 : (y1 >> 3) * 40;
        let lineOffset = y1 & 7;
        for (x = 0; x < width; x++) {
            if (x >= hBorder && x < hBorder + drawWidth) {
                const x1 = x - hBorder;
                // Tiles
                switch (screenMode) {
                    case MODE_GRAPHICS:
                        name = ramByte(nameTable + rowOffset + (x1 >> 3));
                        colorByte = ramByte(colorTable + (name >> 3));
                        patternByte = ramByte(charPatternTable + (name << 3) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case MODE_BITMAP:
                        name = ramByte(nameTable + rowOffset + (x1 >> 3));
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        colorByte = ramByte(colorTable + (tableOffset & colorTableMask) + lineOffset);
                        patternByte = ramByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case MODE_MULTICOLOR:
                        name = ramByte(nameTable + rowOffset + (x1 >> 3));
                        lineOffset = (y1 & 0x1C) >> 2;
                        patternByte = ramByte(charPatternTable + (name << 3) + lineOffset);
                        color = (x1 & 4) === 0 ? (patternByte & 0xF0) >> 4 : patternByte & 0x0F;
                        break;
                    case MODE_TEXT:
                        name = ramByte(nameTable + rowOffset + x1 / 6);
                        patternByte = ramByte(charPatternTable + (name << 3) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 % 6))) !== 0 ? fgColor : bgColor;
                        break;
                    case MODE_BITMAP_TEXT:
                        name = ramByte(nameTable + rowOffset + x1 / 6);
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        patternByte = ramByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
                        color = (patternByte & (0x80 >> (x1 % 6))) !== 0 ? fgColor : bgColor;
                        break;
                    case MODE_BITMAP_MULTICOLOR:
                        name = ramByte(nameTable + rowOffset + (x1 >> 3));
                        lineOffset = (y1 & 0x1C) >> 2;
                        tableOffset = ((y1 & 0xC0) << 5) + (name << 3);
                        patternByte = ramByte(charPatternTable + (tableOffset & patternTableMask) + lineOffset);
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
                    const spriteColor = getSpriteBuffer(x1);
                    if (spriteColor > 0) {
                        color = spriteColor;
                    }
                }
            } else {
                color = bgColor;
            }
            rgbColor = getColor(color);
            setImageData(imageDataAddr++, <u8>((rgbColor & 0xff0000) >> 16)); // R
            setImageData(imageDataAddr++, <u8>((rgbColor & 0x00ff00) >> 8)); // G
            setImageData(imageDataAddr++, <u8>(rgbColor & 0x0000ff)); // B
            setImageData(imageDataAddr++, 0xff); // alpha
        }
    } else {
        // Top/bottom border
        rgbColor = getColor(bgColor);
        for (x = 0; x < width; x++) {
            setImageData(imageDataAddr++, <u8>((rgbColor & 0xff0000) >> 16)); // R
            setImageData(imageDataAddr++, <u8>((rgbColor & 0x00ff00) >> 8)); // G
            setImageData(imageDataAddr++, <u8>(rgbColor & 0x0000ff)); // B
            setImageData(imageDataAddr++, 0xff); // alpha
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

function initSpriteBuffer(): void {
    for (let i = 0; i < 256; i++) {
        store<i8>(0x6000 + i, -1);
    }
}

// @ts-ignore
@Inline
function setSpriteBuffer(offset: i32, value: i8): void {
    store<i8>(0x6000 + offset, value);
}

// @ts-ignore
@inline
function getSpriteBuffer(offset: i32): i8 {
    return load<i8>(0x6000 + offset);
}

// @ts-ignore
@inline
function ramByte(addr: i32): u8 {
    return load<u8>(addr);
}

// @ts-ignore
@inline
function setImageData(addr: i32, value: u8): void {
    store<u8>(addr + 0x4000, value);
}

function getColor(i: i32): u32 {
    switch (i & 15) {
        case 0:
            return 0x000000;
        case 1:
            return 0x000000;
        case 2:
            return 0x21c842;
        case 3:
            return 0x5edc78;
        case 4:
            return 0x5455ed;
        case 5:
            return 0x7d76fc;
        case 6:
            return 0xd4524d;
        case 7:
            return 0x42ebf5;
        case 8:
            return 0xfc5554;
        case 9:
            return 0xff7978;
        case 10:
            return 0xd4c154;
        case 11:
            return 0xe6ce80;
        case 12:
            return 0x21b03b;
        case 13:
            return 0xc95bba;
        case 14:
            return 0xcccccc;
        case 15:
            return 0xffffff;
    }
    return 0;
}
