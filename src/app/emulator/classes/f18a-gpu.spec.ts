import {F18AGPU} from './f18a-gpu';
import {F18A} from './f18a';

const SRC = 0x1000;
const DST = 0x1800;

describe('F18AGPU DMA', () => {

    let ram: Uint8Array;
    let gpu: F18AGPU;

    beforeEach(() => {
        ram = new Uint8Array(0x10000);
        gpu = new F18AGPU({getRAM: () => ram} as unknown as F18A, 'F18A');
        gpu.intReset();
        // reset() would pull in the flash storage, and the DMA needs nothing but the RAM
        (gpu as any).vdpRAM = ram;
    });

    // The source counts up from 0x40, so where a byte landed says which row and column
    // the engine thought it was on.
    function dma(src: number, dst: number, width: number, height: number, stride: number, params: number) {
        for (let i = 0; i < 0x400; i++) {
            ram[SRC + i] = (0x40 + i) & 0xFF;
            ram[DST + i] = 0;
        }
        ram[0x8000] = src >> 8;
        ram[0x8001] = src & 0xFF;
        ram[0x8002] = dst >> 8;
        ram[0x8003] = dst & 0xFF;
        ram[0x8004] = width;
        ram[0x8005] = height;
        ram[0x8006] = stride;
        ram[0x8007] = params;
        gpu.writeMemoryByte(0x8008, 1);
    }

    it('copies contiguous rows when the stride is the width', () => {
        dma(SRC, DST, 4, 3, 4, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 11]).toBe(0x4b);
        expect(ram[DST + 12]).toBe(0x00);
    });

    it('leaves a gap of stride minus width between rows', () => {
        dma(SRC, DST, 4, 3, 16, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 4]).toBe(0x00);
        expect(ram[DST + 16]).toBe(0x50);
        expect(ram[DST + 32]).toBe(0x60);
    });

    it('treats a stride of zero as a pitch of zero, not 256', () => {
        dma(SRC, DST, 4, 3, 0, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 4]).toBe(0x00);
        expect(ram[DST + 256]).toBe(0x00);
    });

    it('walks backwards when the stride overflows the 8-bit difference', () => {
        // width 8 and stride 200 is a difference of -63, so the pitch is -56 and not +200
        dma(0x1100, 0x1900, 8, 2, 200, 0x00);
        expect(ram[0x1900]).toBe(0x40);
        expect(ram[0x18c8]).toBe(0x08);
        expect(ram[0x19c8]).toBe(0x00);
    });

    it('turns around either side of the stride that overflows', () => {
        // for a width of 8 that is a stride of 135
        dma(0x1100, 0x1900, 8, 2, 134, 0x00);
        expect(ram[0x1986]).toBe(0xc6);
        expect(ram[0x1985]).toBe(0x00);

        dma(0x1100, 0x1900, 8, 2, 135, 0x00);
        expect(ram[0x1887]).toBe(0xc7);
        expect(ram[0x1987]).toBe(0x00);
    });

    it('treats a width of zero as 256', () => {
        dma(SRC, DST, 0, 1, 0, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 255]).toBe(0x3f);
        expect(ram[DST + 256]).toBe(0x00);
    });

    it('treats a height of zero as 256', () => {
        dma(SRC, DST, 1, 0, 1, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 255]).toBe(0x3f);
        expect(ram[DST + 256]).toBe(0x00);
    });

    it('takes the top of each register', () => {
        dma(SRC, DST, 255, 1, 255, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 254]).toBe(0x3e);
        expect(ram[DST + 255]).toBe(0x00);

        dma(SRC, DST, 1, 255, 1, 0x00);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 254]).toBe(0x3e);
        expect(ram[DST + 255]).toBe(0x00);
    });

    it('steps back into the row just written when the stride is under the width', () => {
        dma(SRC, DST, 8, 2, 4, 0x00);
        expect(ram[DST + 3]).toBe(0x43);
        expect(ram[DST + 4]).toBe(0x44);
        expect(ram[DST + 11]).toBe(0x4b);
        expect(ram[DST + 12]).toBe(0x00);
    });

    it('fills from the byte it read once, striding like a copy', () => {
        dma(SRC, DST, 4, 3, 16, 0x01);
        expect(ram[DST + 3]).toBe(0x40);
        expect(ram[DST + 4]).toBe(0x00);
        expect(ram[DST + 32]).toBe(0x40);
    });

    it('decodes only two bits of the parameter byte', () => {
        dma(SRC, DST, 4, 3, 4, 0xfc);
        expect(ram[DST]).toBe(0x40);
        expect(ram[DST + 11]).toBe(0x4b);
        expect(ram[DST + 12]).toBe(0x00);
    });

    it('fills downwards with both parameter bits set', () => {
        dma(0x1100, 0x1900, 4, 2, 4, 0x03);
        expect(ram[0x1900]).toBe(0x40);
        expect(ram[0x18fd]).toBe(0x40);
        expect(ram[0x18f9]).toBe(0x40);
        expect(ram[0x18f8]).toBe(0x00);
    });

    it('propagates when source and destination overlap forwards', () => {
        dma(SRC, SRC + 2, 8, 1, 8, 0x00);
        expect(ram[SRC + 2]).toBe(0x40);
        expect(ram[SRC + 4]).toBe(0x40);
        expect(ram[SRC + 9]).toBe(0x41);
    });

    it('runs both ends backwards when decrementing', () => {
        dma(0x1100, 0x1900, 4, 2, 4, 0x02);
        expect(ram[0x1900]).toBe(0x40);
        expect(ram[0x18fd]).toBe(0x3d);
        expect(ram[0x18fc]).toBe(0x3c);
        expect(ram[0x18f9]).toBe(0x39);
        expect(ram[0x1901]).toBe(0x00);
    });

    it('wraps a destination at 16 bits rather than dropping the bytes past the end', () => {
        dma(SRC, 0xfffe, 4, 1, 4, 0x00);
        expect(ram[0xfffe]).toBe(0x40);
        expect(ram[0xffff]).toBe(0x41);
        expect(ram[0x0000]).toBe(0x42);
        expect(ram[0x0001]).toBe(0x43);
    });

    it('wraps a source at 16 bits too', () => {
        ram[0xfffe] = 0x11;
        ram[0xffff] = 0x22;
        ram[0x0000] = 0x33;
        ram[0x0001] = 0x44;
        dma(0xfffe, DST, 4, 1, 4, 0x00);
        expect(ram[DST]).toBe(0x11);
        expect(ram[DST + 1]).toBe(0x22);
        expect(ram[DST + 2]).toBe(0x33);
        expect(ram[DST + 3]).toBe(0x44);
    });
});
