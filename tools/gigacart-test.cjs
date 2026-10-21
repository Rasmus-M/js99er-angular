#!/usr/bin/env node
// Run with npm run test:gigacart. All ROM data is generated in memory.
const assert = require('node:assert/strict');
const {test} = require('node:test');
require('@angular/compiler');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({module: 'commonjs', moduleResolution: 'node', target: 'es2020'});
require('ts-node/register/transpile-only');
const {Cartridge} = require('../src/app/emulator/classes/cartridge.ts');
const {Software} = require('../src/app/classes/software.ts');
const {Settings} = require('../src/app/classes/settings.ts');
const {gigacartOptions} = require('../src/app/classes/gigacart.ts');

function cartFor(rom, options = {gigacart: true}, settings = new Settings()) {
    const software = new Software(options);
    software.rom = rom;
    return new Cartridge(software, settings);
}

function select(cart, bank) {
    // Drive the address lines and the high byte of the CPU write word.
    cart.write(0x6000 + ((bank & 0xfff) << 1), (bank >> 4) & 0xff00);
}

function setGROMAddress(cart, addr) {
    cart.readGROM(0x9802); // synchronize the two-byte address sequence
    cart.writeGROM(0x9c02, addr & 0xff00);
    cart.writeGROM(0x9c02, (addr & 0xff) << 8);
}

// Distinct synthetic words at the beginning, middle and end of every bank.
const rom = Buffer.alloc(0x08000000);
for (let bank = 0; bank < 0x4000; bank++) {
    rom.writeUInt16BE(bank ^ 0xa55a, bank * 8192);
    rom.writeUInt16BE(bank ^ 0x5aa5, bank * 8192 + 4096);
    rom.writeUInt16BE(bank, bank * 8192 + 8190);
}

test('selects all 16,384 banks and maps both bytes across the cartridge window', () => {
    const cart = cartFor(rom);
    for (let bank = 0; bank < 0x4000; bank++) {
        select(cart, bank);
        assert.equal(cart.read(0x6000), bank ^ 0xa55a);
        assert.equal(cart.read(0x7000), bank ^ 0x5aa5);
        assert.equal(cart.read(0x7ffe), bank);
        assert.equal(cart.getByte(0x7ffe), bank >> 8);
        assert.equal(cart.getByte(0x7fff), bank & 255);
    }
});

test('decodes literal bus vectors and ignores unused address/data bits', () => {
    const cart = cartFor(rom);
    for (const [addr, word, bank] of [[0x6020, 0, 0x10], [0x6022, 0, 0x11], [0x6024, 0, 0x12],
        [0x6000, 0x0100, 0x1000], [0x6000, 0x0200, 0x2000], [0x7ffe, 0x0300, 0x3fff],
        [0x6000, 0x3000, 0], [0x6001, 0x01ff, 0x1000], [0x6000, 0xfcff, 0]]) {
        cart.write(addr, word);
        assert.equal(cart.read(0x7ffe), bank);
    }
});

test('restores the mapper and selected bank, then resets to bank zero', () => {
    const cart = cartFor(rom);
    select(cart, 0x2345);
    const restored = cartFor(Buffer.alloc(8192), {});
    restored.restoreState(cart.getState());
    assert.equal(restored.read(0x7ffe), 0x2345);
    select(restored, 0x1234);
    assert.equal(restored.read(0x7ffe), 0x1234);
    restored.reset();
    assert.equal(restored.read(0x7ffe), 0);
});

test('wraps smaller virtual cartridges and rejects invalid configurations', () => {
    const small = cartFor(rom.subarray(0, 32768));
    select(small, 0x3007);
    assert.equal(small.read(0x7ffe), 3);
    for (const size of [0, 8191, 8193, 3 * 8192]) {
        assert.throws(() => cartFor(Buffer.alloc(size)), /Gigacart requires/);
    }
    for (const mode of ['inverted', 'cruBankSwitched', 'ramFG99Paged', 'ramAt6000', 'ramAt7000']) {
        assert.throws(() => cartFor(Buffer.alloc(8192), {gigacart: true, [mode]: true}), /Gigacart requires/);
    }
});

test('all data widths map the complete window without signed 32-bit offsets', () => {
    // Sparse ROM stand-in: exercise real address arithmetic without allocating
    // eight GiB. Actual cartridge loading/playback is a separate integration test.
    for (let bits = 1; bits <= 8; bits++) {
        const length = 0x02000000 * 2 ** bits;
        const sparse = new Proxy({length, subarray: () => new Uint8Array(256)}, {
            get(target, key) {
                if (key in target) return target[key];
                const n = Number(key);
                return Number.isInteger(n) && n >= 0 && n < length
                    ? ((Math.floor(n / 8192) ^ n) & 255) : undefined;
            }
        });
        const cart = cartFor(sparse);
        for (let block = 0; block < 2 ** bits; block++) {
            for (const low of [0, 1, 0xfff]) {
                const bank = block * 4096 + low;
                select(cart, bank);
                for (const addr of [0x6000, 0x7000, 0x7ffe]) {
                    const off = bank * 8192 + addr - 0x6000;
                    assert.equal(cart.read(addr), (sparse[off] << 8) | sparse[off + 1]);
                }
            }
        }
    }
});

test('raw size detection distinguishes address-only ROMs from larger Gigacarts', () => {
    const {ModuleService} = require('../src/app/services/module.service.ts');
    for (const n of [0, 8192, 0x800000, 0x2000000, 0x6000000, 0x400000000]) {
        assert.equal(ModuleService.isGigacartSize(n), false);
    }
    for (const n of [0x4000000, 0x8000000, 0x20000000, 0x80000000, 0x200000000]) {
        assert.equal(ModuleService.isGigacartSize(n), true);
    }
});

test('mirrors the final 256 ROM bytes through GROM, wraps, and remains read-only', () => {
    const bootROM = Buffer.alloc(8192);
    for (let i = 0; i < 256; i++) bootROM[8192 - 256 + i] = (i * 73 + 19) & 255;
    const settings = new Settings();
    settings.setGRAMEnabled(true);
    const cart = cartFor(bootROM, {gigacart: true}, settings);
    assert.equal(cart.hasGROM(), true);
    setGROMAddress(cart, 0x8000);
    for (let i = 0; i < 0x2001; i++) {
        assert.equal(cart.readGROM(0x9800) >>> 8, (i * 73 + 19) & 255);
    }
    // An unrelated ROM bank selection does not change the GROM mapping.
    select(cart, 0x3000);
    setGROMAddress(cart, 0x805a);
    cart.writeGROM(0x9c00, 0xff00);
    setGROMAddress(cart, 0x815a);
    assert.equal(cart.readGROM(0x9800) >>> 8, (0x5a * 73 + 19) & 255);
    setGROMAddress(cart, 0x8000);
    cart.readGROM(0x9800);
    const restored = cartFor(Buffer.alloc(8192), {});
    restored.restoreState(cart.getState());
    assert.equal(restored.readGROM(0x9800) >>> 8, (73 + 19) & 255);
});

test('preserves explicitly supplied GROM data', () => {
    const software = new Software({gigacart: true});
    software.rom = Buffer.alloc(8192, 0xa5);
    software.grom = Buffer.from([0x12, 0x34]);
    const cart = new Cartridge(software, new Settings());
    setGROMAddress(cart, 0x6000);
    assert.equal(cart.readGROM(0x9800), 0x1200);
    assert.equal(cart.readGROM(0x9800), 0x3400);
});

test('RPK boot hardware and declared initial bank survive selection, reset and saved state', () => {
    const image = Buffer.alloc(32768);
    for (let bank = 0; bank < 4; bank++) image.writeUInt16BE(bank, bank * 8192);
    for (const initial of ['first', 'last', '8193']) {
        const options = gigacartOptions('gigacart-rom', '2', initial, image.length);
        const cart = cartFor(image, {gigacart: true, gigacartOptions: options});
        assert.equal(cart.hasGROM(), false, 'ROM-only must not fabricate a CPLD GROM');
        const expected = initial === 'first' ? 0 : initial === 'last' ? 3 : 1;
        assert.equal(cart.read(0x6000), expected);
        select(cart, 2);
        const restored = cartFor(Buffer.alloc(8192), {});
        restored.restoreState(cart.getState());
        assert.equal(restored.read(0x6000), 2);
        restored.reset();
        assert.equal(restored.read(0x6000), expected);
    }
    const sw = new Software({gigacart: true});
    sw.rom = image;
    sw.grom = Buffer.alloc(8192, 0x5a);
    sw.gigacartOptions = gigacartOptions('gigacart-grom', '2', null, image.length, sw.grom.length);
    const grom = new Cartridge(sw, new Settings());
    setGROMAddress(grom, 0x6000);
    assert.equal(grom.readGROM(0x9800), 0x5a00);
    setGROMAddress(grom, 0x8000);
    assert.equal(grom.readGROM(0x9800), 0, 'separate GROM has no CPLD mirror');
});

test('explicit RPK declarations reject mismatches instead of silently padding or ignoring settings', () => {
    for (const width of [null, '', '0', '9', '02', '2junk']) {
        assert.throws(() => gigacartOptions('gigacart-cpld', width, null, 8192), /bank_data_bits/);
    }
    for (let bits = 1; bits <= 8; bits++) {
        const bytes = 2 ** (25 + bits), banks = bytes / 8192;
        assert.equal(gigacartOptions('gigacart-cpld', String(bits), 'last', bytes).initialBank, banks - 1);
        assert.throws(() => gigacartOptions('gigacart-rom', String(bits), String(banks), 8192), /initial_bank/);
        assert.throws(() => gigacartOptions('gigacart-rom', String(bits), null, bytes * 2), /capacity/);
    }
    for (const initial of ['', '-1', '0x10', '1.5', 'first ', '99999999999999999999']) {
        assert.throws(() => gigacartOptions('gigacart-rom', '2', initial, 8192), /initial_bank/);
    }
    for (const size of [0, 8191, 8193, 24576]) {
        assert.throws(() => gigacartOptions('gigacart-rom', '2', null, size), /whole 8 KiB/);
    }
    assert.throws(() => gigacartOptions('gigacart-wrong', '2', null, 8192), /Unknown/);
    assert.throws(() => gigacartOptions('gigacart-grom', '2', null, 8192), /GROM socket/);
    for (const size of [1, 8193, 49152]) {
        assert.throws(() => gigacartOptions('gigacart-grom', '2', null, 8192, size), /GROM socket/);
    }
    for (const type of ['gigacart-rom', 'gigacart-cpld']) {
        assert.throws(() => gigacartOptions(type, '2', null, 8192, 8192), /GROM socket/);
    }
    assert.equal(gigacartOptions('gigacart', null, null, 0x20000000).dataBits, 4);
    assert.equal(gigacartOptions('gigacart', null, null, 0x800000).boot, 'cpld');
});

test('Gigacart RPK loader reads sockets without changing image length and reports missing resources', async () => {
    const {ModuleService} = require('../src/app/services/module.service.ts');
    const service = Object.create(ModuleService.prototype);
    // DOM-shaped fixtures isolate archive/resource resolution from XML parsing.
    const element = a => ({getAttribute: key => a[key] ?? null});
    const sockets = [element({id: 'rom_socket', uses: 'rom'})];
    const resources = [element({id: 'rom', file: 'cart.bin'})];
    const pcb = {...element({type: 'gigacart-rom', bank_data_bits: '2', initial_bank: 'last'}),
        getElementsByTagName: () => sockets, ownerDocument: {getElementsByTagName: () => resources}};
    const entries = [{filename: 'cart.bin', getData: async () => new Blob([Buffer.alloc(32768)])}];
    const sw = await service.loadGigacartRPK(pcb, entries);
    assert.equal(sw.rom.length, 32768);
    assert.deepEqual(sw.gigacartOptions, {boot: 'rom', dataBits: 2, initialBank: 16383});
    assert.equal(new Cartridge(sw, new Settings()).hasGROM(), false);
    await assert.rejects(service.loadGigacartRPK(pcb, []), /Missing/);
    await assert.rejects(service.loadGigacartRPK(pcb, [...entries, entries[0]]), /duplicate/);
    await assert.rejects(service.loadGigacartRPK(pcb,
        [{filename: 'cart.bin', getData: async () => new Blob([Buffer.alloc(8193)])}]), /whole 8 KiB/);
    sockets.push(sockets[0]);
    await assert.rejects(service.loadGigacartRPK(pcb, entries), /duplicate.*socket/);
    sockets.pop();
    sockets.push(element({id: 'ram_socket', uses: 'ram'}));
    await assert.rejects(service.loadGigacartRPK(pcb, entries), /one ROM socket/);
});

test('preserves ordinary, inverted, CRU, paged RAM and legacy saved-state behavior', () => {
    const normal = cartFor(rom.subarray(0, 32768), {});
    normal.write(0x6004, 0x0300);
    assert.equal(normal.read(0x7ffe), 2);
    const oldState = normal.getState();
    delete oldState.gigacart;
    const restored = cartFor(rom);
    restored.restoreState(oldState);
    restored.write(0x6002, 0x0300);
    assert.equal(restored.read(0x7ffe), 1);
    const inverted = cartFor(rom.subarray(0, 32768), {inverted: true});
    assert.equal(inverted.read(0x7ffe), 3);
    inverted.write(0x6002, 0);
    assert.equal(inverted.read(0x7ffe), 2);
    const cru = cartFor(rom.subarray(0, 32768), {cruBankSwitched: true});
    cru.write(0x6006, 0);
    assert.equal(cru.read(0x7ffe), 0);
    cru.writeCruBit(5, true);
    assert.equal(cru.read(0x7ffe), 2);
    const ram = cartFor(Buffer.alloc(32768), {ramFG99Paged: true, ramAt7000: true});
    ram.write(0x6802, 0);
    ram.write(0x7000, 0xbeef);
    ram.write(0x6800, 0);
    assert.equal(ram.read(0x7000), 0);
    ram.write(0x6802, 0);
    assert.equal(ram.read(0x7000), 0xbeef);
});
