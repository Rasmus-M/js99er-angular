/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/drawScanline
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
export declare function drawScanline(y: number, width: number, height: number, screenMode: number, textMode: boolean, bitmapMode: boolean, fgColor: number, bgColor: number, nameTable: number, colorTable: number, charPatternTable: number, colorTableMask: number, patternTableMask: number, spriteAttributeTable: number, spritePatternTable: number, vr1: number, vr4: number, displayOn: boolean, statusRegister: number): number;
