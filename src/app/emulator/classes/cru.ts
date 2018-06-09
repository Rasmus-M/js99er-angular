import {Log} from '../../log';
import {Keyboard} from './keyboard';
import {Memory} from './memory';
import {Tape} from './tape';
import {State} from '../interfaces/state';
import {TMS9900} from './tms9900';
import {AMS} from './ams';
import {Util} from '../util';
import {CPU} from '../interfaces/cpu';

export class CRU implements State {

    static TIMER_DECREMENT_PER_FRAME = 781; // 50000 / 64;
    static TIMER_DECREMENT_PER_SCANLINE = 2.8503;

    private keyboard: Keyboard;
    private tape: Tape;
    private memory: Memory;

    private cru: boolean[];
    private timerMode: boolean;
    private clockRegister: number;
    private readRegister: number;
    private decrementer: number;
    private vdpInterrupt: boolean;
    private timerInterrupt: boolean;
    private timerInterruptCount: number;

    private log: Log;

    constructor(keyboard: Keyboard, tape: Tape) {
        this.keyboard = keyboard;
        this.tape = tape;
        this.cru = [];
        this.log = Log.getLog();
        this.reset();
    }

    setMemory(memory: Memory) {
        this.memory = memory;
    }

    reset() {
        this.vdpInterrupt = false;
        this.timerMode = false;
        this.clockRegister = 0;
        this.readRegister = 0;
        this.decrementer = 0;
        this.timerInterrupt = false;
        this.timerInterruptCount = 0;
        for (let i = 0; i < 4096; i++) {
            this.cru[i] = i > 3;
        }
        this.cru[24] = false; // Audio gate
        this.cru[25] = false; // Output to cassette mike jack
    }

    readBit(addr) {
        if (!this.timerMode) {
            // VDP interrupt
            if (addr === 2) {
                return !this.vdpInterrupt;
            } else if (addr >= 3 && addr <= 10) {
                // Keyboard
                const col = (this.cru[18] ? 1 : 0) | (this.cru[19] ? 2 : 0) | (this.cru[20] ? 4 : 0);
                // this.log.info("Addr: " + addr + " Col: " + col + " Down: " + this.keyboard.isKeyDown(col, addr));
                if (addr === 7 && !this.cru[21]) {
                    return !this.keyboard.isAlphaLockDown();
                } else {
                    return !(this.keyboard.isKeyDown(col, addr));
                }
            }
        } else {
            // Timer
            if (addr === 0) {
                return this.timerMode;
            } else if (addr > 0 && addr < 15) {
                return (this.readRegister & (1 << (addr - 1))) !== 0;
            } else if (addr === 15) {
                this.log.info("Read timer interrupt status");
                return this.timerInterrupt;
            }
        }
        // Cassette
        if (addr === 27) {
            return this.tape.read();
        }
        return this.cru[addr];
    }

    writeBit(addr, value) {
        if (addr >= 0x800) {
            // DSR space
            addr <<= 1; // Convert to R12 space i.e. >= >1000
            if ((addr & 0xff) === 0) {
                // Enable DSR ROM
                const dsr = (addr >> 8) & 0xf; // 256
                // this.log.info("DSR ROM " + dsr + " " + (bit ? "enabled" : "disabled") + ".");
                this.memory.setPeripheralROM(dsr, value);
            }
            // AMS
            if (addr >= 0x1e00 && addr < 0x1f00 && this.memory.isAMSEnabled()) {
                const bitNo = (addr & 0x000e) >> 1;
                if (bitNo === 0) {
                    // Controls access to mapping registers
                    this.memory.getAMS().setRegisterAccess(value);
                } else if (bitNo === 1) {
                    // Toggles between mapping mode and transparent mode
                    this.memory.getAMS().setMode(value ? AMS.MAPPING_MODE : AMS.TRANSPARENT_MODE);
                }
            }
        } else {
            // Timer
            if (addr === 0) {
                this.setTimerMode(value);
            } else if (this.timerMode) {
                if (addr > 0 && addr < 15) {
                    // Write to clock register
                    const bit  = 1 << (addr - 1);
                    if (value) {
                        this.clockRegister |= bit;
                    } else {
                        this.clockRegister &= ~bit;
                    }
                    // If any bit between 1 and 14 is written to while in timer mode, the decrementer will be reinitialized with the current value of the Clock register
                    if (this.clockRegister !== 0) {
                        this.decrementer = this.clockRegister;
                    }
                    // Do not set cru bit
                    return;
                } else if (addr === 15 && !value) {
                    // TODO: Should be a soft reset
                    this.log.info("Reset 9901");
                    // this.reset();
                } else if (addr >= 16) {
                    this.setTimerMode(false);
                }
            } else {
                if (addr === 3) {
                    this.timerInterrupt = false;
                }
            }
            if (addr === 22) {
                this.tape.setMotorOn(value);
            } else if (addr === 25) {
                this.tape.write(value, this.timerInterruptCount);
            }
            // this.log.info("Write CRU address " + addr.toHexWord() + ": " + bit);
            this.cru[addr] = value;
        }
    }

    setVDPInterrupt(value) {
        this.vdpInterrupt = value;
    }

    setTimerMode(value) {
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

    decrementTimer(value) {
        if (this.clockRegister !== 0) {
            this.decrementer -= value;
            if (this.decrementer <= 0) {
                this.decrementer = this.clockRegister;
                // this.log.info("Timer interrupt");
                this.timerInterrupt = true;
                this.timerInterruptCount++;
            }
        }
    }

    isVDPInterrupt() {
        return this.vdpInterrupt && this.cru[2];
    }

    isTimerInterrupt() {
        return this.timerInterrupt && this.cru[3];
    }

    getStatusString() {
        return "CRU: " + (this.cru[0] ? "1" : "0") + (this.cru[1] ? "1" : "0") + (this.cru[2] ? "1" : "0") + (this.cru[3] ? "1" : "0") + " " +
            "Timer: " + Util.toHexWord(Math.floor(this.decrementer)) + " " +
            (this.isTimerInterrupt() ? "Tint " : "    ")  + (this.isVDPInterrupt() ? "Vint" : "   ");
    }

    getState() {
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

    restoreState(state) {
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
