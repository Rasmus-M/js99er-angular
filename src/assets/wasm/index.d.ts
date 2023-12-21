/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/tms9918a/drawScanline
 * @param y `i32`
 * @param width `i32`
 * @param height `i32`
 * @param screenMode `i32`
 * @param textMode `bool`
 * @param bitmapMode `bool`
 * @param fgColor `i32`
 * @param bgColor `i32`
 * @param nameTable `i32`
 * @param colorTable `i32`
 * @param charPatternTable `i32`
 * @param colorTableMask `i32`
 * @param patternTableMask `i32`
 * @param spriteAttributeTable `i32`
 * @param spritePatternTable `i32`
 * @param vr1 `i32`
 * @param vr4 `i32`
 * @param displayOn `bool`
 * @param statusRegister `u8`
 * @returns `u8`
 */
export declare function drawScanline9918a(y: number, width: number, height: number, screenMode: number, textMode: boolean, bitmapMode: boolean, fgColor: number, bgColor: number, nameTable: number, colorTable: number, charPatternTable: number, colorTableMask: number, patternTableMask: number, spriteAttributeTable: number, spritePatternTable: number, vr1: number, vr4: number, displayOn: boolean, statusRegister: number): number;
/**
 * assembly/f18a/drawScanline
 * @param y `i32`
 * @param displayOn `bool`
 * @param topBorder `i32`
 * @param drawHeight `i32`
 * @param unlocked `bool`
 * @param screenMode `i32`
 * @param drawWidth `i32`
 * @param vPageSize1 `i32`
 * @param vPageSize2 `i32`
 * @param hPageSize1 `i32`
 * @param hPageSize2 `i32`
 * @param vScroll1 `i32`
 * @param vScroll2 `i32`
 * @param tileLayer2Enabled `bool`
 * @param bitmapEnable `bool`
 * @param bitmapBaseAddr `i32`
 * @param bitmapX `i32`
 * @param bitmapY `i32`
 * @param bitmapWidth `i32`
 * @param bitmapHeight `i32`
 * @param bitmapTransparent `bool`
 * @param bitmapFat `bool`
 * @param bitmapPriority `bool`
 * @param bitmapPaletteSelect `i32`
 * @param nameTable `i32`
 * @param nameTable2 `i32`
 * @param canvasWidth `i32`
 * @param scanLines `bool`
 * @param bgColor `i32`
 * @param leftBorder `i32`
 * @param tileLayer1Enabled `bool`
 * @param tileMap2AlwaysOnTop `bool`
 * @param colorTable `i32`
 * @param colorTable2 `i32`
 * @param hScroll1 `i32`
 * @param hScroll2 `i32`
 * @param tilePaletteSelect1 `i32`
 * @param tilePaletteSelect2 `i32`
 * @param tileColorMode `i32`
 * @param row30Enabled `bool`
 * @param spriteLinkingEnabled `bool`
 * @param realSpriteYCoord `bool`
 * @param maxSprites `i32`
 * @param maxScanlineSprites `i32`
 * @param spriteColorMode `i32`
 * @param spritePaletteSelect `i32`
 * @param spritePlaneOffset `i32`
 * @param spriteSize `i32`
 * @param spriteMag `i32`
 * @param spriteAttributeTable `i32`
 * @param spritePatternTable `i32`
 * @param ecmPositionAttributes `bool`
 * @param charPatternTable `i32`
 * @param tilePlaneOffset `i32`
 * @param patternTableMask `i32`
 * @param colorTableMask `i32`
 * @param fgColor `i32`
 * @param statusRegister `u8`
 * @returns `u8`
 */
export declare function drawScanlineF18a(y: number, displayOn: boolean, topBorder: number, drawHeight: number, unlocked: boolean, screenMode: number, drawWidth: number, vPageSize1: number, vPageSize2: number, hPageSize1: number, hPageSize2: number, vScroll1: number, vScroll2: number, tileLayer2Enabled: boolean, bitmapEnable: boolean, bitmapBaseAddr: number, bitmapX: number, bitmapY: number, bitmapWidth: number, bitmapHeight: number, bitmapTransparent: boolean, bitmapFat: boolean, bitmapPriority: boolean, bitmapPaletteSelect: number, nameTable: number, nameTable2: number, canvasWidth: number, scanLines: boolean, bgColor: number, leftBorder: number, tileLayer1Enabled: boolean, tileMap2AlwaysOnTop: boolean, colorTable: number, colorTable2: number, hScroll1: number, hScroll2: number, tilePaletteSelect1: number, tilePaletteSelect2: number, tileColorMode: number, row30Enabled: boolean, spriteLinkingEnabled: boolean, realSpriteYCoord: boolean, maxSprites: number, maxScanlineSprites: number, spriteColorMode: number, spritePaletteSelect: number, spritePlaneOffset: number, spriteSize: number, spriteMag: number, spriteAttributeTable: number, spritePatternTable: number, ecmPositionAttributes: boolean, charPatternTable: number, tilePlaneOffset: number, patternTableMask: number, colorTableMask: number, fgColor: number, statusRegister: number): number;
