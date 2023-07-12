import {State} from '../interfaces/state';

export class SN76489 implements State {

/**
 * SN76489 PSG
 *
 * @version 17th June 2008
 * @author (C) 2008 Chris White (pointblnk@hotmail.com)
 *
 * @see http://www.smspower.org/dev/docs/wiki/Sound/PSG
 *
 * @version 23rd April 2014
 * @author Converted to JavaScript by Rasmus Moustgaard (rasmus.moustgard@gmail.com)
 *
 * Special Thanks:
 *
 * - This sound rewrite is heavily based on the documentation and research of Maxim.
 *   Used and relicensed with permission :)
 *
 * Timing Notes:
 *
 * - NTSC Clockspeed = 3579545 Hz
 * - Sample Rate = 44100 Hz
 * - PSG Clock = 223721.5625 Hz (Divide Clockspeed by 16)
 * - Include Sampling Rate = 5.07 (Divide PSG Clock by Sample Rate)
 * - So we want to decrement our counters by 5.07 per cycle
 *
 * Notes:
 *
 * - To use with other systems other than Sega Master System / GameGear, update the feedback
 *   pattern appropriately.
 */

/*
    This file is part of JavaGear.

    Copyright (c) 2002-2008 Chris White
    All rights reserved.

    Redistribution and use of this code or any derivative works are permitted
    provided that the following conditions are met:

    * Redistributions may not be sold, nor may they be used in a commercial
    product or activity.

    * Redistributions that are modified from the original source must include the
    complete source code, including the source code for all components used by a
    binary built from the modified sources. However, as a special exception, the
    source code distributed need not include anything that is normally distributed
    (in either source or binary form) with the major components (compiler, kernel,
    and so on) of the operating system on which the executable runs, unless that
    component itself accompanies the executable.

    * Redistributions must reproduce the above copyright notice, this list of
    conditions and the following disclaimer in the documentation and/or other
    materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
    INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
    CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
    ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
    POSSIBILITY OF SUCH DAMAGE.
*/

    /** Fixed point scaling */
    static SCALE = 8;

    static CLOCK_3_58MHZ = 3579545;
    static SAMPLE_FREQUENCY = 44100;
    /** Value to denote that antialiasing should not be used on sample */
    static NO_ANTIALIAS: -2147483648;
    /** Shift register reset value. Only the highest bit is set */
    static SHIFT_RESET = 0x8000;
    /** SMS Only: Tapped bits are bits 0 and 3 ($0009), fed back into bit 15 */
    static FEEDBACK_PATTERN = 0x9;
    // Tests with an SMS and a TV card found the highest three volume levels to be clipped
    static PSG_VOLUME = [
        25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 3, 2, 2, 1, 1, 0
    ];
    // On the Sega Master System this is 16
    static PERIODIC_NOISE_CYCLE = 15;

    private clock: number;
    private clockFrac: number;
    private reg: number[];
    private regLatch: number;
    private freqCounter: number[];
    private freqPolarity: number[];
    private freqPos: number[];
    private noiseFreq: number;
    private noiseShiftReg: number;
    private outputChannel: number[];

    // Set to 15 for TMS9919 or 16 for SMS SN76489

    constructor() {

        /** SN76489 Internal Clock Speed (Hz) [SCALED] */
        this.clock = 0;

        /** Stores fractional part of clock for various precise updates [SCALED] */
        this.clockFrac = 0;

        // --------------------------------------------------------------------------------------------
        // The SN76489 has 8 "registers":
        // 4 x 4 bit volume registers,
        // 3 x 10 bit tone registers and
        // 1 x 3 bit noise register.
        // --------------------------------------------------------------------------------------------

        /** SN76489 Registers */
        this.reg = [0, 0, 0, 0, 0, 0, 0, 0];

        /** Register Latch */
        this.regLatch = 0;

        /** Channel Counters (10-bits on original hardware) */
        this.freqCounter = [0, 0, 0, 0];

        /** Polarity of Tone Channel Counters */
        this.freqPolarity = [0, 0, 0, 0];

        /** Position of Tone Amplitude Changes */
        this.freqPos = [0, 0, 0];

        /** Noise Generator Frequency */
        this.noiseFreq = 0;

        /** The Linear Feedback Shift Register (16-bits on original hardware) */
        this.noiseShiftReg = 0;

        // --------------------------------------------------------------------------------------------
        // Output & Amplification
        // --------------------------------------------------------------------------------------------

        /** Output channels */
        this.outputChannel = [0, 0, 0, 0];

        this.init(SN76489.CLOCK_3_58MHZ, SN76489.SAMPLE_FREQUENCY);
    }

    /**
     *  Init SN76496 to Default Values.
     *
     *  @param clockSpeed    Clock Speed (Hz)
     *  @param sampleRate    Sample Rate (Hz)
     */

    init(clockSpeed: number, sampleRate: number) {
        // Master clock divided by 16 to get internal clock
        // e.g. 3579545 / 16 / 44100 = 5
        this.clock = Math.floor((clockSpeed << SN76489.SCALE) / 16 / sampleRate);

        this.regLatch = 0;
        this.clockFrac = 0;
        this.noiseShiftReg = SN76489.SHIFT_RESET;
        this.noiseFreq = 0x10;

        for (let i = 0; i < 4; i++) {
            // Set Tone Frequency (Don't want this to be zero)
            this.reg[i << 1] = 1;

            // Set Volume Off
            this.reg[(i << 1) + 1] = 0x0F;

            // Set Frequency Counters
            this.freqCounter[i] = 0;

            // Set Amplitudes Positive
            this.freqPolarity[i] = 1;

            // Do not use intermediate positions
            if (i !== 3) { this.freqPos[i] = SN76489.NO_ANTIALIAS; }
        }
    }

    /**
     *  Program the SN76489.
     *
     *  @param  value   Value to write (0-0xFF)
     */

    write(value: number) {
        // ----------------------------------------------------------------------------------------
        // If bit 7 is 1 then the byte is a LATCH/DATA byte.
        //    %1cctdddd
        //    |||````-- Data
        //    ||`------ Type
        //    ``------- Channel
        // ----------------------------------------------------------------------------------------

        if ((value & 0x80) !== 0) {
            // Bits 6 and 5 ("cc") give the channel to be latched, ALWAYS.
            // Bit 4 ("t") determines whether to latch volume (1) or tone/noise (0) data -
            // this gives the column.

            this.regLatch = (value >> 4) & 7;

            // Zero lower 4 bits of register and mask new value
            this.reg[this.regLatch] = (this.reg[this.regLatch] & 0x3F0) | (value & 0x0F);
        } else {
            // ----------------------------------------------------------------------------------------
            // If bit 7 is 0 then the byte is a DATA byte.
            //    %0-DDDDDD
            //    |``````-- Data
            //    `-------- Unused
            // ----------------------------------------------------------------------------------------

            // TONE REGISTERS
            // If the currently latched register is a tone register then the low 6
            // bits of the byte are placed into the high 6 bits of the latched register.
            if (this.regLatch === 0 || this.regLatch === 2 || this.regLatch === 4) {
                // ddddDDDDDD (10 bits total) - keep lower 4 bits and replace upper 6 bits.
                // ddddDDDDDD gives the 10-bit half-wave counter reset value.
                this.reg[this.regLatch] = (this.reg[this.regLatch] & 0x0F) | ((value & 0x3F) << 4);
            } else {
                // VOLUME & NOISE REGISTERS
                this.reg[this.regLatch] = value & 0x0F;
            }
        }

        switch (this.regLatch) {
            // ------------------------------------------------------------------------------------
            // Tone register updated
            // If the register value is zero then the output is a constant value of +1.
            // This is often used for sample playback on the SN76489.
            // ------------------------------------------------------------------------------------
            case 0:
            case 2:
            case 4:
                if (this.reg[this.regLatch] === 0) {
                    this.reg[this.regLatch] = 1;
                }
                break;

            // ------------------------------------------------------------------------------------
            // Noise generator updated
            //
            // Noise register:      dddd(DDDDDD) = -trr(---trr)
            //
            // The low 2 bits of dddd select the shift rate and the next highest bit (bit 2)
            // selects  the mode (white (1) or "periodic" (0)).
            // If a data byte is written, its low 3 bits update the shift rate and mode in the
            // same way.
            // ------------------------------------------------------------------------------------
            case 6:
                this.noiseFreq = 0x10 << (this.reg[6] & 3);
                this.noiseShiftReg = SN76489.SHIFT_RESET;
                break;
        }
    }

    update(buffer: Int8Array, offset: number, samplesToGenerate: number) {
        for (let sample = 0; sample < samplesToGenerate; sample++) {
            // ------------------------------------------------------------------------------------
            // Generate Sound from Tone Channels
            // ------------------------------------------------------------------------------------
            for (let i = 0; i < 3; i++) {
                if (this.freqPos[i] !== SN76489.NO_ANTIALIAS) {
                    this.outputChannel[i] = (SN76489.PSG_VOLUME[this.reg[(i << 1) + 1]] * this.freqPos[i]) >> SN76489.SCALE;
                } else {
                    this.outputChannel[i] = SN76489.PSG_VOLUME[this.reg[(i << 1) + 1]] * this.freqPolarity[i];
                }
            }

            // ------------------------------------------------------------------------------------
            // Generate Sound from Noise Channel
            // ------------------------------------------------------------------------------------

            this.outputChannel[3] = SN76489.PSG_VOLUME[this.reg[7]] * (this.noiseShiftReg & 1) << 1; // Double output

            // ------------------------------------------------------------------------------------
            // Output sound to buffer
            // ------------------------------------------------------------------------------------

            let output = this.outputChannel[0] + this.outputChannel[1] + this.outputChannel[2] + this.outputChannel[3];

            // Check boundaries
            if (output > 0x7F) {
                output = 0x7F;
            } else if (output < -0x80) {
                output = -0x80;
            }

            buffer[offset + sample] = output;

            // ------------------------------------------------------------------------------------
            // Update Clock
            // ------------------------------------------------------------------------------------
            this.clockFrac += this.clock;

            // Contains Main Integer Part (For General Counter Decrements)
            // int clockCyclesPerUpdate = clockFrac &~ ((1 << SCALE) - 1);
            const clockCycles = this.clockFrac >> SN76489.SCALE;
            const clockCyclesScaled = clockCycles << SN76489.SCALE;

            // Clock Counter Updated with Fractional Part Only (For Accurate Stuff Later)
            this.clockFrac -= clockCyclesScaled;

            // ------------------------------------------------------------------------------------
            // Decrement Counters
            // ------------------------------------------------------------------------------------

            // Decrement Tone Counters
            this.freqCounter[0] -= clockCycles;
            this.freqCounter[1] -= clockCycles;
            this.freqCounter[2] -= clockCycles;

            // Decrement Noise Counter OR Match to Tone 2
            if (this.noiseFreq === 0x80) {
                this.freqCounter[3] = this.freqCounter[2];
            } else {
                this.freqCounter[3] -= clockCycles;
            }

            // ------------------------------------------------------------------------------------
            // Update 3 x Tone Generators
            // ------------------------------------------------------------------------------------
            for (let i = 0; i < 3; i++) {
                const counter = this.freqCounter[i];

                // The counter is reset to the value currently in the corresponding register
                // (eg. Tone0 for channel 0).
                // The polarity of the output is changed,
                // ie. if it is currently outputting -1 then it outputs +1, and vice versa.
                if (counter <= 0) {
                    const tone = this.reg[i << 1];

                    // In tests on an SMS2, the highest note that gave any audible output was
                    // register value $006, giving frequency 18643Hz (MIDI note A12 -12 cents).
                    if (tone > 6) {
                        // Calculate what fraction of the way through the sample the flip-flop
                        // changes state and render it as that fraction of the way through the transition.

                        // Note we divide a scaled number by a scaled number here
                        // So to maintain accuracy we shift the top part of the fraction again
                        this.freqPos[i] = Math.floor(((clockCyclesScaled - this.clockFrac + (2 << SN76489.SCALE) * counter) << SN76489.SCALE) *
                            this.freqPolarity[i] / (clockCyclesScaled + this.clockFrac));

                        // Flip Polarity
                        this.freqPolarity[i] = -this.freqPolarity[i];
                    } else {
                        this.freqPolarity[i] = 1;
                        this.freqPos[i] = SN76489.NO_ANTIALIAS;
                    }

                    // Reset to 10-bit value in corresponding tone register
                    this.freqCounter[i] += tone * Math.floor(clockCycles / tone + 1);
                } else {
                    this.freqPos[i] = SN76489.NO_ANTIALIAS;
                }
            }

            // ------------------------------------------------------------------------------------
            // Update Noise Generators
            // ------------------------------------------------------------------------------------
            if (this.freqCounter[3] <= 0) {
                // Flip Polarity
                this.freqPolarity[3] = -this.freqPolarity[3];

                // Not matching Tone 2 Value, so reload counter
                if (this.noiseFreq !== 0x80) {
                    this.freqCounter[3] += this.noiseFreq * (Math.floor(clockCycles / this.noiseFreq) + 1);
                }

                // Positive Amplitude i.e. We only want to do this once per cycle
                if (this.freqPolarity[3] === 1) {
                    let feedback;

                    // White Noise Selected
                    if ((this.reg[6] & 0x04) !== 0) {
                        // If two bits fed back, I can do Feedback=(nsr & fb) && (nsr & fb ^ fb)
                        // since that's (one or more bits set) && (not all bits set)
                        feedback = (this.noiseShiftReg & SN76489.FEEDBACK_PATTERN) !== 0 &&
                                   ((this.noiseShiftReg & SN76489.FEEDBACK_PATTERN) ^ SN76489.FEEDBACK_PATTERN) !== 0
                                   ? 1 : 0;
                        this.noiseShiftReg = (this.noiseShiftReg >> 1) | (feedback << 15);
                    } else {
                        feedback = this.noiseShiftReg & 1;
                        this.noiseShiftReg = (this.noiseShiftReg >> 1) | (feedback << (SN76489.PERIODIC_NOISE_CYCLE - 1));
                    }
                }
            }
        } // end for loop
    }

    isSample(b: number) {
        return (b & 0x90) === 0x90 && (b & 0x60) !== 0x60 && this.reg[(b & 0x60) >> 4] <= 6;
    }

    getState(): object {
        return {
            clock : this.clock,
            clockFrac : this.clockFrac,
            reg : this.reg,
            regLatch : this.regLatch,
            freqCounter : this.freqCounter,
            freqPolarity : this.freqPolarity,
            freqPos : this.freqPos,
            noiseFreq : this.noiseFreq,
            noiseShiftReg : this.noiseShiftReg,
            outputChannel : this.outputChannel
        };
    }

    restoreState(state: any) {
        this.clock = state.clock;
        this.clockFrac = state.clockFrac;
        this.reg = state.reg;
        this.regLatch = state.regLatch;
        this.freqCounter = state.freqCounter;
        this.freqPolarity = state.freqPolarity;
        this.freqPos = state.freqPos;
        this.noiseFreq = state.noiseFreq;
        this.noiseShiftReg = state.noiseShiftReg;
        this.outputChannel = state.outputChannel;
    }
}
