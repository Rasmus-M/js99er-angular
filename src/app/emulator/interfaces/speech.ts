import {CPU} from './cpu';
import {State} from './state';

export interface Speech extends State {
    setCPU(cpu: CPU): void;
    reset(): void;
    writeSpeechData(b: number): void;
    readSpeechData(): number;
    setSpeechEnabled(enabled: boolean): void;
    update(buffer: Int16Array, length: number);
}
