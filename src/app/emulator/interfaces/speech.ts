import {Stateful} from './stateful';
import {Observable} from "rxjs";

export interface Speech extends Stateful {
    reset(): void;
    setEnabled(enabled: boolean): void;
    write(b: number): void;
    read(): number;
    update(buffer: Int16Array, length: number): void;
    isReady(): Observable<boolean>;
}
