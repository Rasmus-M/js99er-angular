import {Stateful} from './stateful';

export interface PSG extends Stateful {
    reset(): void;
    setSampleRate(sampleRate: number): void;
    writeData(b: number): void;
    mute(): void;
    setGROMClock(gromClock: number): void;
    update(buffer: Int8Array, length: number): void;
    getRegsString(detailed: boolean): string;
}
