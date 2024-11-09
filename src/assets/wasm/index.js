async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    drawScanline9918a(y, width, height, screenMode, textMode, bitmapMode, fgColor, bgColor, nameTable, colorTable, charPatternTable, colorTableMask, patternTableMask, spriteAttributeTable, spritePatternTable, vr1, vr4, displayOn, statusRegister) {
      // assembly/tms9918a/drawScanline(i32, i32, i32, i32, bool, bool, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, bool, u8) => u8
      textMode = textMode ? 1 : 0;
      bitmapMode = bitmapMode ? 1 : 0;
      displayOn = displayOn ? 1 : 0;
      return exports.drawScanline9918a(y, width, height, screenMode, textMode, bitmapMode, fgColor, bgColor, nameTable, colorTable, charPatternTable, colorTableMask, patternTableMask, spriteAttributeTable, spritePatternTable, vr1, vr4, displayOn, statusRegister);
    },
    drawScanlineF18a(y, width, displayOn, topBorder, drawHeight, unlocked, screenMode, drawWidth, vPageSize1, vPageSize2, hPageSize1, hPageSize2, vScroll1, vScroll2, tileLayer2Enabled, bitmapEnable, bitmapBaseAddr, bitmapX, bitmapY, bitmapWidth, bitmapHeight, bitmapTransparent, bitmapFat, bitmapPriority, bitmapPaletteSelect, nameTable, nameTable2, scanLines, bgColor, leftBorder, tileLayer1Enabled, tileMap2AlwaysOnTop, colorTable, colorTable2, hScroll1, hScroll2, tilePaletteSelect1, tilePaletteSelect2, tileColorMode, row30Enabled, spriteLinkingEnabled, realSpriteYCoord, maxSprites, maxScanlineSprites, spriteColorMode, spritePaletteSelect, spritePlaneOffset, spriteSize, spriteMag, spriteAttributeTable, spritePatternTable, ecmPositionAttributes, charPatternTable, tilePlaneOffset, patternTableMask, colorTableMask, fgColor, statusRegister) {
      // assembly/f18a/drawScanline(i32, i32, bool, i32, i32, bool, i32, i32, i32, i32, i32, i32, i32, i32, bool, bool, i32, i32, i32, i32, i32, bool, bool, bool, i32, i32, i32, bool, i32, i32, bool, bool, i32, i32, i32, i32, i32, i32, i32, bool, bool, bool, i32, i32, i32, i32, i32, i32, i32, i32, i32, bool, i32, i32, i32, i32, i32, u8) => u8
      displayOn = displayOn ? 1 : 0;
      unlocked = unlocked ? 1 : 0;
      tileLayer2Enabled = tileLayer2Enabled ? 1 : 0;
      bitmapEnable = bitmapEnable ? 1 : 0;
      bitmapTransparent = bitmapTransparent ? 1 : 0;
      bitmapFat = bitmapFat ? 1 : 0;
      bitmapPriority = bitmapPriority ? 1 : 0;
      scanLines = scanLines ? 1 : 0;
      tileLayer1Enabled = tileLayer1Enabled ? 1 : 0;
      tileMap2AlwaysOnTop = tileMap2AlwaysOnTop ? 1 : 0;
      row30Enabled = row30Enabled ? 1 : 0;
      spriteLinkingEnabled = spriteLinkingEnabled ? 1 : 0;
      realSpriteYCoord = realSpriteYCoord ? 1 : 0;
      ecmPositionAttributes = ecmPositionAttributes ? 1 : 0;
      return exports.drawScanlineF18a(y, width, displayOn, topBorder, drawHeight, unlocked, screenMode, drawWidth, vPageSize1, vPageSize2, hPageSize1, hPageSize2, vScroll1, vScroll2, tileLayer2Enabled, bitmapEnable, bitmapBaseAddr, bitmapX, bitmapY, bitmapWidth, bitmapHeight, bitmapTransparent, bitmapFat, bitmapPriority, bitmapPaletteSelect, nameTable, nameTable2, scanLines, bgColor, leftBorder, tileLayer1Enabled, tileMap2AlwaysOnTop, colorTable, colorTable2, hScroll1, hScroll2, tilePaletteSelect1, tilePaletteSelect2, tileColorMode, row30Enabled, spriteLinkingEnabled, realSpriteYCoord, maxSprites, maxScanlineSprites, spriteColorMode, spritePaletteSelect, spritePlaneOffset, spriteSize, spriteMag, spriteAttributeTable, spritePatternTable, ecmPositionAttributes, charPatternTable, tilePlaneOffset, patternTableMask, colorTableMask, fgColor, statusRegister);
    },
  }, exports);
  return adaptedExports;
}
export const {
  memory,
  drawScanline9918a,
  drawScanlineF18a,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("index.wasm", import.meta.url));
