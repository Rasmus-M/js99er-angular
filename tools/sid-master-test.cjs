#!/usr/bin/env node
// Run with npm run test:sidmaster.
const assert = require('node:assert/strict');
const {test} = require('node:test');
require('@angular/compiler');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({module: 'commonjs', moduleResolution: 'node', target: 'es2020'});
require('ts-node/register/transpile-only');
const {Log} = require('../src/app/classes/log.ts');
Log.getLog = () => ({info() {}, warn() {}, debug() {}, error() {}});
const {SIDMaster} = require('../src/app/emulator/classes/sid-master.ts');
const {Memory} = require('../src/app/emulator/classes/memory.ts');
const {CRU} = require('../src/app/emulator/classes/cru.ts');
const {Settings} = require('../src/app/classes/settings.ts');

const SAMPLE_RATE = 48000;
const cpu = {addCycles() {}};

function write(sid, reg, value) {
    // MOVB to an even address: read-modify-write, the read returns 0
    sid.writeMemoryMapped(0x5800 + (reg << 1), value << 8);
}

function render(sid, seconds) {
    const buffer = new Float32Array(Math.round(SAMPLE_RATE * seconds));
    sid.update(buffer, buffer.length);
    return buffer;
}

function startTone(sid, fn, waveform) {
    write(sid, 0x18, 0x0f);         // volume 15, no filter
    write(sid, 0x00, fn & 0xff);
    write(sid, 0x01, fn >> 8);
    write(sid, 0x02, 0x00);         // pulse width 50%
    write(sid, 0x03, 0x08);
    write(sid, 0x05, 0x00);         // attack 0, decay 0
    write(sid, 0x06, 0xf0);         // sustain 15, release 0
    write(sid, 0x04, waveform | 1); // gate on
}

test('decodes registers at >5800->5FFF and keeps the even byte', () => {
    const sid = new SIDMaster(SAMPLE_RATE);
    sid.writeMemoryMapped(0x5800, 0x12ab);
    assert.equal(sid.readRegister(0x00), 0x12);
    sid.writeMemoryMapped(0x5840, 0x34cd); // mirrored
    assert.equal(sid.readRegister(0x00), 0x34);
    sid.writeMemoryMapped(0x5ffa, 0x56ef); // mirror of >5838 (register >1D, ignored)
    sid.writeMemoryMapped(0x5fea, 0x78ef); // mirror of >5828 (register >15)
    assert.equal(sid.readRegister(0x15), 0x78);
    sid.writeMemoryMapped(0x5000, 0x9900); // outside the decoded range
    sid.writeMemoryMapped(0x4000, 0x9900);
    assert.equal(sid.readRegister(0x00), 0x34);
});

test('CRU access at >1000 and up deselects and resets, below >1000 selects', () => {
    const sid = new SIDMaster(SAMPLE_RATE);
    write(sid, 0x00, 0x42);
    sid.cruAccess(0x1100);
    assert.equal(sid.isSelected(), false);
    assert.equal(sid.readRegister(0x00), 0, 'deselecting resets the SID');
    write(sid, 0x00, 0x42);
    assert.equal(sid.readRegister(0x00), 0, 'writes are ignored while deselected');
    sid.cruAccess(0x1e00);
    assert.equal(sid.isSelected(), false);
    sid.cruAccess(0x0004);
    assert.equal(sid.isSelected(), true);
    write(sid, 0x00, 0x42);
    assert.equal(sid.readRegister(0x00), 0x42);
    sid.cruAccess(0x0ffe);
    assert.equal(sid.isSelected(), true);
    assert.equal(sid.readRegister(0x00), 0x42, 'staying selected does not reset');
});

test('CRU forwards every bit access as a bus address', () => {
    const console = {cyclesPassed: () => ({subscribe() {}}), getKeyboard() {}, getTape() {}, getCPU() {}};
    const cru = new CRU(console);
    cru.reset();
    const sid = new SIDMaster(SAMPLE_RATE);
    cru.setSIDMaster(sid);
    cru.writeBit(0x0880, true); // CRU address >1100
    assert.equal(sid.isSelected(), false);
    cru.readBit(2);             // TMS9901 VDP interrupt bit
    assert.equal(sid.isSelected(), true);
});

test('a selected SID Master does not hide another card\'s DSR ROM', () => {
    const console = {getCRU: () => ({registerCruDevice() {}, deregisterCruDevice() {}})};
    const memory = new Memory(console, new Settings(), () => {});
    const sid = new SIDMaster(SAMPLE_RATE);
    const dsr = new Array(0x2000).fill(0);
    dsr[0x1800] = 0xaa;
    dsr[0x1801] = 0x55;
    const card = {
        getId: () => 'TEST', getCruAddress: () => 0x1100, readCruBit: () => false, writeCruBit() {},
        isEnabled: () => true, getDSR: () => dsr, getDSRBankOffset: () => 0
    };
    memory.registerPeripheralCard(card);
    memory.setSIDMaster(sid);
    assert.equal(memory.readPeripheralCard(0x5800, cpu), 0xaa55);
    memory.writePeripheralCard(0x5808, 0x1100, cpu);
    assert.equal(sid.readRegister(0x04), 0x11);
});

test('is silent after reset', () => {
    const sid = new SIDMaster(SAMPLE_RATE);
    const buffer = render(sid, 0.1);
    assert.ok(buffer.every(s => Math.abs(s) < 1e-6), 'output should be 0');
});

test('produces a triangle at the programmed frequency', () => {
    for (const fn of [0x1000, 0x2000, 0x4000]) {
        const sid = new SIDMaster(SAMPLE_RATE);
        startTone(sid, fn, 0x10);
        render(sid, 0.05); // let the attack finish
        const buffer = render(sid, 1);
        let mean = 0;
        for (const s of buffer) {
            mean += s;
        }
        mean /= buffer.length;
        let crossings = 0;
        for (let i = 1; i < buffer.length; i++) {
            if (buffer[i - 1] < mean && buffer[i] >= mean) {
                crossings++;
            }
        }
        const expected = fn * SIDMaster.CLOCK / 16777216;
        assert.ok(Math.abs(crossings - expected) <= 2, `Fn ${fn.toString(16)}: ${crossings} Hz, expected ${expected.toFixed(1)} Hz`);
        const peak = buffer.reduce((m, s) => Math.max(m, Math.abs(s - mean)), 0);
        assert.ok(peak > 0.05 && peak <= 1, `Fn ${fn.toString(16)}: peak ${peak}`);
    }
});

test('produces pulse, sawtooth and noise, and releases to silence', () => {
    for (const waveform of [0x20, 0x40, 0x80]) {
        const sid = new SIDMaster(SAMPLE_RATE);
        startTone(sid, 0x1800, waveform);
        const buffer = render(sid, 0.2);
        const min = buffer.reduce((m, s) => Math.min(m, s));
        const max = buffer.reduce((m, s) => Math.max(m, s));
        assert.ok(max - min > 0.1, `waveform ${waveform.toString(16)} range ${min}..${max}`);
        write(sid, 0x04, waveform); // gate off, release 0 (~9 ms)
        render(sid, 0.1);
        const tail = render(sid, 0.05);
        const tailRange = tail.reduce((m, s) => Math.max(m, s)) - tail.reduce((m, s) => Math.min(m, s));
        assert.ok(tailRange < 0.02, `waveform ${waveform.toString(16)} should release, range ${tailRange}`);
    }
});

test('save state restores the registers', () => {
    const sid = new SIDMaster(SAMPLE_RATE);
    startTone(sid, 0x1234, 0x40);
    const state = JSON.parse(JSON.stringify(sid.getState()));
    const restored = new SIDMaster(SAMPLE_RATE);
    restored.restoreState(state);
    for (let reg = 0; reg <= 0x18; reg++) {
        assert.equal(restored.readRegister(reg), sid.readRegister(reg), `register ${reg}`);
    }
});

test('changing the sample rate keeps the registers and the pitch', () => {
    const sid = new SIDMaster(44100);
    startTone(sid, 0x2000, 0x10);
    sid.setSampleRate(SAMPLE_RATE);
    assert.equal(sid.readRegister(0x01), 0x20);
    assert.equal(sid.readRegister(0x04), 0x11);
    render(sid, 0.05);
    const buffer = render(sid, 1);
    const mean = buffer.reduce((a, s) => a + s, 0) / buffer.length;
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
        if (buffer[i - 1] < mean && buffer[i] >= mean) {
            crossings++;
        }
    }
    const expected = 0x2000 * SIDMaster.CLOCK / 16777216;
    assert.ok(Math.abs(crossings - expected) <= 2, `${crossings} Hz, expected ${expected.toFixed(1)} Hz`);
});
