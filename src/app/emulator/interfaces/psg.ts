import {State} from './state';

export interface PSG extends State {
    reset(): void;
    setSampleRate(sampleRate: number): void;
    writeData(b: number): void;
    mute(): void;
    setGROMClock(gromClock: number);
    update(buffer: Int8Array, length): void;
}
