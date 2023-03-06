async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    drawScanline(y, width, height, screenMode, textMode, bitmapMode, fgColor, bgColor, nameTable, colorTable, charPatternTable, colorTableMask, patternTableMask, spriteAttributeTable, spritePatternTable, vr1, vr4, displayOn, statusRegister) {
      // assembly/index/drawScanline(i32, i32, i32, i32, bool, bool, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, bool, u8) => u8
      textMode = textMode ? 1 : 0;
      bitmapMode = bitmapMode ? 1 : 0;
      displayOn = displayOn ? 1 : 0;
      return exports.drawScanline(y, width, height, screenMode, textMode, bitmapMode, fgColor, bgColor, nameTable, colorTable, charPatternTable, colorTableMask, patternTableMask, spriteAttributeTable, spritePatternTable, vr1, vr4, displayOn, statusRegister);
    },
  }, exports);
  return adaptedExports;
}
export const {
  memory,
  drawScanline
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
  }
))(new URL("index.wasm", import.meta.url));
