import {Log} from '../../classes/log';
import {Util} from '../../classes/util';
import {State} from '../interfaces/state';
import {AudioBufferToWav} from '../../classes/audio-buffer-to-wav';

export class Tape implements State {

    static DEBUG = false;
    static LEVEL_CHANGE_FREQUENCY = 1379;
    static LEVEL_CHANGE_DURATION = 1 / Tape.LEVEL_CHANGE_FREQUENCY;

    static ZERO = [
        0.02942, 0.06662, 0.10464, 0.11216, 0.10729, 0.11098, 0.10819, 0.11016,
        0.10898, 0.10942, 0.10964, 0.10886, 0.11006, 0.10859, 0.11016, 0.10868,
        0.10990, 0.10909, 0.10938, 0.10956, 0.11001, 0.12289, 0.13377, 0.14345,
        0.16464, 0.20270, 0.25574, 0.35052, 0.47641, 0.60378, 0.69818, 0.66828,
        0.51514, 0.26288, 0.03446, 0.00001
    ];

    static ONE = [
        0.10538, 0.18196, 0.18171, 0.14378, 0.12331, 0.13664, 0.17567, 0.21852,
        0.26456, 0.33587, 0.42363, 0.54129, 0.65023, 0.67852, 0.58335, 0.37611,
        0.15033, -0.04245, -0.16285, -0.18843, -0.16048, -0.12770, -0.12698, -0.15790,
        -0.20117, -0.24331, -0.30351, -0.38475, -0.48914, -0.61134, -0.67988, -0.63930,
        -0.47039, -0.24116, -0.03194, -0.00001
    ];

    private static AUDIO_GATE_BUFFER_LENGTH = 4096;

    private audioContext: AudioContext;
    private sampleRate: number;
    private samplesPerBit: number;
    private recordPressed: boolean;
    private playPressed: boolean;
    private motorOn: boolean;
    private playing: boolean;
    private recording: boolean;
    private audioBuffer: AudioBuffer;
    private sampleBuffer: number[];
    private playDelay: number;
    private paused: boolean;
    private sampleBufferOffset: number;
    private sampleBufferAudioOffset: number;
    private lastWriteValue: number;
    private lastWriteTime: number;
    private readFirst: boolean;
    private lastReadValue: number;
    private out: string;
    private outByte: number;
    private outByteCount: number;
    private audioGateBuffer = new Float32Array(Tape.AUDIO_GATE_BUFFER_LENGTH);
    private audioGateBufferStart = 0;
    private audioGateBufferEnd = 0;
    private lastAudioGateChange = -1;

    private log: Log = Log.getLog();

    constructor() {
        if (AudioContext) {
            this.audioContext = new AudioContext();
        }
    }

    reset() {
        this.sampleRate = this.audioContext ? this.audioContext.sampleRate : 0;
        this.samplesPerBit = Math.floor(Tape.LEVEL_CHANGE_DURATION * this.sampleRate);
        if (this.sampleRate !== 0 && this.sampleRate !== 48000) {
            // TODO: Resample ZERO and ONE
            this.log.warn("Sample rate is " + this.sampleRate + ", not 48000.");
        }
        this.recordPressed = false;
        this.playPressed = false;
        this.motorOn = false;
        this.playing = false;
        this.recording = false;
        this.sampleBuffer = [];
        this.playDelay = 0;
        this.paused = false;
        this.resetSampleBuffer();
    }

    resetSampleBuffer() {
        this.sampleBufferOffset = 0;
        this.sampleBufferAudioOffset = 0;
        this.lastWriteValue = null;
        this.lastWriteTime = -1;
        // Debug
        this.readFirst = null;
        this.out = "";
        this.outByte = 0;
        this.outByteCount = 8;
    }

    loadTapeFile(fileBuffer: ArrayBuffer, callback) {
        const tape = this;
        if (this.audioContext) {
            this.audioContext.decodeAudioData(fileBuffer).then(
                function (audioBuffer: AudioBuffer) {
                    tape.audioBuffer = audioBuffer;
                    const sampleBuffer = new Float32Array(audioBuffer.length);
                    audioBuffer.copyFromChannel(sampleBuffer, 0);
                    tape.sampleBuffer = [];
                    for (let i = 0; i < audioBuffer.length; i++) {
                        tape.sampleBuffer[i] = sampleBuffer[i];
                    }
                    tape.resetSampleBuffer();
                    callback();
                },
                function (e) {
                    tape.log.error("Error decoding audio data: " + e);
                }
            );
        }
    }

    setPaused(paused: boolean) {
        this.paused = paused;
    }

    isPlayEnabled() {
        return this.sampleBufferOffset < this.sampleBuffer.length;
    }

    isRewindEnabled() {
        return this.sampleBufferOffset > 0 || this.sampleBufferAudioOffset > 0;
    }

    isRecordingAvailable() {
        return this.sampleBufferAudioOffset > 0;
    }

    record() {
        this.recordPressed = true;
        this.recording = this.motorOn;
        if (this.recording) {
            this.resetSampleBuffer();
        }
    }

    play() {
        this.playPressed = true;
        this.playing = this.motorOn;
        this.playDelay = 64;
    }

    rewind() {
        this.sampleBufferOffset = 0;
        this.sampleBufferAudioOffset = 0;
    }

    stop() {
        this.recordPressed = false;
        this.playPressed = false;
        this.recording = false;
        this.playing = false;
    }

    setMotorOn(value: boolean) {
        this.log.info("Cassette motor " + (value ? "on" : "off"));
        this.motorOn = value;
        this.recording = this.recordPressed;
        this.playing = this.playPressed;
    }

    setAudioGate(value, time) {
        if (this.lastAudioGateChange !== -1 && Math.abs(time - this.lastAudioGateChange) < 1000) {
            const audioGate = typeof value === 'boolean' ? (value ? 0.75 : -0.75) : value;
            const timePassed = Math.min(((time - this.lastAudioGateChange) >> 6), 8);
            for (let i = 0; i < timePassed; i++) {
                this.audioGateBuffer[this.audioGateBufferEnd] = audioGate;
                this.audioGateBufferEnd = (this.audioGateBufferEnd + 1) % Tape.AUDIO_GATE_BUFFER_LENGTH;
            }
        }
        this.lastAudioGateChange = time;
    }

    updateSoundBuffer(buffer) {
        if (!this.paused) {
            if (this.playing) {
                if (this.playDelay === 0) {
                    for (let i = 0; i < buffer.length; i++) {
                        buffer[i] = this.sampleBufferAudioOffset < this.sampleBuffer.length ? this.sampleBuffer[this.sampleBufferAudioOffset++] : 0;
                    }
                    return;
                } else {
                    this.playDelay--;
                }
            } else if (this.recording) {
                if (this.sampleBufferAudioOffset < this.sampleBuffer.length - buffer.length) {
                    for (let i = 0; i < buffer.length; i++) {
                        buffer[i] = this.sampleBuffer[this.sampleBufferAudioOffset++];
                    }
                    return;
                }
            }
        }
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = this.audioGateBuffer[this.audioGateBufferStart];
            if (this.audioGateBufferStart !== this.audioGateBufferEnd) {
                this.audioGateBufferStart = (this.audioGateBufferStart + 1) % Tape.AUDIO_GATE_BUFFER_LENGTH;
            }
        }
    }

    /*
    The reader routine is expected to work like this:
    function readBit() {
      var sign = 0;
      while (more data to read) {
        [wait for 5/8 period]
        var newSign = read();
        var bit;
        if (newSign != sign) {
          bit = 1;
        } else {
          bit = 0;
        }
        sign = newSign;
        while (sign == newSign) {
          sign = read();
        }
        return bit;
      }
    }
    */
    read(): number {
        const sampleBuffer = this.sampleBuffer;
        let readValue = 0;
        if (this.playing && sampleBuffer) {
            const samplesPerBit = this.samplesPerBit;
            const samplesPerHalfBit = samplesPerBit >> 1;
            const samplesPerQuarterBit = samplesPerBit >> 2;
            let offset = this.sampleBufferOffset;
            let posCount = 0;
            let negCount = 0;
            let zeroCount = 0;
            let sample;
            // Determine if it's a positive, negative or zero run
            while (offset < sampleBuffer.length && posCount < samplesPerQuarterBit && negCount < samplesPerQuarterBit && zeroCount < samplesPerHalfBit) {
                sample = sampleBuffer[offset];
                if (sample > 0.08) {
                    posCount++;
                } else if (sample < -0.08) {
                    negCount++;
                } else {
                    zeroCount++;
                }
                offset++;
            }
            let runCount = posCount + negCount + zeroCount;
            // Read remainder of run
            if (posCount === samplesPerQuarterBit) {
                while (sample > 0 && runCount++ < samplesPerBit + 2) {
                    sample = sampleBuffer[++offset];
                }
                if (sample <= 0) {
                    runCount--;
                }
                readValue = 1;
            } else if (negCount === samplesPerQuarterBit) {
                while (sample < 0 && runCount++ < samplesPerBit + 2) {
                    sample = sampleBuffer[++offset];
                }
                if (sample >= 0) {
                    runCount--;
                }
                readValue = 0;
            }
            // console.log(runCount);
            if (runCount > samplesPerHalfBit + samplesPerQuarterBit) {
                offset -= samplesPerHalfBit;
            }
            this.sampleBufferOffset = offset;
        }

        // Debug only - show input bytes in console
        if (Tape.DEBUG) {
            if (this.readFirst) {
                this.lastReadValue = readValue;
                this.readFirst = false;
            } else {
                let bit = readValue !== this.lastReadValue && this.readFirst !== null ? 1 : 0;
                this.outByte = (this.outByte << 1) | bit;
                this.outByteCount--;
                if (this.outByteCount === 0) {
                    this.out += Util.toHexByteShort(this.outByte);
                    this.outByteCount = 8;
                    this.outByte = 0;
                    if (this.out.length === 6) {
                        bit = 0;
                    }
                }
                this.readFirst = true;
            }
            if (this.out.length >= 32 || this.out.length > 0 && this.sampleBufferOffset === this.sampleBuffer.length) {
                this.log.info(this.out);
                this.out = "";
            }
        }

        return readValue;
    }

    // 1: 1/0, 0/1, next
    // 0: 1/0, ---, next

    write(value, time) {
        const interval = this.lastWriteTime === -1 ? 1 : time - this.lastWriteTime;
        if (interval === 1) {
            if (this.lastWriteValue !== null) {
                for (let i = 0; i < Tape.ONE.length; i++) {
                    this.sampleBuffer[this.sampleBufferOffset++] = this.lastWriteValue ? Tape.ONE[i] : -Tape.ONE[i];
                }
                this.lastWriteValue = null;
            } else {
               this.lastWriteValue = value;
            }
        } else if (interval === 2) {
            for (let i = 0; i < Tape.ZERO.length; i++) {
                this.sampleBuffer[this.sampleBufferOffset++] = this.lastWriteValue ? Tape.ZERO[i] : -Tape.ZERO[i];
            }
            this.lastWriteValue = value;
        } else {
            this.log.warn("Unsupported write interval: " + interval);
        }
        this.lastWriteTime = time;
    }

    getRecording(): ArrayBuffer {
        if (this.lastWriteValue !== null) {
            for (let i = 0; i < Tape.ZERO.length; i++) {
                this.sampleBuffer[this.sampleBufferOffset++] = this.lastWriteValue ? Tape.ZERO[i] : -Tape.ZERO[i];
            }
            this.lastWriteValue = null;
        }
        const array = new Float32Array(this.sampleBufferOffset);
        for (let i = 0; i < this.sampleBufferOffset; i++) {
            array[i] = this.sampleBuffer[i];
        }
        const audioBuffer = this.audioContext.createBuffer(1, array.length, this.sampleRate);
        audioBuffer.copyToChannel(array, 0);
        return AudioBufferToWav.convert(audioBuffer, { float32: false });
    }

    getState() {
        return {
            recordPressed: this.recordPressed,
            playPressed: this.playPressed,
            motorOn: this.motorOn,
            playing: this.playing,
            recording: this.recording,
            playDelay: this.playDelay,
            paused: this.paused,
            sampleBuffer: this.sampleBuffer,
            sampleBufferOffset: this.sampleBufferOffset,
            sampleBufferAudioOffset: this.sampleBufferAudioOffset,
            lastWriteValue: this.lastWriteValue,
            lastWriteTime: this.lastWriteTime
        };
    }

    restoreState(state) {
        this.recordPressed = state.recordPressed;
        this.playPressed = state.playPressed;
        this.motorOn = state.motorOn;
        this.playing = state.playing;
        this.recording = state.recording;
        this.playDelay = state.playDelay;
        this.paused = state.paused;
        this.sampleBuffer = state.sampleBuffer;
        this.sampleBufferOffset = state.sampleBufferOffset;
        this.sampleBufferAudioOffset = state.sampleBufferAudioOffset;
        this.lastWriteValue = state.lastWriteValue;
        this.lastWriteTime = state.lastWriteTime;
    }
}
