import {CPU} from './cpu';
import {Stateful} from './stateful';

export interface Speech extends Stateful {
    setCPU(cpu: CPU): void;
    reset(): void;
    writeSpeechData(b: number): void;
    readSpeechData(): number;
    setSpeechEnabled(enabled: boolean): void;
    update(buffer: Int16Array, length: number): void;
}
