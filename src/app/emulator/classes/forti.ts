import {PSG} from "../interfaces/psg";
import {CPU} from "../interfaces/cpu";
import {Tape} from "./tape";
import {TMS9919} from "./tms9919";

export class Forti implements PSG {

    private tms9919s: TMS9919[];

    constructor (cpu: CPU, tape: Tape) {
        this.tms9919s = [];
        for (let i = 0; i < 5; i++) {
            this.tms9919s[i] = new TMS9919(cpu, tape);
        }
    }

    reset(): void {
        this.tms9919s.forEach(tms9919 => {
            tms9919.reset();
        });
    }

    setSampleRate(sampleRate: number): void {
        this.tms9919s.forEach(tms9919 => {
            tms9919.setSampleRate(sampleRate);
        });
    }

    writeData(addr: number, b: number): void {
        this.tms9919s[0].writeData(addr, b);
        if ((addr & 0x02) === 0) {
            this.tms9919s[1].writeData(addr, b);
        }
        if ((addr & 0x04) === 0) {
            this.tms9919s[2].writeData(addr, b);
        }
        if ((addr & 0x08) === 0) {
            this.tms9919s[3].writeData(addr, b);
        }
        if ((addr & 0x10) === 0) {
            this.tms9919s[4].writeData(addr, b);
        }
    }

    mute(): void {
        this.tms9919s.forEach(tms9919 => {
            tms9919.mute();
        });
    }

    setGROMClock(gromClock: number): void {
        this.tms9919s.forEach(tms9919 => {
            tms9919.setGROMClock(gromClock);
        });
    }

    update(buffer: Int8Array, length: number): void {
        const tmpBuffer = new Int8Array(length);
        this.tms9919s.forEach((tms9919, i) => {
            tms9919.update(tmpBuffer, length);
            if (i === 0) {
                buffer.set(tmpBuffer, 0);
            } else {
                for (let i = 0; i < length; i++) {
                    const s = buffer[i] + (tmpBuffer[i] >> 1);
                    buffer[i] = s > 127 ? 127 : s < -128 ? -128 : s;
                }
            }
        });
    }

    getRegsString(detailed: boolean): string {
        return this.tms9919s[0].getRegsString(detailed);
    }

    getState(): any {
        return this.tms9919s.map(tms9919 => tms9919.getState());
    }

    restoreState(states: any[]) {
        this.tms9919s.forEach((tms9919, i) => {
            tms9919.restoreState(states[i]);
        });
    }
}
