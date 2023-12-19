const MODE_GRAPHICS = 0;
const MODE_TEXT = 1;
const MODE_TEXT_80 = 2;
const MODE_BITMAP = 3;
const MODE_MULTICOLOR = 4;

const COLOR_MODE_NORMAL = 0;
const COLOR_MODE_ECM_1 = 1;
const COLOR_MODE_ECM_2 = 2;
const COLOR_MODE_ECM_3 = 3;

const vdpRAMAddr = 0x0000;
const paletteAddr = 0x4000;
const scanlineColorBufferAddr = 0x5000;
const spriteBufferAddr = 0x6000;

export function drawScanline(
    y: i32
) {
    const imageData = imageDataData;
    let imageDataAddr = imageDataAddr;
    if (displayOn && y >= topBorder && y < topBorder + drawHeight) {
        y -= topBorder;
        // Prepare sprites
        let spriteColorBuffer: Uint8Array, spritePaletteBaseIndexBuffer: Uint8Array;
        if (unlocked || (screenMode !== MODE_TEXT && screenMode !== MODE_TEXT_80)) {
            spriteColorBuffer = new Uint8Array(drawWidth);
            spritePaletteBaseIndexBuffer = new Uint8Array(drawWidth);
            prepareSprites(y, spriteColorBuffer, spritePaletteBaseIndexBuffer);
        }
        let scrollWidth = drawWidth;
        const scrollHeight = drawHeight;
        // Border in text modes
        const borderWidth = screenMode === MODE_TEXT ? 8 : (screenMode === MODE_TEXT_80 ? 16 : 0);
        scrollWidth -= (borderWidth << 1);
        // Prepare values for Tile layer 1
        const nameTableCanonicalBase = vPageSize1 ? nameTable & 0x3000 : (hPageSize1 ? nameTable & 0x3800 : nameTable);
        let nameTableBaseAddr = nameTable;
        let y1 = y + vScroll1;
        if (y1 >= scrollHeight) {
            y1 -= scrollHeight;
            nameTableBaseAddr ^= vPageSize1;
        }
        let rowOffset;
        switch (screenMode) {
            case MODE_GRAPHICS:
            case MODE_BITMAP:
            case MODE_MULTICOLOR:
                rowOffset = (y1 >> 3) << 5;
                break;
            case MODE_TEXT:
                rowOffset = (y1 >> 3) * 40;
                break;
            case MODE_TEXT_80:
                rowOffset = (y1 >> 3) * 80;
                break;
        }
        const lineOffset = y1 & 7;
        // Prepare values for Tile layer 2
        let rowOffset2, nameTableCanonicalBase2, nameTableBaseAddr2, lineOffset2, y12;
        if (tileLayer2Enabled) {
            nameTableCanonicalBase2 = vPageSize2 ? nameTable2 & 0x3000 : (hPageSize2 ? nameTable2 & 0x3800 : nameTable2);
            nameTableBaseAddr2 = nameTable2;
            y12 = y + vScroll2;
            if (y12 >= scrollHeight) {
                y12 -= scrollHeight;
                nameTableBaseAddr2 ^= vPageSize2;
            }
            switch (screenMode) {
                case MODE_GRAPHICS:
                case MODE_BITMAP:
                case MODE_MULTICOLOR:
                    rowOffset2 = (y12 >> 3) << 5;
                    break;
                case MODE_TEXT:
                    rowOffset2 = (y12 >> 3) * 40;
                    break;
                case MODE_TEXT_80:
                    rowOffset2 = (y12 >> 3) * 80;
                    break;
            }
            lineOffset2 = y12 & 7;
        }
        // Prepare values for Bitmap layer
        let bitmapX2, bitmapY1, bitmapY2, bitmapYOffset;
        if (bitmapEnable) {
            bitmapX2 = bitmapX + bitmapWidth;
            bitmapY1 = y - bitmapY;
            bitmapY2 = bitmapY + bitmapHeight;
            bitmapYOffset = bitmapY1 * bitmapWidth;
        }
        // Prepare values for sprite layer
        const spritesEnabled = unlocked || (screenMode !== MODE_TEXT && screenMode !== MODE_TEXT_80);
        // Draw line
        for (let xc = 0; xc < canvasWidth; xc++) {
            // Draw pixel
            let color = bgColor;
            let paletteBaseIndex = 0;
            if (xc >= leftBorder && xc < leftBorder + drawWidth) {
                const x = xc - leftBorder;
                let havePixel = false,
                    tilePriority = false;
                // Tile layer 1
                if (tileLayer1Enabled) {
                    const {tilePriority: tilePriority1, transparentColor0: transparentColor01, color: tileColor1, paletteBaseIndex: tilePaletteBaseIndex1} =
                        drawTileLayer(x, y, y1, rowOffset, lineOffset, nameTableCanonicalBase, nameTableBaseAddr, colorTable, borderWidth, scrollWidth, hScroll1, hPageSize1, tilePaletteSelect1);
                    if (tileColor1 > 0 || !transparentColor01) {
                        color = tileColor1;
                        paletteBaseIndex = tilePaletteBaseIndex1;
                        tilePriority = tilePriority1;
                        havePixel = true;
                    }
                }
                // Tile layer 2
                if (tileLayer2Enabled) {
                    const {tilePriority: tilePriority2, transparentColor0: transparentColor02, color: tileColor2, paletteBaseIndex: tilePaletteBaseIndex2} =
                        drawTileLayer(x, y, y1, rowOffset2, lineOffset2, nameTableCanonicalBase2, nameTableBaseAddr2, colorTable2, borderWidth, scrollWidth, hScroll2, hPageSize2, tilePaletteSelect2);
                    if (tileColor2 > 0 || !transparentColor02) {
                        color = tileColor2;
                        paletteBaseIndex = tilePaletteBaseIndex2;
                        tilePriority = tilePriority2 || tileMap2AlwaysOnTop;
                        havePixel = true;
                    }
                }
                // Bitmap layer
                if (bitmapEnable) {
                    const bmpX = screenMode !== MODE_TEXT_80 ? x : x >> 1;
                    if (bmpX >= bitmapX && bmpX < bitmapX2 && y >= bitmapY && y < bitmapY2) {
                        const bitmapX1 = x - bitmapX;
                        const bitmapPixelOffset = bitmapX1 + bitmapYOffset;
                        const bitmapByte = ram[bitmapBaseAddr + (bitmapPixelOffset >> 2)];
                        let bitmapBitShift, bitmapColor;
                        if (bitmapFat) {
                            // 16 color bitmap with fat pixels
                            bitmapBitShift = (2 - (bitmapPixelOffset & 2)) << 1;
                            bitmapColor = (bitmapByte >> bitmapBitShift) & 0x0F;
                        } else {
                            // 4 color bitmap
                            bitmapBitShift = (3 - (bitmapPixelOffset & 3)) << 1;
                            bitmapColor = (bitmapByte >> bitmapBitShift) & 0x03;
                        }
                        if ((bitmapColor > 0 || !bitmapTransparent) && (bitmapPriority || !havePixel)) {
                            color = bitmapColor;
                            paletteBaseIndex = bitmapPaletteSelect;
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
            const rgbColor = palette[color + paletteBaseIndex];
            imageData[imageDataAddr++] = rgbColor[0];
            imageData[imageDataAddr++] = rgbColor[1];
            imageData[imageDataAddr++] = rgbColor[2];
            imageDataAddr++;
        }
    } else {
        // Empty scanline
        const rgbColor = palette[bgColor];
        for (let xc = 0; xc < canvasWidth; xc++) {
            imageData[imageDataAddr++] = rgbColor[0]; // R
            imageData[imageDataAddr++] = rgbColor[1]; // G
            imageData[imageDataAddr++] = rgbColor[2]; // B
            imageDataAddr++; // Skip alpha
        }
    }
    if (scanLines && (y & 1) !== 0) {
        // Dim last scan line
        let imagedataAddr2 = imageDataAddr - (canvasWidth << 2);
        for (let xc = 0; xc < canvasWidth; xc++) {
            imageData[imagedataAddr2++] *= 0.75;
            imageData[imagedataAddr2++] *= 0.75;
            imageData[imagedataAddr2++] *= 0.75;
            imagedataAddr2++;
        }
    }
    imageDataAddr = imageDataAddr;
}

function drawTileLayer(
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
    let x1 = x - borderWidth + (hScroll << (screenMode === MODE_TEXT_80 ? 1 : 0));
    if (x1 >= scrollWidth) {
        x1 -= scrollWidth;
        nameTableAddr ^= hPageSize;
    }
    let charNo, bitShift, bit, patternAddr, patternByte;
    let colorByte, tileAttributeByte;
    let tilePaletteBaseIndex, lineOffset1;
    switch (screenMode) {
        case MODE_GRAPHICS:
            nameTableAddr += (x1 >> 3) + rowOffset;
            charNo = ram[nameTableAddr];
            bitShift = x1 & 7;
            lineOffset1 = lineOffset;
            if (tileColorMode !== COLOR_MODE_NORMAL) {
                tileAttributeByte = ram[colorTable + (ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo)];
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
            patternAddr = charPatternTable + (charNo << 3) + lineOffset1;
            patternByte = ram[patternAddr];
            switch (tileColorMode) {
                case COLOR_MODE_NORMAL:
                    const colorSet = ram[colorTable + (charNo >> 3)];
                    tileColor = (patternByte & bit) !== 0 ? (colorSet & 0xF0) >> 4 : colorSet & 0x0F;
                    tilePaletteBaseIndex = tilePaletteSelect;
                    transparentColor0 = true;
                    tilePriority = false;
                    break;
                case COLOR_MODE_ECM_1:
                    tileColor = ((patternByte & bit) >> (7 - bitShift));
                    tilePaletteBaseIndex = (tilePaletteSelect & 0x20) | ((tileAttributeByte & 0x0f) << 1);
                    break;
                case COLOR_MODE_ECM_2:
                    tileColor =
                        ((patternByte & bit) >> (7 - bitShift)) |
                        (((ram[(patternAddr + tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1);
                    tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                    break;
                case COLOR_MODE_ECM_3:
                    tileColor =
                        ((patternByte & bit) >> (7 - bitShift)) |
                        (((ram[(patternAddr + tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1) |
                        (((ram[(patternAddr + (tilePlaneOffset << 1)) & 0x3fff] & bit) >> (7 - bitShift)) << 2);
                    tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                    break;
            }
            paletteBaseIndex = tilePaletteBaseIndex;
            break;
        case MODE_BITMAP:
            charNo = ram[nameTableAddr + (x1 >> 3) + rowOffset];
            bitShift = x1 & 7;
            bit = 0x80 >> bitShift;
            const charSetOffset = (y & 0xC0) << 5;
            patternByte = ram[charPatternTable + (((charNo << 3) + charSetOffset) & patternTableMask) + lineOffset];
            const colorAddr = colorTable + (((charNo << 3) + charSetOffset) & colorTableMask) + lineOffset;
            colorByte = ram[colorAddr];
            tileColor = (patternByte & bit) !== 0 ? (colorByte & 0xF0) >> 4 : (colorByte & 0x0F);
            paletteBaseIndex = tilePaletteSelect;
            transparentColor0 = true;
            break;
        case MODE_TEXT:
        case MODE_TEXT_80:
            if (x >= borderWidth && x < drawWidth - borderWidth) {
                nameTableAddr += Math.floor(x1 / 6) + rowOffset;
                charNo = ram[nameTableAddr];
                bitShift = x1 % 6;
                lineOffset1 = lineOffset;
                if (tileColorMode !== COLOR_MODE_NORMAL) {
                    tileAttributeByte = ram[colorTable + (ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo)];
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
                patternAddr = charPatternTable + (charNo << 3) + lineOffset1;
                patternByte = ram[patternAddr];
                switch (tileColorMode) {
                    case COLOR_MODE_NORMAL:
                        if (unlocked && ecmPositionAttributes) {
                            tileAttributeByte = ram[colorTable + nameTableAddr - nameTableCanonicalBase];
                            tileColor = (patternByte & bit) !== 0 ? tileAttributeByte >> 4 : tileAttributeByte & 0xF;
                        } else {
                            tileColor = (patternByte & bit) !== 0 ? fgColor : bgColor;
                        }
                        tilePaletteBaseIndex = tilePaletteSelect;
                        transparentColor0 = true;
                        tilePriority = false;
                        break;
                    case COLOR_MODE_ECM_1:
                        tileColor = ((patternByte & bit) >> (7 - bitShift));
                        tilePaletteBaseIndex = (tilePaletteSelect & 0x20) | ((tileAttributeByte & 0x0f) << 1);
                        break;
                    case COLOR_MODE_ECM_2:
                        tileColor =
                            ((patternByte & bit) >> (7 - bitShift)) |
                            (((ram[(patternAddr + tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                        break;
                    case COLOR_MODE_ECM_3:
                        tileColor =
                            ((patternByte & bit) >> (7 - bitShift)) |
                            (((ram[(patternAddr + tilePlaneOffset) & 0x3fff] & bit) >> (7 - bitShift)) << 1) |
                            (((ram[(patternAddr + (tilePlaneOffset << 1)) & 0x3fff] & bit) >> (7 - bitShift)) << 2);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                        break;
                }
            } else {
                transparentColor0 = true;
            }
            break;
        case MODE_MULTICOLOR:
            charNo = ram[nameTableAddr + (x1 >> 3) + rowOffset];
            colorByte = ram[charPatternTable + (charNo << 3) + ((y1 & 0x1c) >> 2)];
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

function prepareSprites(y: number, spriteColorBuffer: Uint8Array, spritePaletteBaseIndexBuffer: Uint8Array) {
    let spritesOnLine = 0;
    const outOfScreenY = row30Enabled ? 0xF0 : 0xC0;
    const negativeScreenY = row30Enabled ? 0xF0 : 0xD0;
    const maxSpriteAttrAddr = spriteAttributeTable + (maxSprites << 2);
    for (let spriteAttrAddr = spriteAttributeTable, index = 0;
         (row30Enabled || ram[spriteAttrAddr] !== 0xd0) && spriteAttrAddr < maxSpriteAttrAddr && spritesOnLine <= maxScanlineSprites; spriteAttrAddr += 4, index++) {
        let parentSpriteAttrAddr = null;
        if (spriteLinkingEnabled) {
            const spriteLinkingAttr = ram[spriteAttributeTable + 0x80 + ((spriteAttrAddr - spriteAttributeTable) >> 2)];
            if ((spriteLinkingAttr & 0x20) !== 0) {
                parentSpriteAttrAddr = spriteAttributeTable + ((spriteLinkingAttr & 0x1F) << 2);
            }
        }
        let spriteY = ram[spriteAttrAddr];
        if (parentSpriteAttrAddr !== null) {
            spriteY = (spriteY + ram[parentSpriteAttrAddr]) & 0xFF;
        }
        if (!realSpriteYCoord) {
            spriteY++;
        }
        if (spriteY < outOfScreenY || spriteY > negativeScreenY) {
            if (spriteY > negativeScreenY) {
                spriteY -= 256;
            }
            const spriteAttr = ram[spriteAttrAddr + 3];
            const spriteSize = !unlocked || (spriteAttr & 0x10) === 0 ? spriteSize : 1;
            const spriteMag = spriteMag;
            const spriteHeight = 8 << spriteSize; // 8 or 16
            const spriteDimensionY = spriteHeight << spriteMag; // 8, 16 or 32
            if (y >= spriteY && y < spriteY + spriteDimensionY) {
                if (spritesOnLine < maxScanlineSprites) {
                    //noinspection JSSuspiciousNameCombination
                    const spriteWidth = spriteHeight;
                    //noinspection JSSuspiciousNameCombination
                    const spriteDimensionX = spriteDimensionY;
                    let spriteX = ram[spriteAttrAddr + 1];
                    if (parentSpriteAttrAddr === null) {
                        if ((spriteAttr & 0x80) !== 0) {
                            spriteX -= 32; // Early clock
                        }
                    } else {
                        // Linked
                        spriteX = (spriteX + ram[parentSpriteAttrAddr + 1]) & 0xFF;
                        if ((ram[parentSpriteAttrAddr + 3] & 0x80) !== 0) {
                            spriteX -= 32; // Early clock of parent
                        }
                    }
                    const patternNo = (ram[spriteAttrAddr + 2] & (spriteSize !== 0 ? 0xFC : 0xFF));
                    const spriteFlipY: boolean = unlocked && (spriteAttr & 0x20) !== 0;
                    const spriteFlipX: boolean = unlocked && (spriteAttr & 0x40) !== 0;
                    const baseColor = spriteAttr & 0x0F;
                    let sprPaletteBaseIndex = 0;
                    switch (spriteColorMode) {
                        case COLOR_MODE_NORMAL:
                            sprPaletteBaseIndex = spritePaletteSelect;
                            break;
                        case COLOR_MODE_ECM_1:
                            sprPaletteBaseIndex = (spritePaletteSelect & 0x20) | (baseColor << 1);
                            break;
                        case COLOR_MODE_ECM_2:
                            sprPaletteBaseIndex = (baseColor << 2);
                            break;
                        case COLOR_MODE_ECM_3:
                            sprPaletteBaseIndex = ((baseColor & 0x0e) << 2);
                            break;
                    }
                    const spritePatternBaseAddr = spritePatternTable + (patternNo << 3);
                    let dy = (y - spriteY) >> spriteMag;
                    if (spriteFlipY) {
                        dy = spriteHeight - dy - 1;
                    }
                    for (let dx = 0; dx < spriteWidth; dx += 8) {
                        const spritePatternAddr = spritePatternBaseAddr + dy + (dx << 1);
                        const spritePatternByte0 = ram[spritePatternAddr];
                        const spritePatternByte1 = ram[(spritePatternAddr + spritePlaneOffset) & 0x3fff];
                        const spritePatternByte2 = ram[(spritePatternAddr + (spritePlaneOffset << 1)) & 0x3fff];
                        let spriteBit = 0x80;
                        let spriteBitShift2 = 7;
                        for (let spriteBitShift1 = 0; spriteBitShift1 < 8; spriteBitShift1++) {
                            let sprColor;
                            let pixelOn = false;
                            switch (spriteColorMode) {
                                case COLOR_MODE_NORMAL:
                                    pixelOn = (spritePatternByte0 & spriteBit) !== 0;
                                    sprColor = pixelOn ? baseColor : 0;
                                    break;
                                case COLOR_MODE_ECM_1:
                                    sprColor = (spritePatternByte0 & spriteBit) >> spriteBitShift2;
                                    break;
                                case COLOR_MODE_ECM_2:
                                    sprColor =
                                        ((spritePatternByte0 & spriteBit) >> spriteBitShift2) |
                                        (((spritePatternByte1 & spriteBit) >> spriteBitShift2) << 1);
                                    break;
                                case COLOR_MODE_ECM_3:
                                    sprColor =
                                        ((spritePatternByte0 & spriteBit) >> spriteBitShift2) |
                                        (((spritePatternByte1 & spriteBit) >> spriteBitShift2) << 1) |
                                        (((spritePatternByte2 & spriteBit) >> spriteBitShift2) << 2);
                                    break;
                            }
                            if (sprColor > 0 || pixelOn) {
                                let x2 = spriteX + ((spriteFlipX ? spriteDimensionX - (dx + spriteBitShift1) - 1 : dx + spriteBitShift1) << spriteMag);
                                if (x2 >= 0 && x2 < drawWidth) {
                                    if (spriteColorBuffer[x2] === 0) {
                                        spriteColorBuffer[x2] = sprColor + 1; // Add one here so 0 means uninitialized. Subtract one before drawing.
                                        spritePaletteBaseIndexBuffer[x2] = sprPaletteBaseIndex;
                                    } else {
                                        collision = true;
                                    }
                                }
                                if (spriteMag) {
                                    x2++;
                                    if (x2 >= 0 && x2 < drawWidth) {
                                        if (spriteColorBuffer[x2] === 0) {
                                            spriteColorBuffer[x2] = sprColor + 1; // Add one here so 0 means uninitialized. Subtract one before drawing.
                                            spritePaletteBaseIndexBuffer[x2] = sprPaletteBaseIndex;
                                        } else {
                                            collision = true;
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
                if (spritesOnLine === 5 && !fifthSprite) {
                    fifthSprite = true;
                    fifthSpriteIndex = index;
                }
            }
        }
    }
    if (screenMode === MODE_TEXT_80) {
        for (let x1 = drawWidth >> 1; x1 >= 0; x1--) {
            spriteColorBuffer[x1 << 1] = spriteColorBuffer[x1];
            spritePaletteBaseIndexBuffer[x1 << 1] = spritePaletteBaseIndexBuffer[x1];
            spriteColorBuffer[(x1 << 1) + 1] = spriteColorBuffer[x1];
            spritePaletteBaseIndexBuffer[(x1 << 1) + 1] = spritePaletteBaseIndexBuffer[x1];
        }
    }
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
