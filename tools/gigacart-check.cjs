#!/usr/bin/env node
// Exercise the real TypeScript mapper; no duplicate bank decoder in this tool.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('@angular/compiler');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({module: 'commonjs', moduleResolution: 'node', target: 'es2020'});
require('ts-node/register/transpile-only');
const {Cartridge} = require('../src/app/emulator/classes/cartridge.ts');
const {Software} = require('../src/app/classes/software.ts');
const {Settings} = require('../src/app/classes/settings.ts');

const hex = n => n.toString(16).toUpperCase().padStart(4, '0');
const representative = [0, 1, 2, 0xfff, 0x1000, 0x1001, 0x1fff, 0x2000, 0x2001, 0x2fff, 0x3000, 0x3001, 0x3ffe, 0x3fff];
function cartFor(rom, options = {gigacart: true}) {
    const software = new Software(options);
    software.rom = rom;
    return new Cartridge(software, new Settings());
}
// These are the production SELBNK assembly operations, in the same order.
function select(cart, bank) {
    cart.write(0x6000 + ((bank & 0xfff) << 1), (bank >> 4) & 0x0f00);
}
function checksum(cart) {
    let sum = 0;
    for (let addr = 0x6000; addr < 0x8000; addr += 2) sum = (sum + cart.read(addr)) & 0xffff;
    return sum;
}
function directSum(rom, base, length, initial = 0) {
    let sum = initial;
    for (let i = 0; i < length; i += 2) sum = (sum + rom.readUInt16BE(base + i)) & 0xffff;
    return sum;
}
function selfTest() {
    const rom = Buffer.alloc(0x08000000);
    for (let bank = 0; bank < 0x4000; bank++) {
        rom.writeUInt16BE(bank ^ 0xa55a, bank * 8192);
        rom.writeUInt16BE(bank, bank * 8192 + 8190);
    }
    const cart = cartFor(rom);
    for (let bank = 0; bank < 0x4000; bank++) {
        select(cart, bank);
        assert.equal(cart.read(0x6000), bank ^ 0xa55a);
        assert.equal(cart.read(0x7ffe), bank);
        assert.equal(cart.getByte(0x7fff), bank & 255);
    }
    // Literal bus vectors catch data-bit swaps and the erroneous >>12 proposal.
    for (const [addr, word, bank] of [[0x6020, 0, 0x10], [0x6022, 0, 0x11], [0x6024, 0, 0x12],
        [0x6000, 0x0100, 0x1000], [0x6000, 0x0200, 0x2000], [0x7ffe, 0x0300, 0x3fff],
        [0x6000, 0x3000, 0], [0x6001, 0x01ff, 0x1000], [0x6000, 0xfcff, 0]]) {
        cart.write(addr, word);
        assert.equal(cart.read(0x7ffe), bank);
    }
    select(cart, 0x2345);
    const restored = cartFor(Buffer.alloc(8192));
    restored.restoreState(cart.getState());
    assert.equal(restored.read(0x7ffe), 0x2345);
    select(restored, 0x1234);
    assert.equal(restored.read(0x7ffe), 0x1234);
    restored.reset();
    assert.equal(restored.read(0x7ffe), 0);
    // Smaller explicitly selected virtual carts wrap through their bank mask.
    const small = cartFor(rom.subarray(0, 32768));
    select(small, 0x3007);
    assert.equal(small.read(0x7ffe), 3);
    assert.throws(() => cartFor(Buffer.alloc(3 * 8192)), /Gigacart requires/);
    assert.throws(() => cartFor(Buffer.alloc(8193)), /Gigacart requires/);
    assert.throws(() => cartFor(Buffer.alloc(8192), {gigacart: true, inverted: true}), /Gigacart requires/);
    // Existing address-only, inverted, CRU, and paged RAM behavior is unchanged.
    const normal = cartFor(rom.subarray(0, 32768), {});
    normal.write(0x6004, 0x0300);
    assert.equal(normal.read(0x7ffe), 2);
    const oldState = normal.getState(); delete oldState.gigacart;
    restored.restoreState(oldState); restored.write(0x6002, 0x0300);
    assert.equal(restored.read(0x7ffe), 1);
    const inverted = cartFor(rom.subarray(0, 32768), {inverted: true});
    assert.equal(inverted.read(0x7ffe), 3);
    inverted.write(0x6002, 0); assert.equal(inverted.read(0x7ffe), 2);
    const cru = cartFor(rom.subarray(0, 32768), {cruBankSwitched: true});
    cru.write(0x6006, 0); assert.equal(cru.read(0x7ffe), 0);
    cru.writeCruBit(5, true); assert.equal(cru.read(0x7ffe), 2);
    const ram = cartFor(Buffer.alloc(32768), {ramFG99Paged: true, ramAt7000: true});
    ram.write(0x6802, 0); ram.write(0x7000, 0xbeef);
    ram.write(0x6800, 0); assert.equal(ram.read(0x7000), 0);
    ram.write(0x6802, 0); assert.equal(ram.read(0x7000), 0xbeef);
    console.log('PASS: all 16,384 synthetic banks, literal bus vectors, reset/state, size validation, legacy mapper regressions.');
}
function readExpected(file) {
    const entries = new Map();
    for (const [i, line] of fs.readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
        if (!line.trim() || /^\s*#/.test(line)) continue;
        // Accept "0000 ABCD", ">0000,>ABCD", or "BANK 0000 SUM ABCD".
        const bytes = line.match(/^\s*([\da-f]{2})\s+([\da-f]{2})\s+([\da-f]{2})\s+([\da-f]{2})\s*$/i);
        const match = bytes ? [bytes[0], bytes[1] + bytes[2], bytes[3] + bytes[4]] :
            line.match(/^\s*(?:BANK\s+)?(?:>|0x)?([\da-f]{4})[\s,:=]+(?:SUM\s+)?(?:>|0x)?([\da-f]{4})\s*$/i);
        if (!match) throw new Error(`Unrecognized checksum row ${i + 1}; use BANK SUM hexadecimal columns or # comments.`);
        const bank = parseInt(match[1], 16);
        if (bank > 0x3fff || entries.has(bank)) throw new Error(`Invalid/duplicate bank at row ${i + 1}`);
        entries.set(bank, parseInt(match[2], 16));
    }
    if (!entries.size) throw new Error('Expected-checksum file is empty.');
    return entries;
}
function scan(romPath, expectedPath, referencePath, reportPath, byteReportPath) {
    const rom = fs.readFileSync(romPath);
    assert.equal(rom.length, 0x08000000, 'Dragon\'s Lair image must be exactly 128 MiB');
    const cart = cartFor(rom);
    const expected = expectedPath ? readExpected(expectedPath) : null;
    const rows = [], mismatches = [], pageFailures = [];
    let matchingEndWords = 0;
    for (let bank = 0; bank < 0x4000; bank++) {
        const base = bank * 8192;
        select(cart, bank);
        assert.equal(cart.getState().currentBank, bank);
        // Full byte comparison verifies order and offsets in addition to additive sums.
        for (let offset = 0; offset < 8192; offset += 2) {
            assert.equal(cart.read(0x6000 + offset), rom.readUInt16BE(base + offset), `Bank ${hex(bank)}, offset ${hex(offset)}`);
        }
        const sum = checksum(cart);
        assert.equal(sum, directSum(rom, base, 8192));
        const end = cart.read(0x7ffe);
        if (end === bank) matchingEndWords++;
        if (directSum(rom, base, 256, bank) !== end) pageFailures.push(hex(bank));
        if (expected?.has(bank) && expected.get(bank) !== sum) mismatches.push(hex(bank));
        rows.push({bank: hex(bank), sum: hex(sum), end: hex(end), partial: hex(directSum(rom, base, 256, bank))});
    }
    // Forced bank mapping is also available in this Node diagnostic without an emulator UI hook.
    for (const bank of [0x3ffe, 0x3fff]) {
        cart.setCurrentCartBank(bank);
        assert.equal(cart.read(0x7ffe), bank);
    }
    // Read through the actual GROM address/data port, including 256-byte mirroring.
    cart.readGROM(0x9802); // synchronize the two-byte address sequence
    cart.writeGROM(0x9c02, 0x8000); cart.writeGROM(0x9c02, 0);
    for (let i = 0; i < 0x2000; i++) {
        assert.equal(cart.readGROM(0x9800) >>> 8, rom[rom.length - 256 + (i & 255)]);
    }
    const sha256 = crypto.createHash('sha256').update(rom).digest('hex');
    const report = {rom: path.resolve(romPath), bytes: rom.length, sha256,
        mapperBanksVerified: rows.length, mapperWordsVerified: rows.length * 4096,
        pageChecksumFailures: pageFailures, matchingEndWords,
        expectedSource: expectedPath ? path.resolve(expectedPath) : null,
        expectedProvenance: expectedPath ? 'Reference provenance is not independently verified; dump-derived references are not hardware evidence.' : null,
        expectedBanksCompared: expected?.size || 0, expectedMismatches: mismatches,
        representative: representative.map(bank => rows[bank])};
    if (referencePath) {
        fs.writeFileSync(referencePath, `# Tursi full-bank sums COMPUTED FROM THIS DUMP; not independent hardware evidence\n# SHA256 ${sha256}\n# BANK SUM (hex), 4096 big-endian words per bank modulo 65536\n` + rows.map(r => `${r.bank} ${r.sum}`).join('\n') + '\n');
    }
    if (byteReportPath) {
        const pair = word => word.slice(0, 2) + ' ' + word.slice(2);
        fs.writeFileSync(byteReportPath,
            `DRAGON'S LAIR CHECKSUM COMPARISON - ALL VALUES ARE HEX BYTE PAIRS\n` +
            `Computed from DRAGONS_LAIR.bin; NOT independently measured from hardware.\nSHA256 ${sha256}\n` +
            `Each bank is 8192 bytes. BANK is bank high byte then low byte.\n` +
            `PARTIAL starts with BANK and sums byte pairs at offsets 00 00 through 00 FF.\n` +
            `STORED is the high byte at offset 1F FE and low byte at offset 1F FF.\n` +
            `FULL starts at 00 00 and sums all byte pairs through 1F FE / 1F FF, including STORED.\n` +
            `For each pair: add the odd-offset byte to SUM_LO; carry overflow into SUM_HI,\n` +
            `then add the even-offset byte to SUM_HI. Keep each sum byte within 00-FF.\n\n` +
            `BANK   PARTIAL  STORED  CHECK  FULL\nHI LO  HI LO    HI LO          HI LO\n` +
            rows.map(r => `${pair(r.bank)}  ${pair(r.partial)}    ${pair(r.end)}  ${r.partial === r.end ? 'PASS' : 'FAIL'}   ${pair(r.sum)}`).join('\n') + '\n');
    }
    if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    if (pageFailures.length || mismatches.length) process.exitCode = 1;
}
try {
    const options = {};
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (!['--rom', '--expected', '--write-reference', '--report', '--write-byte-report'].includes(args[i]) || !args[i + 1]) {
            throw new Error('Usage: node tools/gigacart-check.cjs [--rom image.bin] [--expected sums.txt] [--write-reference sums.txt] [--report report.json] [--write-byte-report bytes.txt]');
        }
        options[args[i]] = args[++i];
    }
    if (!options['--rom'] && Object.keys(options).length) throw new Error('--rom is required for checksum files/reports');
    const inputs = ['--rom', '--expected'].filter(k => options[k]).map(k => path.resolve(options[k]).toLowerCase());
    const outputs = ['--write-reference', '--report', '--write-byte-report'].filter(k => options[k]).map(k => path.resolve(options[k]).toLowerCase());
    if (outputs.some(p => inputs.includes(p)) || new Set(outputs).size !== outputs.length) {
        throw new Error('Output paths must be distinct and must never overwrite ROM or expected-checksum inputs.');
    }
    selfTest();
    if (options['--rom']) scan(options['--rom'], options['--expected'], options['--write-reference'], options['--report'], options['--write-byte-report']);
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
