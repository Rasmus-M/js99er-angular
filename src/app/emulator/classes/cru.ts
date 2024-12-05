import {Log} from '../../classes/log';
import {Keyboard} from './keyboard';
import {Memory} from './memory';
import {Tape} from './tape';
import {Stateful} from '../interfaces/stateful';
import {Util} from '../../classes/util';
import {CPU} from '../interfaces/cpu';
import {Console} from '../interfaces/console';
import {CruDevice} from "../interfaces/cru-device";

export class Cru implements Stateful {

    static TIMER_CYCLES_PER_DECREMENT = 64;

    private console: Console;
    private keyboard: Keyboard;
    private tape: Tape;
    private memory: Memory;
    private cpu: CPU;

    private cru: boolean[];
    private timerMode: boolean;
    private clockRegister: number;
    private readRegister: number;
    private decrementer: number;
    private vdpInterrupt: boolean;
    private timerInterrupt: boolean;
    private timerInterruptCount: number;
    private cruDevices: CruDevice[] = [];

    private log: Log = Log.getLog();

    constructor(console: Console) {
        this.console = console;
        this.init();
    }

    private init() {
        this.console.cyclesPassed().subscribe(
            (cycles) => {
                this.decrementTimer(cycles / Cru.TIMER_CYCLES_PER_DECREMENT);
            }
        );
    }

    public registerCruDevice(cruDevice: CruDevice) {
        this.log.debug("Register CRU device: " + cruDevice.getId());
        this.cruDevices.push(cruDevice);
    }

    public deregisterCruDevice(cruDevice: CruDevice) {
        this.log.debug("Deregister CRU device: " + cruDevice.getId());
        const index = this.cruDevices.indexOf(cruDevice);
        if (index !== -1) {
            this.cruDevices.splice(index, 1);
        }
    }

    public reset() {
        this.memory = this.console.getMemory();
        this.keyboard = this.console.getKeyboard();
        this.tape = this.console.getTape();
        this.cpu = this.console.getCPU();

        this.vdpInterrupt = false;
        this.timerMode = false;
        this.clockRegister = 0;
        this.readRegister = 0;
        this.decrementer = 0;
        this.timerInterrupt = false;
        this.timerInterruptCount = 0;

        this.cru = [];
        for (let i = 0; i < 4096; i++) {
            this.cru[i] = i > 3;
        }
        this.cru[24] = false; // Audio gate
        this.cru[25] = false; // Output to cassette mike jack
    }

    readBit(addr: number): boolean {
        if (addr < 0x800) {
            // TMS9901, etc.
            if (this.timerMode && addr < 16) {
                return this.readBitTimerMode(addr);
            } else {
                if (addr === 2) {
                    // VDP interrupt
                    return !this.vdpInterrupt;
                } else if (addr >= 3 && addr <= 10) {
                    // Keyboard
                    return this.readBitKeyboard(addr);
                } else if (addr === 27) {
                    // Cassette
                    return this.tape.read() === 1;
                }
            }
        } else {
            // DSR space
            const r12BaseAddr = (addr << 1) & 0x1f00;
            for (const cruDevice of this.cruDevices) {
                if (cruDevice.getCruAddress() === r12BaseAddr) {
                    return cruDevice.readCruBit(addr & 0xff);
                }
            }
        }
        return this.cru[addr];
    }

    writeBit(addr: number, value: boolean) {
        if (addr < 0x800) {
            // TMS9901, etc.
            if (this.timerMode && this.writeBitTimerMode(addr, value)) {
                return;
            }
            if (addr === 0) {
                this.setTimerMode(value);
            } else if (addr === 3) {
                this.timerInterrupt = false;
            } else if (addr === 22) {
                this.tape.setMotorOn(value);
            } else if (addr === 24) {
                this.tape.setAudioGate(value, this.cpu.getCycles());
            } else if (addr === 25) {
                this.tape.write(value, this.timerInterruptCount);
            } else if (addr >= 0x0400) {
                const bit = (addr & 0x000f);
                if (value && bit > 0) {
                    const bank = (bit - 1) >> 1;
                    this.memory.setCRUCartBank(bank);
                }
            }
        } else {
            // DSR space
            const r12BaseAddr = (addr << 1) & 0x1f00;
            for (const cruDevice of this.cruDevices) {
                if (cruDevice.getCruAddress() === r12BaseAddr) {
                    cruDevice.writeCruBit(addr & 0x7f, value);
                }
            }
        }
        this.cru[addr] = value;
    }

    readBitKeyboard(addr: number): boolean {
        const col = (this.cru[18] ? 1 : 0) | (this.cru[19] ? 2 : 0) | (this.cru[20] ? 4 : 0);
        // this.log.info("Addr: " + addr + " Col: " + col + " Down: " + this.keyboard.isKeyDown(col, addr));
        if (addr === 7 && !this.cru[21]) {
            return !this.keyboard.isAlphaLockDown();
        } else {
            return !(this.keyboard.isKeyDown(col, addr));
        }
    }

    readBitTimerMode(addr: number): boolean {
        if (addr === 0) {
            return this.timerMode;
        } else if (addr > 0 && addr < 15) {
            return (this.readRegister & (1 << (addr - 1))) !== 0;
        } else if (addr === 15) {
            this.log.info("Read timer interrupt status");
            return this.timerInterrupt;
        }
        return false;
    }

    writeBitTimerMode(addr: number, value: boolean) {
        if (addr > 0 && addr < 15) {
            // Write to clock register
            const bit  = 1 << (addr - 1);
            if (value) {
                this.clockRegister |= bit;
            } else {
                this.clockRegister &= ~bit;
            }
            // If any bit between 1 and 14 is written to while in timer mode, the decrementer
            // will be reinitialized with the current value of the Clock register
            if (this.clockRegister !== 0) {
                this.decrementer = this.clockRegister;
            }
            return true;
        } else if (addr === 15 && !value) {
            // TODO: Should be a soft reset
            this.log.info("Reset 9901");
            // this.reset();
        } else if (addr >= 16) {
            this.setTimerMode(false);
        }
        return false;
    }

    setVDPInterrupt(value: boolean) {
        this.vdpInterrupt = value;
    }

    setTimerMode(value: boolean) {
        if (value) {
            // this.log.info("9901 timer mode");
            this.timerMode = true;
            if (this.clockRegister !== 0) {
                this.readRegister = this.decrementer;
            } else {
                this.readRegister = 0;
            }
        } else {
            // this.log.info("9901 timer mode off");
            this.timerMode = false;
        }
    }

    decrementTimer(value: number) {
        if (this.clockRegister !== 0) {
            this.decrementer -= value;
            if (this.decrementer <= 0) {
                this.decrementer += this.clockRegister;
                // this.log.info("Timer interrupt");
                this.timerInterrupt = true;
                this.timerInterruptCount++;
            }
        }
    }

    isVDPInterrupt(): boolean {
        return this.vdpInterrupt && this.cru[2];
    }

    isTimerInterrupt(): boolean {
        return this.timerInterrupt && this.cru[3];
    }

    getStatusString(detailed: boolean): string {
        return "CRU: " + (this.cru[0] ? "1" : "0") + (this.cru[1] ? "1" : "0") + (this.cru[2] ? "1" : "0") + (this.cru[3] ? "1" : "0") + " " +
            "Timer: " + Util.toHexWord(Math.floor(this.decrementer)) + " " +
            (this.isTimerInterrupt() ? "Tint " : "    ")  + (this.isVDPInterrupt() ? "Vint" : "   ");
    }

    getState(): object {
        return {
            cru: this.cru,
            vdpInterrupt: this.vdpInterrupt,
            timerMode: this.timerMode,
            clockRegister: this.clockRegister,
            readRegister: this.readRegister,
            decrementer: this.decrementer,
            timerInterrupt: this.timerInterrupt,
            timerInterruptCount: this.timerInterruptCount
        };
    }

    restoreState(state: any) {
        this.cru = state.cru;
        this.vdpInterrupt = state.vdpInterrupt;
        this.timerMode = state.timerMode;
        this.clockRegister = state.clockRegister;
        this.readRegister = state.readRegister;
        this.decrementer = state.decrementer;
        this.timerInterrupt = state.timerInterrupt;
        this.timerInterruptCount = state.timerInterruptCount;
    }
}
