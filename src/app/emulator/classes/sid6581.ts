// license:BSD-3-Clause
// copyright-holders:Peter Trauner
/*
  MOS 6581 SID emulation.

  TypeScript port of the SID engine MAME used before it switched to reSIDfp
  (src/devices/sound/sid.cpp, sidvoice.cpp, sidenvel.cpp and side6581.h).

  copyright peter trauner

  based on michael schwend's sid play

  Noise generation algorithm is used courtesy of Asger Alstrup Nielsen.
  His original publication can be found on the SID home page.

  Noise table optimization proposed by Phillip Wooller. The output of
  each table does not differ.

  Accurate volume envelope times as of November 1994 are used
  courtesy of George W. Taylor <aa601@cfn.cs.dal.ca>, <yurik@io.org>

  Copyright (c) Peter Trauner

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  1. Redistributions of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.
  2. Redistributions in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution.
  3. Neither the name of the copyright holder nor the names of its
     contributors may be used to endorse or promote products derived from
     this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.

  Differences from the MAME code:
  - The GPL-licensed combined waveform tables (sidw6581.h) are not used.
    Combined waveforms are approximated by AND-ing the 12-bit waveforms and
    keeping only bits whose neighbouring bits are also set.
  - reset() also clears the registers, like the chip's RES pin.
  - The mixer output has no -0.5 DC offset.
*/

type WaveProc = (v: SIDOperator) => void;
type OutProc = (v: SIDOperator) => number;
type ADSRProc = (v: SIDOperator) => number;

const MAX_VOICES = 3;
const NOISE_SEED = 0x7ffff8;

const ENVE_STARTATTACK = 0;
const ENVE_STARTRELEASE = 2;
const ENVE_ATTACK = 4;
const ENVE_DECAY = 6;
const ENVE_SUSTAIN = 8;
const ENVE_RELEASE = 10;
const ENVE_SUSTAINDECAY = 12;
const ENVE_MUTE = 14;
const ENVE_SHORTATTACK = 16;
const ENVE_ALTER = 32;

function toInt8(x: number): number {
    return (Math.trunc(x) << 24) >> 24;
}

// ---------------------------------------------------------------- Tables

const masterVolumeLevels = [
    0, 17, 34, 51, 68, 85, 102, 119,
    136, 153, 170, 187, 204, 221, 238, 255
];

/* milliseconds */
const attackTimes = [
    2.2528606, 8.0099577, 15.7696042, 23.7795619, 37.2963655, 55.0684591,
    66.8330845, 78.3473987,
    98.1219818, 244.554021, 489.108042, 782.472742, 977.715461, 2933.64701,
    4889.07793, 7822.72493
];

/* milliseconds */
const decayReleaseTimes = [
    8.91777693, 24.594051, 48.4185907, 73.0116639, 114.512475, 169.078356,
    205.199432, 240.551975,
    301.266125, 750.858245, 1501.71551, 2402.43682, 3001.89298, 9007.21405,
    15010.998, 24018.2111
];

// Hardware: C64 C PAL, MOS 6581R4 1686 S
const releaseTab = new Uint8Array([
    255, 255, 254, 254, 253, 253, 252, 252, 251, 251, 250, 250, 249, 249, 248, 248, 247, 247, 246, 246,
    245, 245, 244, 244, 243, 243, 242, 242, 241, 241, 240, 240, 239, 239, 238, 238, 237, 237, 236, 236,
    235, 235, 234, 234, 233, 233, 232, 232, 231, 231, 230, 230, 229, 229, 228, 228, 227, 227, 226, 226,
    225, 225, 224, 224, 223, 223, 222, 222, 221, 221, 220, 220, 219, 219, 218, 218, 217, 217, 216, 216,
    215, 215, 214, 214, 213, 213, 212, 212, 211, 211, 210, 210, 209, 209, 208, 208, 207, 207, 206, 206,
    205, 205, 204, 204, 203, 203, 202, 202, 201, 201, 200, 200, 199, 199, 198, 198, 197, 197, 196, 196,
    195, 195, 194, 194, 193, 193, 192, 192, 191, 191, 190, 190, 189, 189, 188, 188, 187, 187, 186, 186,
    185, 185, 184, 184, 183, 183, 182, 182, 181, 181, 180, 180, 179, 179, 178, 178, 177, 177, 176, 176,
    175, 175, 174, 174, 173, 173, 172, 172, 171, 171, 170, 170, 169, 169, 168, 168, 167, 167, 166, 166,
    165, 165, 164, 164, 163, 163, 162, 162, 161, 161, 160, 160, 159, 159, 158, 158, 157, 157, 156, 156,
    155, 155, 154, 154, 153, 153, 152, 152, 151, 151, 150, 150, 149, 149, 148, 148, 147, 147, 146, 146,
    145, 145, 144, 144, 143, 143, 142, 142, 141, 141, 140, 140, 139, 139, 138, 138, 137, 137, 136, 136,
    135, 135, 134, 134, 133, 133, 132, 132, 131, 131, 130, 130, 129, 129, 128, 128, 127, 127, 126, 126,
    125, 125, 124, 124, 123, 123, 122, 122, 121, 121, 120, 120, 119, 119, 118, 118, 117, 117, 116, 116,
    115, 115, 114, 114, 113, 113, 112, 112, 111, 111, 110, 110, 109, 109, 108, 108, 107, 107, 106, 106,
    105, 105, 104, 104, 103, 103, 102, 102, 101, 101, 100, 100, 99, 99, 98, 98, 97, 97, 96, 96,
    95, 95, 94, 94, 94, 94, 93, 93, 93, 93, 92, 92, 92, 92, 91, 91, 91, 91, 90, 90,
    90, 90, 89, 89, 89, 89, 88, 88, 88, 88, 87, 87, 87, 87, 86, 86, 86, 86, 85, 85,
    85, 85, 84, 84, 84, 84, 83, 83, 83, 83, 82, 82, 82, 82, 81, 81, 81, 81, 80, 80,
    80, 80, 79, 79, 79, 79, 78, 78, 78, 78, 77, 77, 77, 77, 76, 76, 76, 76, 75, 75,
    75, 75, 74, 74, 74, 74, 73, 73, 73, 73, 72, 72, 72, 72, 71, 71, 71, 71, 70, 70,
    70, 70, 69, 69, 69, 69, 68, 68, 68, 68, 67, 67, 67, 67, 66, 66, 66, 66, 65, 65,
    65, 65, 64, 64, 64, 64, 63, 63, 63, 63, 62, 62, 62, 62, 61, 61, 61, 61, 60, 60,
    60, 60, 59, 59, 59, 59, 58, 58, 58, 58, 57, 57, 57, 57, 56, 56, 56, 56, 55, 55,
    55, 55, 55, 55, 55, 55, 54, 54, 54, 54, 54, 54, 54, 54, 53, 53, 53, 53, 53, 53,
    53, 53, 52, 52, 52, 52, 52, 52, 52, 52, 51, 51, 51, 51, 51, 51, 51, 51, 50, 50,
    50, 50, 50, 50, 50, 50, 49, 49, 49, 49, 49, 49, 49, 49, 48, 48, 48, 48, 48, 48,
    48, 48, 47, 47, 47, 47, 47, 47, 47, 47, 46, 46, 46, 46, 46, 46, 46, 46, 45, 45,
    45, 45, 45, 45, 45, 45, 44, 44, 44, 44, 44, 44, 44, 44, 43, 43, 43, 43, 43, 43,
    43, 43, 42, 42, 42, 42, 42, 42, 42, 42, 41, 41, 41, 41, 41, 41, 41, 41, 40, 40,
    40, 40, 40, 40, 40, 40, 39, 39, 39, 39, 39, 39, 39, 39, 38, 38, 38, 38, 38, 38,
    38, 38, 37, 37, 37, 37, 37, 37, 37, 37, 36, 36, 36, 36, 36, 36, 36, 36, 35, 35,
    35, 35, 35, 35, 35, 35, 34, 34, 34, 34, 34, 34, 34, 34, 33, 33, 33, 33, 33, 33,
    33, 33, 32, 32, 32, 32, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 31, 30, 30,
    30, 30, 30, 30, 30, 30, 29, 29, 29, 29, 29, 29, 29, 29, 28, 28, 28, 28, 28, 28,
    28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 25, 25, 25, 25, 25, 25,
    25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19,
    19, 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18,
    18, 18, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 16, 16,
    16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,
    14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
    12, 12, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0
]);

const attackTabLen = 255;
const releaseTabLen = releaseTab.length;
const releasePos = new Uint32Array(256);
const masterAmplModTable = new Uint16Array(16 * 256);

const triangleTable = new Uint8Array(4096);
const sawtoothTable = new Uint8Array(4096);
const squareTable = new Uint8Array(2 * 4096);
const waveform30 = new Uint8Array(4096);
const waveform50 = new Uint8Array(4096 + 4096);
const waveform60 = new Uint8Array(4096 + 4096);
const waveform70 = new Uint8Array(4096 + 4096);
const noiseTableMSB = new Uint8Array(1 << 8);
const noiseTableMID = new Uint8Array(1 << 8);
const noiseTableLSB = new Uint8Array(1 << 8);

/* 8-bit volume modulation tables. */
const ampMod1x8 = new Int8Array(256 * 256);

function initStaticTables() {
    // Mixer
    const filterAmpl = 0.7;
    let uk = 0;
    for (let si = 0; si < 256; si++) {
        for (let sj = -128; sj < 128; sj++, uk++) {
            ampMod1x8[uk] = toInt8(Math.trunc((si * sj) / 255) * filterAmpl);
        }
    }

    // Waveforms
    let k = 0;
    for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 8; j++) {
            triangleTable[k++] = i;
        }
    }
    for (let i = 255; i >= 0; i--) {
        for (let j = 0; j < 8; j++) {
            triangleTable[k++] = i;
        }
    }
    k = 0;
    for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 16; j++) {
            sawtoothTable[k++] = i;
        }
    }
    k = 0;
    for (let i = 0; i < 4096; i++) {
        squareTable[k++] = 255; // my estimation; especial for digi sound
    }
    for (let i = 0; i < 4096; i++) {
        squareTable[k++] = 0;
    }

    // Combined waveforms (approximation, see header). The pulse variants are
    // indexed by waveStep + pulse width, and are zero in the upper half.
    const tri12 = (i: number) => (((i & 0x800) ? (i ^ 0xfff) : i) << 1) & 0xfff;
    const combine = (x: number) => ((x & (x << 1) & (x >> 1)) & 0xfff) >> 4;
    for (let i = 0; i < 4096; i++) {
        waveform30[i] = combine(tri12(i) & i);
        waveform50[i] = combine(tri12(i));
        waveform60[i] = combine(i);
        waveform70[i] = combine(tri12(i) & i);
    }

    // Noise
    for (let ni = 0; ni < 256; ni++) {
        noiseTableLSB[ni] =
            ((ni >> (7 - 2)) & 0x04) |
            ((ni >> (4 - 1)) & 0x02) |
            ((ni >> (2 - 0)) & 0x01);
        noiseTableMID[ni] =
            ((ni >> (13 - 8 - 4)) & 0x10) |
            ((ni << (3 - (11 - 8))) & 0x08);
        noiseTableMSB[ni] =
            ((ni << (7 - (22 - 16))) & 0x80) |
            ((ni << (6 - (20 - 16))) & 0x40) |
            ((ni << (5 - (16 - 16))) & 0x20);
    }

    // Envelope
    for (let i = 0; i < 256; i++) {
        let j = 0;
        while (j < releaseTabLen && releaseTab[j] > i) {
            j++;
        }
        releasePos[i] = j < releaseTabLen ? j : releaseTabLen - 1;
    }
    k = 0;
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 256; j++) {
            // measured values
            let tmpVol = Math.trunc((293.0 * (1 - Math.exp(j / -130.0))) + 4.0);
            if (j === 0) {
                tmpVol = 0;
            }
            if (tmpVol > 255) {
                tmpVol = 255;
            }
            /* Want the modulated volume value in the high byte. */
            masterAmplModTable[k++] = Math.trunc((tmpVol * masterVolumeLevels[i]) / 255) << 8;
        }
    }
}

initStaticTables();

// ---------------------------------------------------------------- Waveforms

function waveAdvance(v: SIDOperator) {
    v.waveStepPnt += v.waveStepAddPnt;
    v.waveStep += v.waveStepAdd;
    if (v.waveStepPnt > 65535) {
        v.waveStep++;
    }
    v.waveStepPnt &= 0xffff;
    v.waveStep &= 4095;
}

function noiseShift(v: SIDOperator) {
    v.noiseReg = ((v.noiseReg << 1) | (((v.noiseReg >>> 22) ^ (v.noiseReg >>> 17)) & 1)) >>> 0;
}

function noiseOutput(v: SIDOperator) {
    v.noiseOutput =
        noiseTableLSB[v.noiseReg & 0xff] |
        noiseTableMID[(v.noiseReg >>> 8) & 0xff] |
        noiseTableMSB[(v.noiseReg >>> 16) & 0xff];
}

function noiseAdvance(v: SIDOperator) {
    v.noiseStep += v.noiseStepAdd;
    if (v.noiseStep >= (1 << 20)) {
        v.noiseStep -= (1 << 20);
        noiseShift(v);
        noiseOutput(v);
    }
}

function noiseAdvanceHp(v: SIDOperator) {
    let tmp = v.noiseStepAdd;
    while (tmp >= (1 << 20)) {
        tmp -= (1 << 20);
        noiseShift(v);
    }
    v.noiseStep += tmp;
    if (v.noiseStep >= (1 << 20)) {
        v.noiseStep -= (1 << 20);
        noiseShift(v);
    }
    noiseOutput(v);
}

const triangle = (v: SIDOperator) => triangleTable[v.waveStep];
const sawtooth = (v: SIDOperator) => sawtoothTable[v.waveStep];
const square = (v: SIDOperator) => squareTable[v.waveStep + v.pulseIndex];
const triSaw = (v: SIDOperator) => waveform30[v.waveStep];
const triSquare = (v: SIDOperator) => waveform50[v.waveStep + v.SIDpulseWidth];
const sawSquare = (v: SIDOperator) => waveform60[v.waveStep + v.SIDpulseWidth];
const triSawSquare = (v: SIDOperator) => waveform70[v.waveStep + v.SIDpulseWidth];

function sidMode00(v: SIDOperator) {
    v.output = (v.filtIO - 0x80) & 0xff;
    waveAdvance(v);
}

function sidMode10(v: SIDOperator) {
    v.output = triangle(v);
    waveAdvance(v);
}

function sidMode20(v: SIDOperator) {
    v.output = sawtooth(v);
    waveAdvance(v);
}

function sidMode30(v: SIDOperator) {
    v.output = triSaw(v);
    waveAdvance(v);
}

function sidMode40(v: SIDOperator) {
    v.output = square(v);
    waveAdvance(v);
}

function sidMode50(v: SIDOperator) {
    v.output = triSquare(v);
    waveAdvance(v);
}

function sidMode60(v: SIDOperator) {
    v.output = sawSquare(v);
    waveAdvance(v);
}

function sidMode80(v: SIDOperator) {
    v.output = v.noiseOutput;
    waveAdvance(v);
    noiseAdvance(v);
}

function sidMode80hp(v: SIDOperator) {
    v.output = v.noiseOutput;
    waveAdvance(v);
    noiseAdvanceHp(v);
}

function sidModeLock(v: SIDOperator) {
    v.noiseIsLocked = true;
    v.output = (v.filtIO - 0x80) & 0xff;
    waveAdvance(v);
}

function sidMode14(v: SIDOperator) {
    v.output = v.modulator.waveStep < 2048 ? triangle(v) : 0xff ^ triangle(v);
    waveAdvance(v);
}

function sidMode34(v: SIDOperator) {
    v.output = v.modulator.waveStep < 2048 ? triSaw(v) : 0xff ^ triSaw(v);
    waveAdvance(v);
}

function sidMode54(v: SIDOperator) {
    v.output = v.modulator.waveStep < 2048 ? triSquare(v) : 0xff ^ triSquare(v);
    waveAdvance(v);
}

/* MOS-6581 (no 70). Entry 8 is chosen per voice (normal or high pitch noise). */
const sidModeNormalTable: WaveProc[] = [
    sidMode00, sidMode10, sidMode20, sidMode30, sidMode40, sidMode50, sidMode60, sidMode00,
    sidMode80, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock
];

/* MOS-6581 (no 74) */
const sidModeRingTable: WaveProc[] = [
    sidMode00, sidMode14, sidMode00, sidMode34, sidMode00, sidMode54, sidMode00, sidMode00,
    sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock, sidModeLock
];

// ---------------------------------------------------------------- Filter

function waveCalcFilter(v: SIDOperator) {
    if (v.filtEnabled) {
        const filter = v.sid.filter;
        if (filter.type !== 0) {
            if (filter.type === 0x20) {
                v.filtLow += v.filtRef * filter.dy;
                let tmp = v.filtIO - v.filtLow;
                tmp -= v.filtRef * filter.resDy;
                v.filtRef += tmp * filter.dy;
                v.filtIO = toInt8(v.filtRef - v.filtLow / 4);
            } else if (filter.type === 0x40) {
                v.filtLow += v.filtRef * filter.dy * 0.1;
                let tmp = v.filtIO - v.filtLow;
                tmp -= v.filtRef * filter.resDy;
                v.filtRef += tmp * filter.dy;
                let tmp2 = v.filtRef - v.filtIO / 8;
                if (tmp2 < -128) {
                    tmp2 = -128;
                }
                if (tmp2 > 127) {
                    tmp2 = 127;
                }
                v.filtIO = toInt8(tmp2);
            } else {
                v.filtLow += v.filtRef * filter.dy;
                const sample = v.filtIO;
                let sample2 = sample - v.filtLow;
                const tmp = Math.trunc(sample2) | 0;
                sample2 -= v.filtRef * filter.resDy;
                v.filtRef += sample2 * filter.dy;

                if (filter.type === 0x10 || filter.type === 0x30) {
                    v.filtIO = toInt8(v.filtLow);
                } else if (filter.type === 0x50 || filter.type === 0x70) {
                    v.filtIO = toInt8(sample - (tmp >> 1));
                } else if (filter.type === 0x60) {
                    v.filtIO = toInt8(tmp);
                }
            }
        } else {
            v.filtIO = 0;
        }
    }
}

// ---------------------------------------------------------------- Output

function waveCalcMute(v: SIDOperator): number {
    v.ADSRproc(v); /* just process envelope */
    return v.filtIO;
}

function waveCalcRangeCheck(v: SIDOperator): number {
    v.waveStepOld = v.waveStep;
    v.waveProc(v);
    if (v.waveStep < v.waveStepOld) {
        /* Next step switch back to normal calculation. */
        v.cycleLenCount = 0;
        v.outProc = waveCalcNormal;
        v.waveStep = 4095;
    }
    v.filtIO = ampMod1x8[v.ADSRproc(v) | v.output];
    waveCalcFilter(v);
    return v.filtIO;
}

function waveCalcNormal(v: SIDOperator): number {
    if (v.cycleLenCount <= 0) {
        v.waveCalcCycleLen();
        if (v.SIDctrl & 0x40) {
            v.pulseIndex = v.newPulseIndex;
            if (v.pulseIndex > 2048) {
                v.waveStep = 0;
            }
        }
    }
    v.waveProc(v);
    v.filtIO = ampMod1x8[v.ADSRproc(v) | v.output];
    waveCalcFilter(v);
    return v.filtIO;
}

// ---------------------------------------------------------------- Envelope

function enveEmuEnveAdvance(v: SIDOperator) {
    v.enveStepPnt += v.enveStepAddPnt;
    v.enveStep = (v.enveStep + v.enveStepAdd + (v.enveStepPnt > 65535 ? 1 : 0)) & 0xffff;
    v.enveStepPnt &= 0xffff;
}

function amplitude(v: SIDOperator): number {
    return masterAmplModTable[v.sid.masterVolumeAmplIndex + v.enveVol];
}

/* Only used in the beginning. */
function enveEmuMute(v: SIDOperator): number {
    return 0;
}

function enveEmuRelease(v: SIDOperator): number {
    if (v.enveStep >= releaseTabLen) {
        v.enveVol = releaseTab[releaseTabLen - 1];
    } else {
        v.enveVol = releaseTab[v.enveStep];
        enveEmuEnveAdvance(v);
    }
    return amplitude(v);
}

function enveEmuAlterRelease(v: SIDOperator): number {
    const release = v.SIDSR & 0x0f;
    v.enveStepAdd = v.sid.decayReleaseRates[release];
    v.enveStepAddPnt = v.sid.decayReleaseRatesP[release];
    v.ADSRproc = enveEmuRelease;
    return enveEmuRelease(v);
}

function enveEmuStartRelease(v: SIDOperator): number {
    v.ADSRctrl = ENVE_RELEASE;
    v.enveStep = releasePos[v.enveVol];
    v.enveStepPnt = 0;
    return enveEmuAlterRelease(v);
}

function enveEmuSustain(v: SIDOperator): number {
    return amplitude(v);
}

function enveEmuSustainDecay(v: SIDOperator): number {
    if (v.enveStep >= releaseTabLen) {
        v.enveVol = releaseTab[releaseTabLen - 1];
        return enveEmuAlterSustain(v);
    }
    v.enveVol = releaseTab[v.enveStep];
    /* Will be controlled from sidEmuSet2(). */
    if (v.enveVol <= v.enveSusVol) {
        v.enveVol = v.enveSusVol;
        return enveEmuAlterSustain(v);
    }
    enveEmuEnveAdvance(v);
    return amplitude(v);
}

/* This is the same as enveEmuStartSustainDecay(). */
function enveEmuAlterSustainDecay(v: SIDOperator): number {
    const decay = v.SIDAD & 0x0f;
    v.enveStepAdd = v.sid.decayReleaseRates[decay];
    v.enveStepAddPnt = v.sid.decayReleaseRatesP[decay];
    v.ADSRproc = enveEmuSustainDecay;
    return enveEmuSustainDecay(v);
}

/* This is the same as enveEmuStartSustain(). */
function enveEmuAlterSustain(v: SIDOperator): number {
    if (v.enveVol > v.enveSusVol) {
        v.ADSRctrl = ENVE_SUSTAINDECAY;
        v.ADSRproc = enveEmuSustainDecay;
        return enveEmuAlterSustainDecay(v);
    }
    v.ADSRctrl = ENVE_SUSTAIN;
    v.ADSRproc = enveEmuSustain;
    return enveEmuSustain(v);
}

function enveEmuDecay(v: SIDOperator): number {
    if (v.enveStep >= releaseTabLen) {
        v.enveVol = v.enveSusVol;
        return enveEmuAlterSustain(v); /* start sustain */
    }
    v.enveVol = releaseTab[v.enveStep];
    /* Will be controlled from sidEmuSet2(). */
    if (v.enveVol <= v.enveSusVol) {
        v.enveVol = v.enveSusVol;
        return enveEmuAlterSustain(v); /* start sustain */
    }
    enveEmuEnveAdvance(v);
    return amplitude(v);
}

function enveEmuAlterDecay(v: SIDOperator): number {
    const decay = v.SIDAD & 0x0f;
    v.enveStepAdd = v.sid.decayReleaseRates[decay];
    v.enveStepAddPnt = v.sid.decayReleaseRatesP[decay];
    v.ADSRproc = enveEmuDecay;
    return enveEmuDecay(v);
}

function enveEmuStartDecay(v: SIDOperator): number {
    v.ADSRctrl = ENVE_DECAY;
    v.enveStep = 0;
    v.enveStepPnt = 0;
    return enveEmuAlterDecay(v);
}

function enveEmuAttack(v: SIDOperator): number {
    if (v.enveStep >= attackTabLen) {
        return enveEmuStartDecay(v);
    }
    v.enveVol = v.enveStep;
    enveEmuEnveAdvance(v);
    return amplitude(v);
}

function enveEmuAlterAttack(v: SIDOperator): number {
    const attack = v.SIDAD >> 4;
    v.enveStepAdd = v.sid.attackRates[attack];
    v.enveStepAddPnt = v.sid.attackRatesP[attack];
    v.ADSRproc = enveEmuAttack;
    return enveEmuAttack(v);
}

function enveEmuStartAttack(v: SIDOperator): number {
    v.ADSRctrl = ENVE_ATTACK;
    v.enveStep = v.enveVol;
    v.enveStepPnt = 0;
    return enveEmuAlterAttack(v);
}

function enveEmuShortAttack(v: SIDOperator): number {
    if (v.enveStep >= attackTabLen || v.enveShortAttackCount === 0) {
        return enveEmuStartDecay(v);
    }
    v.enveVol = v.enveStep;
    v.enveShortAttackCount--;
    enveEmuEnveAdvance(v);
    return amplitude(v);
}

function enveEmuAlterShortAttack(v: SIDOperator): number {
    const attack = v.SIDAD >> 4;
    v.enveStepAdd = v.sid.attackRates[attack];
    v.enveStepAddPnt = v.sid.attackRatesP[attack];
    v.ADSRproc = enveEmuShortAttack;
    return enveEmuShortAttack(v);
}

function enveEmuStartShortAttack(v: SIDOperator): number {
    v.ADSRctrl = ENVE_SHORTATTACK;
    v.enveStep = v.enveVol;
    v.enveStepPnt = 0;
    v.enveShortAttackCount = 65535; /* unused */
    return enveEmuAlterShortAttack(v);
}

/* ADSRctrl is (index*2) to enveModeTable[], because of KEY-bit. */
const enveModeTable: ADSRProc[] = [
    /* 0 */
    enveEmuStartAttack, enveEmuStartRelease,
    enveEmuAttack, enveEmuDecay, enveEmuSustain, enveEmuRelease,
    enveEmuSustainDecay, enveEmuMute,
    /* 16 */
    enveEmuStartShortAttack,
    enveEmuMute, enveEmuMute, enveEmuMute,
    enveEmuMute, enveEmuMute, enveEmuMute, enveEmuMute,
    /* 32 */
    enveEmuStartAttack, enveEmuStartRelease,
    enveEmuAlterAttack, enveEmuAlterDecay, enveEmuAlterSustain, enveEmuAlterRelease,
    enveEmuAlterSustainDecay, enveEmuMute,
    /* 48 */
    enveEmuStartShortAttack,
    enveEmuMute, enveEmuMute, enveEmuMute,
    enveEmuMute, enveEmuMute, enveEmuMute, enveEmuMute
];

// ---------------------------------------------------------------- Voice

interface WavePre {
    len: number;
    stp: number;
    pnt: number;
}

class SIDOperator {

    sid: SID6581;
    reg = new Uint8Array(7);
    SIDfreq = 0;
    SIDpulseWidth = 0;
    SIDctrl = 0;
    SIDAD = 0;
    SIDSR = 0;

    carrier: SIDOperator;
    modulator: SIDOperator;
    sync = false;

    pulseIndex = 0;
    newPulseIndex = 0;
    curSIDfreq = 0;
    curNoiseFreq = 0;

    output = 0;

    filtVoiceMask = 0;
    filtEnabled = false;
    filtLow = 0;
    filtRef = 0;
    filtIO = 0;

    cycleLenCount = 0;
    cycleAddLenPnt = 0;
    cycleLen = 0;
    cycleLenPnt = 0;

    outProc: OutProc = waveCalcMute;
    waveProc: WaveProc = sidMode00;

    waveStep = 0;
    waveStepAdd = 0;
    waveStepPnt = 0;
    waveStepAddPnt = 0;
    waveStepOld = 0;
    wavePre: WavePre[] = [{len: 0, stp: 0, pnt: 0}, {len: 0, stp: 0, pnt: 0}];

    noiseReg = NOISE_SEED;
    noiseStep = 0;
    noiseStepAdd = 0;
    noiseOutput = 0;
    noiseIsLocked = false;
    noiseHp = false;

    ADSRctrl = 0;
    ADSRproc: ADSRProc = enveEmuMute;

    enveStep = 0;
    enveStepAdd = 0;
    enveStepPnt = 0;
    enveStepAddPnt = 0;
    enveVol = 0;
    enveSusVol = 0;
    enveShortAttackCount = 0;

    constructor(sid: SID6581) {
        this.sid = sid;
    }

    clear() {
        this.SIDfreq = 0;
        this.SIDctrl = 0;
        this.SIDAD = 0;
        this.SIDSR = 0;

        this.sync = false;

        this.pulseIndex = this.newPulseIndex = this.SIDpulseWidth = 0;
        this.curSIDfreq = this.curNoiseFreq = 0;

        this.output = this.noiseOutput = 0;
        this.filtIO = 0;

        this.filtEnabled = false;
        this.filtLow = this.filtRef = 0;

        this.cycleLenCount = 0;
        this.cycleLen = this.cycleLenPnt = 0;
        this.cycleAddLenPnt = 0;

        this.outProc = waveCalcMute;

        this.waveStepAdd = this.waveStepAddPnt = 0;
        this.waveStep = this.waveStepPnt = 0;
        for (const pre of this.wavePre) {
            pre.len = pre.stp = pre.pnt = 0;
        }
        this.waveStepOld = 0;

        this.noiseReg = NOISE_SEED;
        this.noiseStepAdd = this.noiseStep = 0;
        this.noiseIsLocked = false;
        this.noiseHp = false;
    }

    enveReset() {
        /* mute, end of R-phase */
        this.ADSRctrl = ENVE_MUTE;
        this.enveStep = this.enveStepPnt = 0;
        this.enveStepAdd = this.enveStepAddPnt = 0;
        this.enveSusVol = 0;
        this.enveVol = 0;
        this.enveShortAttackCount = 0;
    }

    /* Operator frame set-up 1 */
    set() {
        const reg = this.reg;
        this.SIDfreq = reg[0] | (reg[1] << 8);

        this.SIDpulseWidth = (reg[2] | (reg[3] << 8)) & 0x0fff;
        this.newPulseIndex = 4096 - this.SIDpulseWidth;
        if (((this.waveStep + this.pulseIndex) >= 0x1000) && ((this.waveStep + this.newPulseIndex) >= 0x1000)) {
            this.pulseIndex = this.newPulseIndex;
        } else if (((this.waveStep + this.pulseIndex) < 0x1000) && ((this.waveStep + this.newPulseIndex) < 0x1000)) {
            this.pulseIndex = this.newPulseIndex;
        }

        const oldWave = this.SIDctrl;
        const newWave = reg[4];
        let enveTemp = this.ADSRctrl;
        this.SIDctrl = newWave;

        if (!(newWave & 1)) {
            if (oldWave & 1) {
                enveTemp = ENVE_STARTRELEASE;
            }
        } else if (!(oldWave & 1)) {
            enveTemp = ENVE_STARTATTACK;
        }

        if ((oldWave ^ newWave) & 0xf0) {
            this.cycleLenCount = 0;
        }

        const ADtemp = reg[5];
        const SRtemp = reg[6];
        if (this.SIDAD !== ADtemp) {
            enveTemp |= ENVE_ALTER;
        } else if (this.SIDSR !== SRtemp) {
            enveTemp |= ENVE_ALTER;
        }

        this.SIDAD = ADtemp;
        this.SIDSR = SRtemp;
        const tmpSusVol = masterVolumeLevels[SRtemp >> 4];
        if (this.ADSRctrl !== ENVE_SUSTAIN) {
            this.enveSusVol = tmpSusVol;
        } else if (this.enveSusVol > this.enveVol) {
            this.enveSusVol = 0;
        } else {
            this.enveSusVol = tmpSusVol;
        }

        this.ADSRproc = enveModeTable[enveTemp >> 1]; // shifting out the KEY-bit
        this.ADSRctrl = enveTemp & (255 - ENVE_ALTER - 1);

        this.filtEnabled = this.sid.filter.enabled && (this.sid.reg[0x17] & this.filtVoiceMask) !== 0;
    }

    /* Operator frame set-up 2 */
    set2() {
        this.outProc = waveCalcNormal;
        this.sync = false;

        if ((this.SIDfreq < 16) || (this.SIDctrl & 8)) {
            this.outProc = waveCalcMute;
            if (this.SIDfreq === 0) {
                this.cycleLen = this.cycleLenPnt = 0;
                this.cycleAddLenPnt = 0;
                this.waveStep = 0;
                this.waveStepPnt = 0;
                this.curSIDfreq = this.curNoiseFreq = 0;
                this.noiseStepAdd = 0;
                this.cycleLenCount = 0;
            }
            if (this.SIDctrl & 8) {
                if (this.noiseIsLocked) {
                    this.noiseIsLocked = false;
                    this.noiseReg = NOISE_SEED;
                }
            }
        } else {
            if (this.curSIDfreq !== this.SIDfreq) {
                this.curSIDfreq = this.SIDfreq;
                // We keep the value cycleLen between 1 <= x <= 65535.
                this.cycleLen = Math.trunc(this.sid.PCMsid / this.SIDfreq) & 0xffff;
                this.cycleLenPnt = Math.trunc(((this.sid.PCMsid % this.SIDfreq) * 65536) / this.SIDfreq) & 0xffff;
                if (this.cycleLenCount > 0) {
                    this.waveCalcCycleLen();
                    this.outProc = waveCalcRangeCheck;
                }
            }

            if ((this.SIDctrl & 0x80) && (this.curNoiseFreq !== this.SIDfreq)) {
                this.curNoiseFreq = this.SIDfreq;
                this.noiseStepAdd = Math.trunc((this.sid.PCMsidNoise * this.SIDfreq) / 256);
                this.noiseHp = this.noiseStepAdd >= (1 << 21);
            }

            if (this.SIDctrl & 2) {
                if (!this.modulator.SIDfreq || (this.modulator.SIDctrl & 8)) {
                    // No sync
                } else if ((this.carrier.SIDctrl & 2) && (this.modulator.SIDfreq >= (this.SIDfreq << 1))) {
                    // No sync
                } else {
                    this.sync = true;
                }
            }

            const mode = this.SIDctrl >> 4;
            if (((this.SIDctrl & 0x14) === 0x14) && this.modulator.SIDfreq) {
                this.waveProc = sidModeRingTable[mode];
            } else if (mode === 8) {
                this.waveProc = this.noiseHp ? sidMode80hp : sidMode80;
            } else {
                this.waveProc = sidModeNormalTable[mode];
            }
        }
    }

    waveCalcCycleLen() {
        this.cycleAddLenPnt += this.cycleLenPnt;
        this.cycleLenCount = this.cycleLen;
        if (this.cycleAddLenPnt > 65535) {
            this.cycleLenCount++;
        }
        this.cycleAddLenPnt &= 0xffff;

        const diff = (this.cycleLenCount - this.cycleLen) & 0xffff;
        const pre = this.wavePre[diff];
        if (pre.len !== this.cycleLenCount) {
            pre.len = this.cycleLenCount;
            pre.stp = this.waveStepAdd = Math.trunc(4096 / this.cycleLenCount);
            pre.pnt = this.waveStepAddPnt = Math.trunc(((4096 % this.cycleLenCount) * 65536) / this.cycleLenCount);
        } else {
            this.waveStepAdd = pre.stp;
            this.waveStepAddPnt = pre.pnt;
        }
    }
}

// ---------------------------------------------------------------- Chip

export class SID6581 {

    readonly clock: number;
    PCMfreq = 0;
    PCMsid = 0;
    PCMsidNoise = 0;

    reg = new Uint8Array(0x20);

    masterVolume = 0;
    masterVolumeAmplIndex = 0;

    filter = {
        enabled: true,
        type: 0,
        curType: 0,
        dy: 0,
        resDy: 0,
        value: 0
    };

    optr: SIDOperator[] = [];
    optr3OutputMask = ~0;

    // Sample rate dependent tables
    filterTable = new Float32Array(0x800);
    bandPassParam = new Float32Array(0x800);
    filterResTable = new Float32Array(16);
    attackRates = new Uint32Array(16);
    attackRatesP = new Uint32Array(16);
    decayReleaseRates = new Uint32Array(16);
    decayReleaseRatesP = new Uint32Array(16);

    constructor(clock: number, sampleRate: number) {
        this.clock = clock;
        for (let v = 0; v < MAX_VOICES; v++) {
            this.optr[v] = new SIDOperator(this);
        }
        for (let v = 0; v < MAX_VOICES; v++) {
            const modVoice = ((v + MAX_VOICES) - 1) % MAX_VOICES;
            this.optr[v].modulator = this.optr[modVoice];
            this.optr[modVoice].carrier = this.optr[v];
            this.optr[v].filtVoiceMask = 1 << v;
        }
        this.setSampleRate(sampleRate);
    }

    setSampleRate(sampleRate: number) {
        if (sampleRate === this.PCMfreq) {
            return;
        }
        const regs = this.reg.slice();
        this.PCMfreq = sampleRate;
        this.PCMsid = Math.trunc(sampleRate * (16777216.0 / this.clock));
        this.PCMsidNoise = Math.trunc((this.clock * 256.0) / sampleRate);
        this.filterTableInit(sampleRate);
        this.enveRatesInit(sampleRate);
        // Recalculate the voices for the new rate
        this.reset();
        for (let i = 0; i <= 0x18; i++) {
            this.write(i, regs[i]);
        }
    }

    private filterTableInit(sampleRate: number) {
        const filterRefFreq = 44100.0;

        let yMax = 1.0;
        let yMin = 0.01;
        for (let rk = 0; rk < 0x800; rk++) {
            let value = (((Math.exp(rk / 0x800 * Math.log(400.0)) / 60.0) + 0.05) * filterRefFreq) / sampleRate;
            if (value < yMin) {
                value = yMin;
            }
            if (value > yMax) {
                value = yMax;
            }
            this.filterTable[rk] = value;
        }

        yMax = 0.22;
        yMin = 0.05; /* less for some R1/R4 chips */
        const yAdd = (yMax - yMin) / 2048.0;
        let yTmp = yMin;
        for (let rk = 0; rk < 0x800; rk++) {
            this.bandPassParam[rk] = (yTmp * filterRefFreq) / sampleRate;
            yTmp += yAdd;
        }

        const resDyMax = 1.0;
        const resDyMin = 2.0;
        let resDy = resDyMin;
        for (let uk = 0; uk < 16; uk++) {
            this.filterResTable[uk] = resDy;
            resDy -= (resDyMin - resDyMax) / 15;
        }
        this.filterResTable[0] = resDyMin;
        this.filterResTable[15] = resDyMax;
    }

    private enveRatesInit(updateFreq: number) {
        for (let i = 0; i < 16; i++) {
            let scaledenvelen = Math.trunc((attackTimes[i] * updateFreq) / 1000);
            if (scaledenvelen === 0) {
                scaledenvelen = 1;
            }
            this.attackRates[i] = Math.trunc(attackTabLen / scaledenvelen);
            this.attackRatesP[i] = Math.trunc(((attackTabLen % scaledenvelen) * 65536) / scaledenvelen);

            scaledenvelen = Math.trunc((decayReleaseTimes[i] * updateFreq) / 1000);
            if (scaledenvelen === 0) {
                scaledenvelen = 1;
            }
            this.decayReleaseRates[i] = Math.trunc(releaseTabLen / scaledenvelen);
            this.decayReleaseRatesP[i] = Math.trunc(((releaseTabLen % scaledenvelen) * 65536) / scaledenvelen);
        }
    }

    reset() {
        this.reg.fill(0);
        this.masterVolume = 0;
        this.masterVolumeAmplIndex = 0;
        for (const v of this.optr) {
            v.reg.fill(0);
            v.clear();
            v.enveReset();
        }
        this.optr3OutputMask = ~0; /* on */

        this.filter.type = this.filter.curType = 0;
        this.filter.value = 0;
        this.filter.dy = this.filter.resDy = 0;

        for (const v of this.optr) {
            v.set();
            v.set2();
        }
    }

    write(offset: number, data: number) {
        offset &= 0x1f;
        data &= 0xff;
        switch (offset) {
            case 0x19:
            case 0x1a:
            case 0x1b:
            case 0x1c:
            case 0x1d:
            case 0x1e:
            case 0x1f:
                break;
            case 0x15:
            case 0x16:
            case 0x17:
            case 0x18: {
                const reg = this.reg;
                reg[offset] = data;
                this.masterVolume = reg[0x18] & 15;
                this.masterVolumeAmplIndex = this.masterVolume << 8;

                if ((reg[0x18] & 0x80) && !(reg[0x17] & this.optr[2].filtVoiceMask)) {
                    this.optr3OutputMask = 0; /* off */
                } else {
                    this.optr3OutputMask = ~0; /* on */
                }

                const filter = this.filter;
                filter.type = reg[0x18] & 0x70;
                if (filter.type !== filter.curType) {
                    filter.curType = filter.type;
                    for (const v of this.optr) {
                        v.filtLow = v.filtRef = 0;
                    }
                }
                if (filter.enabled) {
                    filter.value = 0x7ff & ((reg[0x15] & 7) | (reg[0x16] << 3));
                    if (filter.type === 0x20) {
                        filter.dy = this.bandPassParam[filter.value];
                    } else {
                        filter.dy = this.filterTable[filter.value];
                    }
                    filter.resDy = this.filterResTable[reg[0x17] >> 4] - filter.dy;
                    if (filter.resDy < 1.0) {
                        filter.resDy = 1.0;
                    }
                }
                this.updateOperators();
                break;
            }
            default:
                this.reg[offset] = data;
                if (offset < 7) {
                    this.optr[0].reg[offset] = data;
                } else if (offset < 14) {
                    this.optr[1].reg[offset - 7] = data;
                } else if (offset < 21) {
                    this.optr[2].reg[offset - 14] = data;
                }
                this.updateOperators();
                break;
        }
    }

    read(offset: number): number {
        /* SIDPLAY reads last written at a sid address value */
        offset &= 0x1f;
        switch (offset) {
            case 0x1d:
            case 0x1e:
            case 0x1f:
                return 0xff;
            case 0x1b:
                return this.optr[2].output;
            case 0x1c:
                return this.optr[2].enveVol;
            default:
                return this.reg[offset];
        }
    }

    private updateOperators() {
        for (const v of this.optr) {
            v.set();
            // relies on sidEmuSet also for other channels!
            v.set2();
        }
    }

    private syncEm() {
        const optr = this.optr;
        const sync0 = optr[0].modulator.cycleLenCount <= 0;
        const sync1 = optr[1].modulator.cycleLenCount <= 0;
        const sync2 = optr[2].modulator.cycleLenCount <= 0;
        optr[0].cycleLenCount--;
        optr[1].cycleLenCount--;
        optr[2].cycleLenCount--;
        this.syncOperator(optr[0], sync0);
        this.syncOperator(optr[1], sync1);
        this.syncOperator(optr[2], sync2);
    }

    private syncOperator(op: SIDOperator, sync: boolean) {
        if (op.sync && sync) {
            op.cycleLenCount = 0;
            op.outProc = waveCalcNormal;
            op.waveStep = op.waveStepPnt = 0;
        }
    }

    /**
     * Fill the buffer with samples in the range [-1, 1] at the configured sample rate.
     */
    update(buffer: Float32Array, length: number) {
        const optr = this.optr;
        for (let i = 0; i < length; i++) {
            const sum =
                optr[0].outProc(optr[0]) +
                optr[1].outProc(optr[1]) +
                (optr[2].outProc(optr[2]) & this.optr3OutputMask) +
                // hack for digi sounds: the master volume is audible on its own
                (this.masterVolume << 2);
            buffer[i] = sum / 1024;
            this.syncEm();
        }
    }
}
