import {Joystick} from './joystick';
import {Stateful} from '../interfaces/stateful';
import {Settings} from '../../classes/settings';
import {Key, KeyMapper, TIKey} from "../../classes/key-mapper";
import {Console} from '../interfaces/console';
import {Memory} from "./memory";

export class Keyboard implements Stateful {

    static readonly KEYPRESS_DURATION = 100;

    private document: Document;
    private console: Console;
    private pcKeyboardEnabled: boolean;
    private mapArrowKeysToFctnSDEX: boolean;
    private mappedArrowKeyPressed: TIKey | null;
    private running: boolean;
    private columns: boolean[][];
    private joystick1: Joystick;
    private joystick2: Joystick;
    private joystickActiveCountdown: number;
    private joystickHandle: number;
    private keyCode: number;
    private alphaLock: boolean;
    private keyHandles: {[key: string]: number};
    private pasteToggle: boolean;
    private pasteBuffer: string | null;
    private pasteIndex: number;

    private keydownListener: ((evt: KeyboardEvent) => void) | null;
    private keyupListener: ((evt: KeyboardEvent) => void) | null;
    private pasteListener: ((evt: ClipboardEvent) => void) | null;

    constructor(document: Document, console: Console, settings: Settings) {
        this.document = document;
        this.console = console;
        this.pcKeyboardEnabled = settings.isPCKeyboardEnabled();
        this.mapArrowKeysToFctnSDEX = settings.isMapArrowKeysEnabled();
        this.mappedArrowKeyPressed = null;
        this.running = false;
        this.columns = new Array(9);
        for (let col = 0; col < 8; col++) {
            this.columns[col] = [];
        }
        this.keyHandles = {};
        this.console.getCPU().instructionExecuting().subscribe(
            (pc) => {
                if (pc === 0x478) {
                    this.pasteHook();
                }
            }
        );
    }

    reset() {
        this.resetKeyMap();
        if (!this.joystick1) {
            this.joystick1 = new Joystick(this.columns[6], 0);
        }
        if (!this.joystick2) {
            this.joystick2 = new Joystick(this.columns[7], 1);
        }
        this.joystickActiveCountdown = 0;
        if (!this.joystickHandle) {
            this.joystickHandle = window.setInterval(
                () => {
                    this.joystickActiveHandler();
                }, 100
            );
        }
        this.keyCode = 0;
        this.alphaLock = true;
        this.pasteBuffer = null;
        this.pasteIndex = 0;
    }

    private resetKeyMap() {
        for (let col = 0; col < 8; col++) {
            for (let row = 3; row <= 10; row++) {
                this.columns[col][row] = false;
            }
        }
    }

    start() {
        if (!this.running) {
            this.resetKeyMap();
            this.attachListeners();
            this.joystick1.start();
            this.joystick2.start();
            this.running = true;
        }
    }

    stop() {
        if (this.running) {
            this.removeListeners();
            this.joystick1.stop();
            this.joystick2.stop();
            this.running = false;
        }
    }

    private attachListeners() {
        if (!this.pcKeyboardEnabled) {
            if (!this.keydownListener) {
                this.keydownListener = (evt: KeyboardEvent) => {
                    this.keyEvent(evt, true);
                };
                this.document.addEventListener( "keydown", this.keydownListener);
            }
            if (!this.keyupListener) {
                this.keyupListener = (evt: KeyboardEvent) => {
                    this.keyEvent(evt, false);
                };
                this.document.addEventListener("keyup", this.keyupListener);
            }
        } else {
            if (!this.keydownListener) {
                this.keydownListener = (evt: KeyboardEvent) => {
                    this.keyEventPC(evt, true);
                };
                this.document.addEventListener("keydown", this.keydownListener);
            }
            if (!this.keyupListener) {
                this.keyupListener = (evt: KeyboardEvent) => {
                    this.keyEventPC(evt, false);
                };
                this.document.addEventListener("keyup", this.keyupListener);
            }
        }
        if (!this.pasteListener) {
            this.pasteListener = (evt: ClipboardEvent) => {
                if (evt.clipboardData) {
                    this.pasteBuffer = "\n" + evt.clipboardData.getData('text/plain') + "\n";
                    this.pasteIndex = 0;
                }
            };
            this.document.addEventListener("paste", this.pasteListener);
        }
    }

    private removeListeners() {
        if (this.keyupListener) {
            this.document.removeEventListener("keyup", this.keyupListener);
            this.keyupListener = null;
        }
        if (this.keydownListener) {
            this.document.removeEventListener("keydown", this.keydownListener);
            this.keydownListener = null;
        }
        if (this.pasteListener) {
            this.document.removeEventListener("paste", this.pasteListener);
            this.pasteListener = null;
        }
    }

    setPCKeyboardEnabled(enabled: boolean) {
        this.pcKeyboardEnabled = enabled;
        const wasRunning = this.running;
        if (wasRunning) {
            this.stop();
        }
        this.reset();
        if (wasRunning) {
            this.start();
        }
    }

    setMapArrowKeysToFctnSDEXEnabled(enabled: boolean) {
        this.mapArrowKeysToFctnSDEX = enabled;
        const wasRunning = this.running;
        if (wasRunning) {
            this.stop();
        }
        this.reset();
        if (wasRunning) {
            this.start();
        }
    }

    private keyEvent(evt: KeyboardEvent | any, down: boolean) {
        let key: Key | undefined;
        if (evt.code) {
            key = KeyMapper.getKeyFromCode(evt.code);
        } else if (evt.keyCode) {
            key = KeyMapper.getKeyFromKeyCode(evt.keyCode);
        }
        if (key) {
            key.tiKeys.forEach((tiKey) => {
                this.setTIKeyDown(tiKey, down);
            });
            if (key.code) {
                this.handleAdditionalKeys(key.code, down);
            }
        }
        if (!key || this.handledByBrowser(evt)) {
            // Let browser handle unused keys
            return;
        }
        evt.preventDefault();
    }

    // For PC keyboard
    private keyEventPC(evt: KeyboardEvent | any, down: boolean) {
        // console.log(evt.keyCode, evt.charCode, evt.code, evt.key);
        let key: Key | undefined;
        if (evt.key) {
            key = KeyMapper.getKeyFromKey(evt.key);
        } else if (evt.keyCode) {
            key = KeyMapper.getKeyFromKeyCode(evt.keyCode);
        }
        if (key && key.key) {
            const fctn = this.isTIKeyDown(TIKey.Fctn);
            const ctrl = this.isTIKeyDown(TIKey.Ctrl);
            this.setTIKeyDown(TIKey.Fctn, false);
            this.setTIKeyDown(TIKey.Shift, false);
            this.setTIKeyDown(TIKey.Ctrl, false);
            key.tiKeys.forEach((tiKey) => {
                this.setTIKeyDown(tiKey, down);
                if (!tiKey.isSticky() && key.key) {
                    const handle = this.keyHandles[key.key];
                    if (handle) {
                        window.clearTimeout(handle);
                    }
                    if (down) {
                        this.keyHandles[key.key] = window.setTimeout(
                            () => {
                                this.setTIKeyDown(tiKey, false);
                            }, Keyboard.KEYPRESS_DURATION
                        );
                    }
                }
            });
            this.handleAdditionalKeys(key.key, down);
            // Handle Fctn + S/D/E/X
            if (fctn && ['s', 'd', 'e', 'x'].indexOf(key.key.toLowerCase()) !== -1) {
                this.setTIKeyDown(TIKey.Fctn, true);
            }
            // Handle Ctrl + C/V
            if (ctrl && ['c', 'v'].indexOf(key.key.toLowerCase()) !== -1) {
                this.setTIKeyDown(TIKey.Ctrl, true);
            }
        }
        if (!key || this.handledByBrowser(evt)) {
            // Let browser handle unused keys
            return;
        }
        evt.preventDefault();
    }

    private handledByBrowser(evt: KeyboardEvent) {
        return evt.metaKey ||
            (this.isTIKeyDown(TIKey.Ctrl) && this.isTIKeyDown(TIKey.Shift) && this.isTIKeyDown(TIKey.KeyI) || // Ctrl + Shift + I (Developer console)
            (this.isTIKeyDown(TIKey.Ctrl) && this.isTIKeyDown(TIKey.KeyC)) || // Ctrl + C (copy)
            (this.isTIKeyDown(TIKey.Ctrl) && this.isTIKeyDown(TIKey.KeyV)));  // Ctrl + V (paste)
    }

    private handleAdditionalKeys(code: string, down: boolean) {
        switch (code) {
            case 'ArrowLeft':
                this.handleMappedArrowKey(TIKey.KeyS, down);
                break;
            case 'ArrowRight':
                this.handleMappedArrowKey(TIKey.KeyD, down);
                break;
            case 'ArrowDown':
                this.handleMappedArrowKey(TIKey.KeyX, down);
                break;
            case 'ArrowUp':
                this.handleMappedArrowKey(TIKey.KeyE, down);
                break;
            case 'CapsLock':
                if (down) {
                    this.alphaLock = !this.alphaLock;
                }
                break;
        }
    }

    private handleMappedArrowKey(key: TIKey, down: boolean) {
        if (this.mapArrowKeysToFctnSDEX && this.joystickActiveCountdown === 0 && (!this.mappedArrowKeyPressed || this.mappedArrowKeyPressed === key)) {
            this.setTIKeyDown(TIKey.Fctn, down);
            this.setTIKeyDown(key, down);
            this.mappedArrowKeyPressed = down ? key : null;
        }
    }

    private isTIKeyDown(tiKey: TIKey) {
        return this.columns[tiKey.col][tiKey.row];
    }

    private setTIKeyDown(tiKey: TIKey, down: boolean) {
        this.columns[tiKey.col][tiKey.row] = down;
    }

    isKeyDown(col: number, row: number): boolean {
        if (col === 6 || col === 7) {
            this.joystickActiveCountdown = 10;
        }
        return this.columns[col][row];
    }

    isAlphaLockDown(): boolean {
        // this.log.info("Alpha Lock " + this.alphaLock);
        return this.alphaLock;
    }

    private joystickActiveHandler() {
        if (this.joystickActiveCountdown > 0) {
            this.joystickActiveCountdown--;
        }
    }

    simulateKeyPresses(keyString: string, callback: (() => void) | null) {
        if (keyString.length > 0) {
            const pause = keyString.charAt(0) === "§";
            if (!pause) {
                const charCode = keyString.charCodeAt(0);
                this.simulateKeyPress(charCode > 96 ? charCode - 32 : charCode, () => {
                    window.setTimeout(() => {
                        this.simulateKeyPresses(keyString.substr(1), callback);
                    }, Keyboard.KEYPRESS_DURATION);
                });
            } else {
                window.setTimeout(() => {
                    this.simulateKeyPresses(keyString.substr(1), callback);
                }, 1000);
            }
        } else if (callback) {
            callback();
        }
    }

    simulateKeyPress(keyCode: number, callback: (() => void) | null) {
        this.simulateKeyDown(keyCode);
        window.setTimeout(() => {
            this.simulateKeyUp(keyCode);
            if (callback) {
                callback();
            }
        }, Keyboard.KEYPRESS_DURATION);
    }

    // Keypress from the virtual keyboard
    virtualKeyPress(keyCode: number) {
        this.virtualKeyDown(keyCode);
        if (keyCode !== 16 && keyCode !== 17 && keyCode !== 18) {
            window.setTimeout(() => {
                this.virtualKeyUp(keyCode);
            }, Keyboard.KEYPRESS_DURATION);
        }
    }

    private virtualKeyDown(keyCode: number) {
        this.simulateKeyDown(keyCode);
        if (keyCode !== 16) {
            window.setTimeout(() => {
                this.simulateKeyUp(16);
            }, Keyboard.KEYPRESS_DURATION);
        }
        if (keyCode !== 17) {
            window.setTimeout(() => {
                this.simulateKeyUp(17);
            }, Keyboard.KEYPRESS_DURATION);
        }
        if (keyCode !== 18) {
            window.setTimeout(() => {
                this.simulateKeyUp(18);
            }, Keyboard.KEYPRESS_DURATION);
        }
    }

    private virtualKeyUp(keyCode: number) {
        this.simulateKeyUp(keyCode);
    }

    private simulateKeyDown(keyCode: number) {
        this.keyEvent({keyCode: keyCode, preventDefault() {}}, true);
    }

    private simulateKeyUp(keyCode: number) {
        this.keyEvent({keyCode: keyCode, preventDefault() {}}, false);
    }

    getPasteCharCode(): number {
        let charCode = -1;
        while (charCode === -1 && this.pasteBuffer && this.pasteBuffer.length > this.pasteIndex) {
            const tmpCharCode = this.pasteBuffer.charCodeAt(this.pasteIndex++);
            if (tmpCharCode >= 32 && tmpCharCode <= 127) {
                charCode = tmpCharCode;
            } else if (tmpCharCode === 10) {
                charCode = 13;
            }
        }
        if (this.pasteBuffer && this.pasteIndex === this.pasteBuffer.length) {
            this.pasteBuffer = null;
        }
        return charCode;
    }

    pasteHook() {
        // MOVB R0,@>8375
        if (!this.pasteToggle) {
            const memory = this.console.getMemory();
            const charCode = this.getPasteCharCode();
            if (charCode !== -1) {
                const keyboardDevice: number = memory.getPADByte(0x8374);
                if (keyboardDevice === 0 || keyboardDevice === 5) {
                    const wp = this.console.getCPU().getWp();
                    this.writeMemoryByte(memory, wp, charCode); // Set R0
                    this.writeMemoryByte(memory, wp + 12, memory.getPADByte(0x837c) | 0x20); // Set R6 (status byte)
                    // Detect Extended BASIC
                    const cartridge = this.console.getMemory().getCartridge();
                    if (cartridge && cartridge.isExtendedBasic()) {
                        memory.setPADByte(0x835F, 0x5d); // Max length for BASIC continuously set
                    }
                }
                memory.setPADByte(0x837c, memory.getPADByte(0x837c) | 0x20);
            }
        }
        this.pasteToggle = !this.pasteToggle;
    }

    writeMemoryByte(memory: Memory, addr: number, b: number) {
        const w = memory.getWord(addr); // Read before write
        memory.writeWord(addr, (addr & 1) !== 0 ? (w & 0xFF00) | b : (w & 0x00FF) | (b << 8), this.console.getCPU());
    }

    getState(): any {
        return {
            pcKeyboardEnabled: this.pcKeyboardEnabled,
            mapArrowKeysToFctnSDEX: this.mapArrowKeysToFctnSDEX,
            columns: this.columns,
            joystickActive: this.joystickActiveCountdown,
            keyCode: this.keyCode,
            alphaLock: this.alphaLock,
            pasteBuffer: this.pasteBuffer,
            pasteIndex: this.pasteIndex,
            joystick1: this.joystick1.getState(),
            joystick2: this.joystick2.getState()
        };
    }

    restoreState(state: any) {
        this.pcKeyboardEnabled = state.pcKeyboardEnabled;
        this.mapArrowKeysToFctnSDEX = state.mapArrowKeysToFctnSDEX;
        this.columns = state.columns;
        this.joystickActiveCountdown = state.joystickActiveCountdown;
        this.keyCode = state.keyCode;
        this.alphaLock = state.alphaLock;
        this.pasteBuffer = state.pasteBuffer;
        this.pasteIndex = state.pasteIndex;
        this.joystick1.restoreState(state.joystick1);
        this.joystick2.restoreState(state.joystick2);
    }
}
