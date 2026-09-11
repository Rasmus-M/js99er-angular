const assert = require('node:assert/strict');
const {test} = require('node:test');
require('@angular/compiler');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({module:'commonjs',moduleResolution:'node',target:'es2020'});
require('ts-node/register/transpile-only');
const {Log} = require('../src/app/classes/log.ts');
Log.getLog = () => ({info(){},warn(){}});
const {Tape} = require('../src/app/emulator/classes/tape.ts');
function tapeAt(rate) {
    global.AudioContext = class {sampleRate = rate};
    const tape = new Tape();tape.reset();return tape;
}
test('sample playback retains CPU time at 44.1, 48 and 96 kHz', () => {
    for (const rate of [44100,48000,96000]) {
        const tape=tapeAt(rate);
        tape.setAudioGate(.25,0);
        for(let n=1;n<=500;n++) tape.setAudioGate(n%2 ? .75 : .25,n*224);
        const queued=(tape.audioGateBufferEnd-tape.audioGateBufferStart+4096)%4096;
        assert.equal(queued,Math.floor(112000*rate/3000000),`rate ${rate}`);
    }
});
test('underflow holds the last played value rather than a stale ring-buffer slot', () => {
    const tape=tapeAt(48000);
    tape.setAudioGate(.25,0);tape.setAudioGate(.75,625);
    const out=new Float32Array(20);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===.25));
});
test('a full ring buffer retains recent samples instead of looking empty', () => {
    const tape=tapeAt(48000);
    tape.setAudioGate(.25,0);
    for(let n=1;n<=6000;n++) tape.setAudioGate(.25,n*224);
    const queued=(tape.audioGateBufferEnd-tape.audioGateBufferStart+4096)%4096;
    assert.equal(queued,4095);
    const out=new Float32Array(100);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===.25));
});
test('reset and state restoration discard old queued audio', () => {
    const tape=tapeAt(48000);
    tape.setAudioGate(.75,0);tape.setAudioGate(.25,224);
    tape.reset();
    const out=new Float32Array(10);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===0));
    const state=tape.getState();
    tape.setAudioGate(.75,0);tape.setAudioGate(.25,224);
    tape.restoreState(state);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===0));
});
test('moving the CPU clock backwards starts a fresh audio stream', () => {
    const tape=tapeAt(48000);
    tape.setAudioGate(.75,10000);tape.setAudioGate(.25,10224);
    tape.setAudioGate(.5,0);
    const out=new Float32Array(10);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===0));
    tape.setAudioGate(.25,625);tape.updateSoundBuffer(out);
    assert(out.every(x=>x===.5));
});
