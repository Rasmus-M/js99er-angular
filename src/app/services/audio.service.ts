import {Injectable} from '@angular/core';
import {Tape} from '../emulator/classes/tape';
import {TMS5200} from '../emulator/classes/tms5200';
import {PSG} from '../emulator/interfaces/psg';
import {Speech} from '../emulator/interfaces/speech';
import {Log} from '../classes/log';

@Injectable()
export class AudioService {

    static readonly USE_SPEECH_SAMPLE_INTERPOLATION = true;

    private audioContext: AudioContext;
    private enabled: boolean;
    private psg: PSG;
    private speech: Speech;
    private tape: Tape;
    private sampleRate: number;
    private bufferSize: number;
    private psgSampleBuffer: Int8Array;
    private psgScriptProcessor: ScriptProcessorNode;
    private speechScale: number;
    private speechSampleBuffer: Int16Array;
    private speechScriptProcessor: ScriptProcessorNode;
    private speechFilter: BiquadFilterNode;
    private tapeScriptProcessor: ScriptProcessorNode;
    private tapeFilter: BiquadFilterNode;
    private mediaStreamDestination: MediaStreamAudioDestinationNode;

    private log: Log = Log.getLog();

    constructor() { }

    public resumeSound() {
        if (this.audioContext && this.audioContext.state !== "running") {
            console.log("Resume sound");
            this.audioContext.resume().then(
                () => {
                    console.log("Resumed");
                },
                (error) => {
                    console.log(error);
                }
            );
        }
    }

    init(enabled: boolean, psg: PSG, speech: Speech, tape: Tape) {
        this.psg = psg;
        this.speech = speech;
        this.tape = tape;
        if (!this.audioContext && AudioContext) {
            this.audioContext = new AudioContext();
        }
        if (this.audioContext) {
            this.log.info("Web Audio API detected");
            this.sampleRate = this.audioContext.sampleRate;
            this.log.info('AudioContext: sample rate is ' + this.sampleRate);
            this.bufferSize = 1024;
            const that = this;
            if (psg) {
                psg.setSampleRate(this.sampleRate);
                this.psgSampleBuffer = new Int8Array(this.bufferSize);
                this.psgScriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 0, 1);
                this.psgScriptProcessor.addEventListener("audioprocess", function (event) { that.onPSGAudioProcess(event); });
            }
            if (speech) {
                const speechSampleRate = TMS5200.SAMPLE_RATE;
                this.speechScale = this.sampleRate / speechSampleRate;
                this.speechSampleBuffer = new Int16Array(Math.floor(this.bufferSize / this.speechScale) + 1);
                this.speechScriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 0, 1);
                this.speechScriptProcessor.addEventListener("audioprocess", function (event) { that.onSpeechAudioProcess(event); });
                this.speechFilter = this.audioContext.createBiquadFilter();
                this.speechFilter.type = "lowpass";
                this.speechFilter.frequency.value = speechSampleRate / 2;
            }
            if (tape) {
                this.tapeScriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 0, 1);
                this.tapeScriptProcessor.addEventListener("audioprocess", function (event) { that.onTapeAudioProcess(event); });
                this.tapeFilter = this.audioContext.createBiquadFilter();
                this.tapeFilter.type = "lowpass";
                this.tapeFilter.frequency.value = 4000;
            }
            this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
            this.setSoundEnabled(enabled);
        } else {
            this.log.warn("Web Audio API not supported by this browser.");
        }
    }

    onPSGAudioProcess(event: AudioProcessingEvent) {
        // Get Float32Array output buffer
        const out = event.outputBuffer.getChannelData(0);
        // Get Int8Array input buffer
        this.psg.update(this.psgSampleBuffer, this.bufferSize);
        // Process buffer conversion
        for (let i = 0; i < this.bufferSize; i++) {
            out[i] = this.psgSampleBuffer[i] / 128.0;
        }
    }

    onSpeechAudioProcess(event: AudioProcessingEvent) {
        // Get Float32Array output buffer
        const out = event.outputBuffer.getChannelData(0);
        // Get Int16Array input buffer
        this.speech.update(this.speechSampleBuffer, this.speechSampleBuffer.length);
        // Process buffer conversion
        let s = 0;
        let r = 0;
        for (let i = 0; i < this.speechSampleBuffer.length; i++) {
            r += this.speechScale;
            let sample = this.speechSampleBuffer[i] / 32768.0;
            let step = 0;
            if (AudioService.USE_SPEECH_SAMPLE_INTERPOLATION) {
                const nextSample = i < this.speechSampleBuffer.length - 1 ? this.speechSampleBuffer[i + 1] / 32768.0 : sample;
                step = (nextSample - sample) / r;
            }
            while (r >= 1) {
                out[s++] = sample;
                sample += step;
                r--;
            }
        }
    }

    onTapeAudioProcess(event: AudioProcessingEvent) {
        const out = event.outputBuffer.getChannelData(0);
        this.tape.updateSoundBuffer(out);
    }

    setSoundEnabled(enabled: boolean) {
        this.resumeSound();
        if (this.audioContext) {
            if (enabled && !this.enabled) {
                if (this.psgScriptProcessor) {
                    this.psgScriptProcessor.connect(this.audioContext.destination);
                    this.psgScriptProcessor.connect(this.mediaStreamDestination);
                }
                if (this.speechScriptProcessor) {
                    this.speechScriptProcessor.connect(this.speechFilter);
                    this.speechFilter.connect(this.audioContext.destination);
                    this.speechScriptProcessor.connect(this.mediaStreamDestination);
                }
                if (this.tapeScriptProcessor) {
                    this.tapeScriptProcessor.connect(this.tapeFilter);
                    this.tapeFilter.connect(this.audioContext.destination);
                }
            } else if (!enabled && this.enabled) {
                if (this.psgScriptProcessor) {
                    this.psgScriptProcessor.disconnect();
                }
                if (this.speechScriptProcessor) {
                    this.speechScriptProcessor.disconnect();
                    this.speechFilter.disconnect();
                }
                if (this.tapeScriptProcessor) {
                    this.tapeScriptProcessor.disconnect();
                }
            }
        }
        this.enabled = enabled;
    }

    getMediaStream(): MediaStream {
        return this.mediaStreamDestination && this.mediaStreamDestination.stream;
    }
}
