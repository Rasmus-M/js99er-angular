const MODE_GRAPHICS = 0;
const MODE_TEXT = 1;
const MODE_TEXT_80 = 2;
const MODE_BITMAP = 3;
const MODE_MULTICOLOR = 4;

const COLOR_MODE_NORMAL = 0;
const COLOR_MODE_ECM_1 = 1;
const COLOR_MODE_ECM_2 = 2;
const COLOR_MODE_ECM_3 = 3;

const vdpRAMAddr = 0x00000;
const paletteAddr = 0x10000;
const spriteColorBufferAddr = 0x11000;
const spritePaletteBaseIndexBufferAddr = 0x12000;
const imageDataAddr = 0x20000;

let pixelTilePriority: bool = false;
let pixelTransparentColor0: bool = false;
let pixelColor: i32 = 0;
let pixelPaletteBaseIndex: i32 = 0;

export function drawScanline(
    y: i32,
    width: i32,
    displayOn: bool,
    topBorder: i32,
    drawHeight: i32,
    unlocked: bool,
    screenMode: i32,
    drawWidth: i32,
    vPageSize1: i32,
    vPageSize2: i32,
    hPageSize1: i32,
    hPageSize2: i32,
    vScroll1: i32,
    vScroll2: i32,
    tileLayer2Enabled: bool,
    bitmapEnable: bool,
    bitmapBaseAddr: i32,
    bitmapX: i32,
    bitmapY: i32,
    bitmapWidth: i32,
    bitmapHeight: i32,
    bitmapTransparent: bool,
    bitmapFat: bool,
    bitmapPriority: bool,
    bitmapPaletteSelect: i32,
    nameTable: i32,
    nameTable2: i32,
    scanLines: bool,
    bgColor: i32,
    leftBorder: i32,
    tileLayer1Enabled: bool,
    tileMap2AlwaysOnTop: bool,
    colorTable: i32,
    colorTable2: i32,
    hScroll1: i32,
    hScroll2: i32,
    tilePaletteSelect1: i32,
    tilePaletteSelect2: i32,
    tileColorMode: i32,
    row30Enabled: bool,
    spriteLinkingEnabled: bool,
    realSpriteYCoord: bool,
    maxSprites: i32,
    maxScanlineSprites: i32,
    spriteColorMode: i32,
    spritePaletteSelect: i32,
    spritePlaneOffset: i32,
    spriteSize: i32,
    spriteMag: i32,
    spriteAttributeTable: i32,
    spritePatternTable: i32,
    ecmPositionAttributes: bool,
    charPatternTable: i32,
    tilePlaneOffset: i32,
    patternTableMask: i32,
    colorTableMask: i32,
    fgColor: i32,
    statusRegister: u8
): u8 {
    let pixelOffset: i32 = (y * width) << (screenMode === MODE_TEXT_80 ? 1 : 0);
    if (displayOn && y >= topBorder && y < topBorder + drawHeight) {
        y -= topBorder;
        // Prepare sprites
        if (unlocked || (screenMode !== MODE_TEXT && screenMode !== MODE_TEXT_80)) {
            statusRegister = prepareSprites(
                y,
                drawWidth,
                screenMode,
                row30Enabled,
                unlocked,
                spriteLinkingEnabled,
                realSpriteYCoord,
                maxSprites,
                maxScanlineSprites,
                spriteColorMode,
                spritePaletteSelect,
                spritePlaneOffset,
                spriteSize,
                spriteMag,
                spriteAttributeTable,
                spritePatternTable,
                statusRegister
            );
        }
        let scrollWidth: i32 = drawWidth;
        const scrollHeight: i32 = drawHeight;
        // Border in text modes
        const borderWidth: i32 = screenMode === MODE_TEXT ? 8 : (screenMode === MODE_TEXT_80 ? 16 : 0);
        scrollWidth -= (borderWidth << 1);
        // Prepare values for Tile layer 1
        const nameTableCanonicalBase: i32 = vPageSize1 ? nameTable & 0x3000 : (hPageSize1 ? nameTable & 0x3800 : nameTable);
        let nameTableBaseAddr: i32 = nameTable;
        let y1: i32 = y + vScroll1;
        if (y1 >= scrollHeight) {
            y1 -= scrollHeight;
            nameTableBaseAddr ^= vPageSize1;
        }
        let rowOffset: i32 = 0;
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
        const lineOffset: i32 = y1 & 7;
        // Prepare values for Tile layer 2
        let rowOffset2: i32 = 0,
            nameTableCanonicalBase2: i32 = 0,
            nameTableBaseAddr2: i32 = 0,
            lineOffset2: i32 = 0,
            y12: i32 = 0;
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
        let bitmapX2: i32 = 0,
            bitmapY1: i32 = 0,
            bitmapY2: i32 = 0,
            bitmapYOffset: i32 = 0;
        if (bitmapEnable) {
            bitmapX2 = bitmapX + bitmapWidth;
            bitmapY1 = y - bitmapY;
            bitmapY2 = bitmapY + bitmapHeight;
            bitmapYOffset = bitmapY1 * bitmapWidth;
        }
        // Prepare values for sprite layer
        const spritesEnabled: bool = unlocked || (screenMode !== MODE_TEXT && screenMode !== MODE_TEXT_80);
        // Draw line
        for (let xc: i32 = 0; xc < width; xc++) {
            // Draw pixel
            let color: i32 = bgColor;
            let paletteBaseIndex: i32 = 0;
            if (xc >= leftBorder && xc < leftBorder + drawWidth) {
                const x: i32 = xc - leftBorder;
                let havePixel: bool = false,
                    tilePriority: bool = false;
                // Tile layer 1
                if (tileLayer1Enabled) {
                    drawTileLayer(
                        x,
                        y,
                        y1,
                        rowOffset,
                        lineOffset,
                        nameTableCanonicalBase,
                        nameTableBaseAddr,
                        colorTable,
                        borderWidth,
                        scrollWidth,
                        hScroll1,
                        hPageSize1,
                        tilePaletteSelect1,
                        screenMode,
                        tileColorMode,
                        unlocked,
                        ecmPositionAttributes,
                        charPatternTable,
                        tilePlaneOffset,
                        patternTableMask,
                        colorTableMask,
                        drawWidth,
                        fgColor,
                        bgColor
                    );
                    if (pixelColor > 0 || !pixelTransparentColor0) {
                        color = pixelColor;
                        paletteBaseIndex = pixelPaletteBaseIndex;
                        tilePriority = pixelTilePriority;
                        havePixel = true;
                    }
                }
                // Bitmap layer
                if (bitmapEnable) {
                    const bmpX: i32 = screenMode !== MODE_TEXT_80 ? x : x >> 1;
                    if (bmpX >= bitmapX && bmpX < bitmapX2 && y >= bitmapY && y < bitmapY2) {
                        const bitmapX1: i32 = x - bitmapX;
                        const bitmapPixelOffset: i32 = bitmapX1 + bitmapYOffset;
                        const bitmapByte: i32 = <i32> getRAMByte(bitmapBaseAddr + (bitmapPixelOffset >> 2));
                        let bitmapBitShift: i32,
                            bitmapColor: i32;
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
                            tilePriority = tilePriority && !bitmapPriority;
                        }
                    }
                }
                // Tile layer 2
                if (tileLayer2Enabled) {
                    drawTileLayer(
                        x,
                        y,
                        y1,
                        rowOffset2,
                        lineOffset2,
                        nameTableCanonicalBase2,
                        nameTableBaseAddr2,
                        colorTable2,
                        borderWidth,
                        scrollWidth,
                        hScroll2,
                        hPageSize2,
                        tilePaletteSelect2,
                        screenMode,
                        tileColorMode,
                        unlocked,
                        ecmPositionAttributes,
                        charPatternTable,
                        tilePlaneOffset,
                        patternTableMask,
                        colorTableMask,
                        drawWidth,
                        fgColor,
                        bgColor
                    );
                    if (pixelColor > 0 || !pixelTransparentColor0) {
                        color = pixelColor;
                        paletteBaseIndex = pixelPaletteBaseIndex;
                        tilePriority = pixelTilePriority || tileMap2AlwaysOnTop;
                        havePixel = true;
                    }
                }
                // Sprite layer
                if (spritesEnabled && !(tilePriority && havePixel)) {
                    const spriteColor: i32 = getSpriteColorBuffer(x) - 1;
                    if (spriteColor > 0) {
                        color = spriteColor;
                        paletteBaseIndex = getSpritePaletteBaseIndexBuffer(x);
                    }
                }
            }
            // Draw pixel
            const rgbColor: u32 = getColor(color + paletteBaseIndex);
            setImageData(pixelOffset++, rgbColor);
        }
    } else {
        // Empty scanline
        const rgbColor: u32 = getColor(bgColor);
        for (let xc: i32 = 0; xc < width; xc++) {
            setImageData(pixelOffset++, rgbColor);
        }
    }
    if (scanLines && (y & 1) !== 0) {
        // Dim last scan line
        let pixelOffset2: i32 = pixelOffset - width;
        for (let xc: i32 = 0; xc < width; xc++) {
            const rgbColor: u32 = getImageData(pixelOffset2);
            const dimmedRgbColor: u32 = 0xff000000 |
                (dim((rgbColor >> 16) & 0xff) << 16) |
                (dim((rgbColor >> 8) & 0xff) << 8) |
                dim(rgbColor & 0xff);
            setImageData(pixelOffset2++, dimmedRgbColor);
        }
    }
    if (screenMode === MODE_TEXT_80) {
        duplicateLastScanline(pixelOffset, width);
    }
    return statusRegister;
}

// @ts-ignore
@inline
function dim(colorComponent: u32): u32 {
    return (colorComponent >> 1) + (colorComponent >> 2);
}

function drawTileLayer(
    x: i32,
    y: i32,
    y1: i32,
    rowOffset: i32,
    lineOffset: i32,
    nameTableCanonicalBase: i32,
    nameTableBaseAddr: i32,
    colorTable: i32,
    borderWidth: i32,
    scrollWidth: i32,
    hScroll: i32,
    hPageSize: i32,
    tilePaletteSelect: i32,
    screenMode: i32,
    tileColorMode: i32,
    unlocked: bool,
    ecmPositionAttributes: bool,
    charPatternTable: i32,
    tilePlaneOffset: i32,
    patternTableMask: i32,
    colorTableMask: i32,
    drawWidth: i32,
    fgColor: i32,
    bgColor: i32,
): void {
    let tilePriority: bool = false,
        transparentColor0: bool = false,
        tileColor: i32 = 0,
        paletteBaseIndex: i32 = 0,
        nameTableAddr: i32 = nameTableBaseAddr,
        x1: i32 = x - borderWidth + (hScroll << (screenMode === MODE_TEXT_80 ? 1 : 0));
    if (x1 >= scrollWidth) {
        x1 -= scrollWidth;
        nameTableAddr ^= hPageSize;
    }
    let charNo: i32,
        bitShift: i32,
        bit: i32,
        patternAddr: i32,
        patternByte: i32,
        colorByte: i32 = 0,
        tileAttributeByte: i32 = 0,
        tilePaletteBaseIndex: i32 = 0,
        lineOffset1: i32;
    switch (screenMode) {
        case MODE_GRAPHICS:
            nameTableAddr += (x1 >> 3) + rowOffset;
            charNo = getRAMByte(nameTableAddr);
            bitShift = x1 & 7;
            lineOffset1 = lineOffset;
            if (tileColorMode !== COLOR_MODE_NORMAL) {
                tileAttributeByte = getRAMByte(colorTable + (ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo));
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
            patternByte = getRAMByte(patternAddr);
            switch (tileColorMode) {
                case COLOR_MODE_NORMAL:
                    const colorSet: i32 = getRAMByte(colorTable + (charNo >> 3));
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
                        (((getRAMByte((patternAddr + tilePlaneOffset) & 0x3fff) & bit) >> (7 - bitShift)) << 1);
                    tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                    break;
                case COLOR_MODE_ECM_3:
                    tileColor =
                        ((patternByte & bit) >> (7 - bitShift)) |
                        (((getRAMByte((patternAddr + tilePlaneOffset) & 0x3fff) & bit) >> (7 - bitShift)) << 1) |
                        (((getRAMByte((patternAddr + (tilePlaneOffset << 1)) & 0x3fff) & bit) >> (7 - bitShift)) << 2);
                    tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                    break;
            }
            paletteBaseIndex = tilePaletteBaseIndex;
            break;
        case MODE_BITMAP:
            charNo = getRAMByte(nameTableAddr + (x1 >> 3) + rowOffset);
            bitShift = x1 & 7;
            bit = 0x80 >> bitShift;
            const charSetOffset: i32 = (y & 0xC0) << 5;
            patternByte = getRAMByte(charPatternTable + (((charNo << 3) + charSetOffset) & patternTableMask) + lineOffset);
            const colorAddr: i32 = colorTable + (((charNo << 3) + charSetOffset) & colorTableMask) + lineOffset;
            colorByte = getRAMByte(colorAddr);
            tileColor = (patternByte & bit) !== 0 ? (colorByte & 0xF0) >> 4 : (colorByte & 0x0F);
            paletteBaseIndex = tilePaletteSelect;
            transparentColor0 = true;
            break;
        case MODE_TEXT:
        case MODE_TEXT_80:
            if (x >= borderWidth && x < drawWidth - borderWidth) {
                nameTableAddr += x1 / 6 + rowOffset;
                charNo = getRAMByte(nameTableAddr);
                bitShift = x1 % 6;
                lineOffset1 = lineOffset;
                if (tileColorMode !== COLOR_MODE_NORMAL) {
                    tileAttributeByte = getRAMByte(colorTable + (ecmPositionAttributes ? nameTableAddr - nameTableCanonicalBase : charNo));
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
                patternByte = getRAMByte(patternAddr);
                switch (tileColorMode) {
                    case COLOR_MODE_NORMAL:
                        if (unlocked && ecmPositionAttributes) {
                            tileAttributeByte = getRAMByte(colorTable + nameTableAddr - nameTableCanonicalBase);
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
                            (((getRAMByte((patternAddr + tilePlaneOffset) & 0x3fff) & bit) >> (7 - bitShift)) << 1);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0f) << 2);
                        break;
                    case COLOR_MODE_ECM_3:
                        tileColor =
                            ((patternByte & bit) >> (7 - bitShift)) |
                            (((getRAMByte((patternAddr + tilePlaneOffset) & 0x3fff) & bit) >> (7 - bitShift)) << 1) |
                            (((getRAMByte((patternAddr + (tilePlaneOffset << 1)) & 0x3fff) & bit) >> (7 - bitShift)) << 2);
                        tilePaletteBaseIndex = ((tileAttributeByte & 0x0e) << 2);
                        break;
                }
            } else {
                transparentColor0 = true;
            }
            break;
        case MODE_MULTICOLOR:
            charNo = getRAMByte(nameTableAddr + (x1 >> 3) + rowOffset);
            colorByte = getRAMByte(charPatternTable + (charNo << 3) + ((y1 & 0x1c) >> 2));
            tileColor = (x1 & 4) === 0 ? (colorByte & 0xf0) >> 4 : (colorByte & 0x0f);
            paletteBaseIndex = tilePaletteSelect;
            transparentColor0 = true;
            break;
    }
    pixelTilePriority = tilePriority;
    pixelTransparentColor0 = transparentColor0;
    pixelColor = tileColor;
    pixelPaletteBaseIndex = paletteBaseIndex;
}

function prepareSprites(
    y: i32,
    drawWidth: i32,
    screenMode: i32,
    row30Enabled: bool,
    unlocked: bool,
    spriteLinkingEnabled: bool,
    realSpriteYCoord: bool,
    maxSprites: i32,
    maxScanlineSprites: i32,
    spriteColorMode: i32,
    spritePaletteSelect: i32,
    spritePlaneOffset: i32,
    defaultSpriteSize: i32,
    spriteMag: i32,
    spriteAttributeTable: i32,
    spritePatternTable: i32,
    statusRegister: u8
): u8 {
    initSpriteBuffer(drawWidth);
    let spritesOnLine: i32 = 0;
    const outOfScreenY: i32 = row30Enabled ? 0xF0 : 0xC0;
    const negativeScreenY: i32 = row30Enabled ? 0xF0 : 0xD0;
    const maxSpriteAttrAddr: i32 = spriteAttributeTable + (maxSprites << 2);
    for (let spriteAttrAddr: i32 = spriteAttributeTable, index: i32 = 0;
         (row30Enabled || getRAMByte(spriteAttrAddr) !== 0xd0) && spriteAttrAddr < maxSpriteAttrAddr && spritesOnLine <= maxScanlineSprites; spriteAttrAddr += 4, index++) {
        let parentSpriteAttrAddr: i32 = -1;
        if (spriteLinkingEnabled) {
            const spriteLinkingAttr: i32 = getRAMByte(spriteAttributeTable + 0x80 + ((spriteAttrAddr - spriteAttributeTable) >> 2));
            if ((spriteLinkingAttr & 0x20) !== 0) {
                parentSpriteAttrAddr = spriteAttributeTable + ((spriteLinkingAttr & 0x1F) << 2);
            }
        }
        let spriteY: i32 = <i32> getRAMByte(spriteAttrAddr);
        if (parentSpriteAttrAddr !== -1) {
            spriteY = (spriteY + getRAMByte(parentSpriteAttrAddr)) & 0xFF;
        }
        if (!realSpriteYCoord) {
            spriteY++;
        }
        if (spriteY < outOfScreenY || spriteY > negativeScreenY) {
            if (spriteY > negativeScreenY) {
                spriteY -= 256;
            }
            const spriteAttr: i32 = getRAMByte(spriteAttrAddr + 3);
            const spriteSize: i32 = !unlocked || (spriteAttr & 0x10) === 0 ? defaultSpriteSize : 1;
            const spriteHeight: i32 = 8 << spriteSize; // 8 or 16
            const spriteDimensionY: i32 = spriteHeight << spriteMag; // 8, 16 or 32
            if (y >= spriteY && y < spriteY + spriteDimensionY) {
                if (spritesOnLine < maxScanlineSprites) {
                    //noinspection JSSuspiciousNameCombination
                    const spriteWidth: i32 = spriteHeight;
                    //noinspection JSSuspiciousNameCombination
                    const spriteDimensionX: i32 = spriteDimensionY;
                    let spriteX: i32 = getRAMByte(spriteAttrAddr + 1);
                    if (parentSpriteAttrAddr === -1) {
                        if ((spriteAttr & 0x80) !== 0) {
                            spriteX -= 32; // Early clock
                        }
                    } else {
                        // Linked
                        spriteX = (spriteX + getRAMByte(parentSpriteAttrAddr + 1)) & 0xFF;
                        if ((getRAMByte(parentSpriteAttrAddr + 3) & 0x80) !== 0) {
                            spriteX -= 32; // Early clock of parent
                        }
                    }
                    const patternNo: i32 = (getRAMByte(spriteAttrAddr + 2) & (spriteSize !== 0 ? 0xFC : 0xFF));
                    const spriteFlipY: bool = unlocked && (spriteAttr & 0x20) !== 0;
                    const spriteFlipX: bool = unlocked && (spriteAttr & 0x40) !== 0;
                    const baseColor: i32 = spriteAttr & 0x0F;
                    let sprPaletteBaseIndex: i32 = 0;
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
                    let dy: i32 = (y - spriteY) >> spriteMag;
                    if (spriteFlipY) {
                        dy = spriteHeight - dy - 1;
                    }
                    for (let dx: i32 = 0; dx < spriteWidth; dx += 8) {
                        const spritePatternAddr: i32 = spritePatternBaseAddr + dy + (dx << 1);
                        const spritePatternByte0: i32 = getRAMByte(spritePatternAddr);
                        const spritePatternByte1: i32 = getRAMByte((spritePatternAddr + spritePlaneOffset) & 0x3fff);
                        const spritePatternByte2: i32 = getRAMByte((spritePatternAddr + (spritePlaneOffset << 1)) & 0x3fff);
                        let spriteBit: i32 = 0x80;
                        let spriteBitShift2: i32 = 7;
                        for (let spriteBitShift1: i32 = 0; spriteBitShift1 < 8; spriteBitShift1++) {
                            let sprColor: i32 = 0;
                            let pixelOn: bool = false;
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
                                let x2: i32 = spriteX + (spriteFlipX ? spriteDimensionX - ((dx + spriteBitShift1 + 1) << spriteMag) : ((dx + spriteBitShift1) << spriteMag));
                                if (x2 >= 0 && x2 < drawWidth) {
                                    if (getSpriteColorBuffer(x2) === 0) {
                                        setSpriteColorBuffer(x2, sprColor + 1); // Add one here so 0 means uninitialized. Subtract one before drawing.
                                        setSpritePaletteBaseIndexBuffer(x2, sprPaletteBaseIndex);
                                    } else {
                                        statusRegister |= 0x20; // Collision
                                    }
                                }
                                if (spriteMag) {
                                    x2++;
                                    if (x2 >= 0 && x2 < drawWidth) {
                                        if (getSpriteColorBuffer(x2) === 0) {
                                            setSpriteColorBuffer(x2, sprColor + 1); // Add one here so 0 means uninitialized. Subtract one before drawing.
                                            setSpritePaletteBaseIndexBuffer(x2, sprPaletteBaseIndex);
                                        } else {
                                            statusRegister |= 0x20; // Collision
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
                if (spritesOnLine === 5 && (statusRegister & 0x40) === 0) {
                    statusRegister |= 0x40; // Fifth sprite
                    statusRegister = <u8> ((statusRegister & 0xe0) | index);
                }
            }
        }
    }
    if (screenMode === MODE_TEXT_80) {
        for (let x1: i32 = drawWidth >> 1; x1 >= 0; x1--) {
            const spriteColorBufferValue = getSpriteColorBuffer(x1);
            const spritePaletteBaseIndexBufferValue = getSpritePaletteBaseIndexBuffer(x1);
            setSpriteColorBuffer(x1 << 1, spriteColorBufferValue);
            setSpritePaletteBaseIndexBuffer(x1 << 1, spritePaletteBaseIndexBufferValue);
            setSpriteColorBuffer((x1 << 1) + 1, spriteColorBufferValue);
            setSpritePaletteBaseIndexBuffer((x1 << 1) + 1, spritePaletteBaseIndexBufferValue);
        }
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

function initSpriteBuffer(drawWidth: i32): void {
    memory.fill(spriteColorBufferAddr, 0x00, drawWidth << 2);
    memory.fill(spritePaletteBaseIndexBufferAddr, 0x00, drawWidth << 2);
}

// @ts-ignore
@Inline
function setSpriteColorBuffer(offset: i32, value: i32): void {
    store<i32>(spriteColorBufferAddr + (offset << 2), value);
}

// @ts-ignore
@inline
function getSpriteColorBuffer(offset: i32): i32 {
    return load<i32>(spriteColorBufferAddr + (offset << 2));
}

// @ts-ignore
@Inline
function setSpritePaletteBaseIndexBuffer(offset: i32, value: i32): void {
    store<i32>(spritePaletteBaseIndexBufferAddr + (offset << 2), value);
}

// @ts-ignore
@inline
function getSpritePaletteBaseIndexBuffer(offset: i32): i32 {
    return load<i32>(spritePaletteBaseIndexBufferAddr + (offset << 2));
}

// @ts-ignore
@inline
function setImageData(pixelOffset: i32, value: u32): void {
    store<u32>(imageDataAddr + (pixelOffset << 2), value);
}

// @ts-ignore
@inline
function getImageData(pixelOffset: i32): u32 {
    return load<u32>(imageDataAddr + (pixelOffset << 2));
}

// @ts-ignore
@inline
function duplicateLastScanline(pixelOffset: i32, width: i32): void {
    memory.copy(imageDataAddr + (pixelOffset << 2), imageDataAddr + ((pixelOffset - width) << 2), width << 2);
}
