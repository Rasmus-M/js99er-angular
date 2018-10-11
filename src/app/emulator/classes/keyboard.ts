import {Log} from '../../classes/log';
import {Joystick} from './joystick';
import {State} from '../interfaces/state';
import {Settings} from '../../classes/settings';
import {Key, Keymapper} from "../../classes/keymapper";

export class Keyboard implements State {

    static KEYPRESS_DURATION = 100;
    static EMULATE_JOYSTICK_2 = false;

    private document: Document;
    private pcKeyboardEnabled: boolean;
    private mapArrowKeysToFctnSDEX: boolean;
    private columns: boolean[][];
    private joystick1: Joystick;
    private joystick2: Joystick;
    private joystickActive: number;
    private keyCode: number;
    private keyMap: object;
    private alphaLock: boolean;
    private pasteBuffer: string;
    private pasteIndex: number;

    private keydownListener: EventListener;
    private keyupListener: EventListener;
    private keypressListener: EventListener;
    private pasteListener: EventListener;

    private log: Log = Log.getLog();

    constructor(document: Document, settings: Settings) {
        this.document = document;
        this.pcKeyboardEnabled = settings.isPCKeyboardEnabled();
        this.mapArrowKeysToFctnSDEX = settings.isMapArrowKeysEnabled();
        this.columns = new Array(9);
        for (let col = 0; col < 8; col++) {
            this.columns[col] = [];
        }
    }

    reset() {
        for (let col = 0; col < 8; col++) {
            for (let addr = 3; addr <= 10; addr++) {
                this.columns[col][addr] = false;
            }
        }

        if (!this.joystick1) {
            this.joystick1 = new Joystick(this.columns[6], 0);
        }
        if (!this.joystick2) {
            this.joystick2 = new Joystick(this.columns[7], 1);
        }

        this.joystickActive = 250;
        this.keyCode = 0;
        this.keyMap = {};
        this.alphaLock = true;
        this.pasteBuffer = null;
        this.pasteIndex = 0;

        // Remove keyboard listeners
        // this.removeListeners();
        // Attach keyboard listeners
        // this.attachListeners();
    }

    start() {
        this.attachListeners();
        this.joystick1.start();
        this.joystick2.start();
    }

    stop() {
        this.removeListeners();
        this.joystick1.stop();
        this.joystick2.stop();
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
                    this.keyEvent2(evt, true);
                };
                this.document.addEventListener("keydown", this.keydownListener);
            }
            if (!this.keypressListener) {
                this.keypressListener = (evt: KeyboardEvent) => {
                    this.keyPressEvent(evt);
                };
                this.document.addEventListener("keypress", this.keypressListener);
            }
            if (!this.keyupListener) {
                this.keyupListener = (evt: KeyboardEvent) => {
                    this.keyEvent2(evt, false);
                };
                this.document.addEventListener("keyup", this.keyupListener);
            }
        }
        if (!this.pasteListener) {
            this.pasteListener = (evt: ClipboardEvent) => {
                this.pasteBuffer = "\n" + evt.clipboardData.getData('text/plain') + "\n";
                this.pasteIndex = 0;
            };
            this.document.addEventListener("paste", this.pasteListener);
        }
    }

    private removeListeners() {
        if (this.keyupListener) {
            this.document.removeEventListener("keyup", this.keyupListener);
            this.keyupListener = null;
        }
        if (this.keypressListener) {
            this.document.removeEventListener("keypress", this.keypressListener);
            this.keypressListener = null;
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
        this.reset();
    }

    setMapArrowKeysToFctnSDEXEnabled(enabled: boolean) {
        this.mapArrowKeysToFctnSDEX = enabled;
        this.reset();
    }

    /*
     Column             0	    1	2	3	4	5	6	    7	    A-lock
     R12  addr	Pin #	12	    13	14	15	9	8	J1	    J2	    6
     >0006	3    5/J4	=	    .	,	M	N	/	Fire	Fire
     >0008	4    4/J5	Space	L	K	J	H	;	Left	Left
     >000A	5    1/J9	Enter	O	I	U	Y	P	Right	Right
     >000C	6    2/J8           9	8	7	6	0	Down	Down
     >000E	7    7/J3	Fctn	2	3	4	5	1	Up	    Up	    A-lock
     >0010	8    3	    Shift	S	D	F	G	A
     >0012	9    10	    Ctrl	W	E	R	T	Q
     >0014  10   11             X	C	V	B	Z
     */

    private keyEvent(evt: KeyboardEvent | any, down: boolean) {
        console.log(evt.keyCode, evt.code, evt.key);
        let key: Key;
        if (evt.code) {
            key = Keymapper.keyFromCode(evt.code);
        } else if (evt.keyCode) {
            key = Keymapper.keyFromKeyCode(evt.keyCode);
        }
        if (key) {
            key.tiKeys.forEach((tiKey) => {
                this.columns[tiKey.col][tiKey.row] = down;
            });
            switch (key.code) {
                case 'Tab':
                    if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][3] = down; }
                    break;
                case 'ArrowLeft':
                    if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][4] = down; }
                    if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                        // Left arrow
                        this.columns[0][7] = down; // Fctn
                        this.columns[1][8] = down; // S
                    }
                    break;
                case 'ArrowRight':
                    if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][5] = down; }
                    if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                        // Right arrow
                        this.columns[0][7] = down; // Fctn
                        this.columns[2][8] = down; // D
                    }
                    break;
                case 'ArrowDown':
                    if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][6] = down; }
                    if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                        // Down arrow
                        this.columns[0][7] = down; // Fctn
                        this.columns[1][10] = down; // X
                    }
                    break;
                case 'ArrowUp':  // Up arrow -> J1 Up
                    if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][7] = down; }
                    if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                        // Up arrow
                        this.columns[0][7] = down; // Fctn
                        this.columns[2][9] = down; // E
                    }
                    break;
                case 'CapsLock':
                    if (down) {
                        this.alphaLock = !this.alphaLock;
                    }
                    break;
            }
        }
        if (
            !key || // Unused key
            (this.columns[0][8] && this.columns[0][9] && this.columns[2][5]) || // Ctrl + Shift + I (Developer console)
            (this.columns[0][9] && this.columns[2][10]) ||                      // Ctrl + C (copy)
            (this.columns[0][9] && this.columns[3][10])                         // Ctrl + V (paste)
        ) {
            // Let browser handle unused keys
            return;
        }
        evt.preventDefault();
    }

    // For PC keyboard
    private keyPressEvent(evt: KeyboardEvent | any) {
        let charCode;
        if (evt.which == null) {
            charCode = evt.keyCode; // IE
        } else if (evt.which !== 0 && evt.charCode !== 0) {
            charCode = evt.which;   // the rest
        } else {
            charCode = 0;
        }
        // this.log.info("Char code: " + charCode);
        switch (charCode) {
            case 33: // !
                this.keyPress(5, 7, true, false);
                break;
            case 34: // "
                this.keyPress(5, 5, false, true);
                break;
            case 35: // #
                this.keyPress(2, 7, true, false);
                break;
            case 36: // $
                this.keyPress(3, 7, true, false);
                break;
            case 37: // %
                this.keyPress(4, 7, true, false);
                break;
            case 38: // &
                this.keyPress(3, 6, true, false);
                break;
            case 39: // '
                this.keyPress(1, 5, false, true);
                break;
            case 40: // (
                this.keyPress(1, 6, true, false);
                break;
            case 41: // )
                this.keyPress(5, 6, true, false);
                break;
            case 42: // *
                this.keyPress(2, 6, true, false);
                break;
            case 43: // +
                this.keyPress(0, 3, true, false);
                break;
            case 44: // ,
                this.keyPress(2, 3, false, false);
                break;
            case 45: // -
                this.keyPress(5, 3, true, false);
                break;
            case 46: // .
                this.keyPress(1, 3, false, false);
                break;
            case 47: // /
                this.keyPress(5, 3, false, false);
                break;
            case 48: // 0
                this.keyPress(5, 6, false, false);
                break;
            case 49: // 1
                this.keyPress(5, 7, false, false);
                break;
            case 50: // 2
                this.keyPress(1, 7, false, false);
                break;
            case 51: // 3
                this.keyPress(2, 7, false, false);
                break;
            case 52: // 4
                this.keyPress(3, 7, false, false);
                break;
            case 53: // 5
                this.keyPress(4, 7, false, false);
                break;
            case 54: // 6
                this.keyPress(4, 6, false, false);
                break;
            case 55: // 7
                this.keyPress(3, 6, false, false);
                break;
            case 56: // 8
                this.keyPress(2, 6, false, false);
                break;
            case 57: // 9
                this.keyPress(1, 6, false, false);
                break;
            case 58: // :
                this.keyPress(5, 4, true, false);
                break;
            case 59: // ;
                this.keyPress(5, 4, false, false);
                break;
            case 60: // <
                this.keyPress(2, 3, true, false);
                break;
            case 61: // =
                this.keyPress(0, 3, false, false);
                break;
            case 62: // >
                this.keyPress(1, 3, true, false);
                break;
            case 63: // ?
                this.keyPress(2, 5, false, true);
                break;
            case 64: // @
                this.keyPress(1, 7, true, false);
                break;
            case 65: // A
                this.keyPress(5, 8, true, false);
                break;
            case 66: // B
                this.keyPress(4, 10, true, false);
                break;
            case 67: // C
                this.keyPress(2, 10, true, false);
                break;
            case 68: // D
                this.keyPress(2, 8, true, false);
                break;
            case 69: // E
                this.keyPress(2, 9, true, false);
                break;
            case 70: // F
                this.keyPress(3, 8, true, false);
                break;
            case 71: // G
                this.keyPress(4, 8, true, false);
                break;
            case 72: // H
                this.keyPress(4, 4, true, false);
                break;
            case 73: // I
                this.keyPress(2, 5, true, false);
                break;
            case 74: // J
                this.keyPress(3, 4, true, false);
                break;
            case 75: // K
                this.keyPress(2, 4, true, false);
                break;
            case 76: // L
                this.keyPress(1, 4, true, false);
                break;
            case 77: // M
                this.keyPress(3, 3, true, false);
                break;
            case 78: // N
                this.keyPress(4, 3, true, false);
                break;
            case 79: // O
                this.keyPress(1, 5, true, false);
                break;
            case 80: // P
                this.keyPress(5, 5, true, false);
                break;
            case 81: // Q
                this.keyPress(5, 9, true, false);
                break;
            case 82: // R
                this.keyPress(3, 9, true, false);
                break;
            case 83: // S
                this.keyPress(1, 8, true, false);
                break;
            case 84: // T
                this.keyPress(4, 9, true, false);
                break;
            case 85: // U
                this.keyPress(3, 5, true, false);
                break;
            case 86: // V
                this.keyPress(3, 10, true, false);
                break;
            case 87: // W
                this.keyPress(1, 9, true, false);
                break;
            case 88: // X
                this.keyPress(1, 10, true, false);
                break;
            case 89: // Y
                this.keyPress(4, 5, true, false);
                break;
            case 90: // Z
                this.keyPress(5, 10, true, false);
                break;
            case 91: // [
                this.keyPress(3, 9, false, true);
                break;
            case 92: // \
                this.keyPress(5, 10, false, true);
                break;
            case 93: // ]
                this.keyPress(4, 9, false, true);
                break;
            case 94: // ^
                this.keyPress(4, 6, true, false);
                break;
            case 95: // _
                this.keyPress(3, 5, false, true);
                break;
            case 96: // `
                this.keyPress(2, 10, false, true);
                break;
            case 97: // a
                this.keyPress(5, 8, false, false);
                break;
            case 98: // b
                this.keyPress(4, 10, false, false);
                break;
            case 99: // c
                this.keyPress(2, 10, false, false);
                break;
            case 100: // d
                this.keyPress(2, 8, false, false);
                break;
            case 101: // e
                this.keyPress(2, 9, false, false);
                break;
            case 102: // f
                this.keyPress(3, 8, false, false);
                break;
            case 103: // g
                this.keyPress(4, 8, false, false);
                break;
            case 104: // h
                this.keyPress(4, 4, false, false);
                break;
            case 105: // i
                this.keyPress(2, 5, false, false);
                break;
            case 106: // j
                this.keyPress(3, 4, false, false);
                break;
            case 107: // k
                this.keyPress(2, 4, false, false);
                break;
            case 108: // l
                this.keyPress(1, 4, false, false);
                break;
            case 109: // m
                this.keyPress(3, 3, false, false);
                break;
            case 110: // n
                this.keyPress(4, 3, false, false);
                break;
            case 111: // o
                this.keyPress(1, 5, false, false);
                break;
            case 112: // p
                this.keyPress(5, 5, false, false);
                break;
            case 113: // q
                this.keyPress(5, 9, false, false);
                break;
            case 114: // r
                this.keyPress(3, 9, false, false);
                break;
            case 115: // s
                this.keyPress(1, 8, false, false);
                break;
            case 116: // t
                this.keyPress(4, 9, false, false);
                break;
            case 117: // u
                this.keyPress(3, 5, false, false);
                break;
            case 118: // v
                this.keyPress(3, 10, false, false);
                break;
            case 119: // w
                this.keyPress(1, 9, false, false);
                break;
            case 120: // x
                this.keyPress(1, 10, false, false);
                break;
            case 121: // y
                this.keyPress(4, 5, false, false);
                break;
            case 122: // z
                this.keyPress(5, 10, false, false);
                break;
            case 123: // {
                this.keyPress(3, 8, false, true);
                break;
            case 124: // |
                this.keyPress(5, 8, false, true);
                break;
            case 125: // }
                this.keyPress(4, 8, false, true);
                break;
            case 126: // ~
                this.keyPress(1, 9, false, true);
                break;
            case 127: // DEL
                break;
        }
        let capsLock = null;
        if (charCode >= 65 && charCode <= 90) {
            capsLock = !evt.shiftKey;
        } else if (charCode >= 97 && charCode <= 122) {
            capsLock = evt.shiftKey;
        }
        if (capsLock != null) {
            // this.log.info("Caps Lock " + (capsLock ? "on" : "off"));
            this.alphaLock = (capsLock || this.pcKeyboardEnabled) && !(capsLock && this.pcKeyboardEnabled);
        }
        evt.preventDefault();
    }

    // For PC keyboard
    private keyPress(col: number, addr: number, shift: boolean, fctn: boolean) {
        this.columns[col][addr] = true;
        this.columns[0][7] = fctn;  // Fctn
        this.columns[0][8] = shift; // Shift
        this.columns[0][9] = false; // Ctrl
        if (this.keyCode !== 0)  {
            this.keyMap[this.keyCode] = {col: col, addr: addr, fctn: fctn, shift: shift};
        }
    }

    // For PC keyboard
    private keyEvent2(evt: KeyboardEvent | any, down: boolean) {
        // console.log("Keycode2: " + evt.keyCode);
        this.keyCode = 0;
        switch (evt.keyCode) {
            case 32: // Space
                this.columns[0][4] = down;
                break;
            case 13: // Enter
                this.columns[0][5] = down;
                break;
            case 18: // Alt -> Fctn
                this.columns[0][7] = down;
                break;
            case 16: // Shift
                this.columns[0][8] = down;
                break;
            case 17: // Ctrl
                this.columns[0][9] = down;
                break;
            case 9:  // Tab -> J1 Fire
                this.columns[6][3] = down;
                if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][3] = down; }
                break;
            case 37:  // Left arrow -> J1 Left
                this.columns[6][4] = down;
                if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][4] = down; }
                if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                    // Left arrow
                    this.columns[0][7] = down; // Fctn
                    this.columns[1][8] = down; // S
                }
                break;
            case 39:  // Right arrow -> J1 Right
                this.columns[6][5] = down;
                if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][5] = down; }
                if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                    // Right arrow
                    this.columns[0][7] = down; // Fctn
                    this.columns[2][8] = down; // D
                }
                break;
            case 38:  // Up arrow -> J1 Up
                this.columns[6][7] = down;
                if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][7] = down; }
                if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                    // Up arrow
                    this.columns[0][7] = down; // Fctn
                    this.columns[2][9] = down; // E
                }
                break;
            case 40:  // Down arrow -> J1 Down
                this.columns[6][6] = down;
                if (Keyboard.EMULATE_JOYSTICK_2) { this.columns[7][6] = down; }
                if (this.mapArrowKeysToFctnSDEX && this.joystickActive === 0) {
                    // Down arrow
                    this.columns[0][7] = down; // Fctn
                    this.columns[1][10] = down; // X
                }
                break;
            // Alt+S/D/E/X does not produce a keypress event so we need to handle that here
            case 83: // Fctn+S
                if (this.columns[0][7]) {
                    this.columns[1][8] = down;
                } else {
                    this.doDefault(evt, down);
                    return; // Browser should handle key event
                }
                break;
            case 68: // Fctn+D
                if (this.columns[0][7]) {
                    this.columns[2][8] = down;
                } else {
                    this.doDefault(evt, down);
                    return; // Browser should handle key event
                }
                break;
            case 69: // Fctn+E
                if (this.columns[0][7]) {
                    this.columns[2][9] = down;
                } else {
                    this.doDefault(evt, down);
                    return; // Browser should handle key event
                }
                break;
            case 88: // Fctn+X
                if (this.columns[0][7]) {
                    this.columns[1][10] = down;
                } else {
                    this.doDefault(evt, down);
                    return; // Browser should handle key event
                }
                break;
            case 20:  // Caps lock -> Alpha lock
                if (down) {
                    this.alphaLock = !this.alphaLock;
                } else {
                    this.doDefault(evt, down);
                    return; // Browser should handle key event
                }
                break;
            case 8: // Backspace
                this.columns[0][7] = down; // Fctn
                this.columns[1][8] = down; // S
                break;
            case 46: // Delete
                this.columns[0][7] = down; // Fctn
                this.columns[5][7] = down; // 1
                break;
            case 27: // Escape
                this.columns[0][7] = down; // Fctn
                this.columns[1][6] = down; // 9
                break;
            case 112: // F1
                this.columns[0][7] = down; // Fctn
                this.columns[5][7] = down; // 1
                break;
            case 113: // F2
                this.columns[0][7] = down; // Fctn
                this.columns[1][7] = down; // 2
                break;
            case 114: // F3
                this.columns[0][7] = down; // Fctn
                this.columns[2][7] = down; // 3
                break;
            case 115: // F4
                this.columns[0][7] = down; // Fctn
                this.columns[3][7] = down; // 4
                break;
            case 116: // F5
                this.columns[0][7] = down; // Fctn
                this.columns[4][7] = down; // 5
                break;
            case 117: // F6
                this.columns[0][7] = down; // Fctn
                this.columns[4][6] = down; // 6
                break;
            case 118: // F7
                this.columns[0][7] = down; // Fctn
                this.columns[3][6] = down; // 7
                break;
            case 119: // F8
                this.columns[0][7] = down; // Fctn
                this.columns[2][6] = down; // 8
                break;
            case 120: // F9
                this.columns[0][7] = down; // Fctn
                this.columns[1][6] = down; // 9
                break;
            case 121: // F10
                this.columns[0][7] = down; // Fctn
                this.columns[0][3] = down; // =
                break;
            default:
                this.doDefault(evt, down);
                return; // Browser should handle key event
        }
        // Allow Ctrl + Shift + I (Developer console), Ctrl + C (copy) or Ctrl + V (paste
        if (!(this.columns[0][8] && this.columns[0][9] && this.columns[2][5]) && !(this.columns[0][9] && this.columns[2][10]) && !(this.columns[0][9] && this.columns[3][10])) {
            // Else prevent normal browser handling
            evt.preventDefault();
        }
    }

    private doDefault(evt: KeyboardEvent, down: boolean) {
        if (down) {
            this.keyCode = evt.keyCode;
        } else {
            const key = this.keyMap[evt.keyCode];
            if (key != null) {
                this.columns[key.col][key.addr] = false;
                if (key.shift) {
                    this.columns[0][8] = false;
                }
                if (key.fctn) {
                    this.columns[0][7] = false;
                }
            }
            this.keyCode = 0;
        }
    }

    isKeyDown(col: number, addr: number): boolean {
        // This is necessary in order for the Joystick in Donkey Kong to work
        if (col === 6 || col === 7) {
            this.joystickActive = 250;
        } else if (this.joystickActive > 0) {
            this.joystickActive--;
        }
        //
        return this.columns[col][addr];
    }

    isAlphaLockDown(): boolean {
        // this.log.info("Alpha Lock " + this.alphaLock);
        return this.alphaLock;
    }

    simulateKeyPresses(keyString: string, callback: () => void) {
        if (keyString.length > 0) {
            const pause = keyString.charAt(0) === "§";
            const that = this;
            if (!pause) {
                const charCode = keyString.charCodeAt(0);
                this.simulateKeyPress(charCode > 96 ? charCode - 32 : charCode, () => {
                    window.setTimeout(() => {
                        that.simulateKeyPresses(keyString.substr(1), callback);
                    }, Keyboard.KEYPRESS_DURATION);
                });
            } else {
                window.setTimeout(() => {
                    that.simulateKeyPresses(keyString.substr(1), callback);
                }, 1000);
            }
        } else if (callback) {
            callback();
        }
    }

    simulateKeyPress(keyCode: number, callback: () => void) {
        // this.log.info(keyCode);
        this.simulateKeyDown(keyCode);
        const that = this;
        window.setTimeout(() => {
            that.simulateKeyUp(keyCode);
            if (callback) { callback(); }
        }, Keyboard.KEYPRESS_DURATION);
    }

    // Keypress from the virtual keyboard
    virtualKeyPress(keyCode: number) {
        this.virtualKeyDown(keyCode);
        if (keyCode !== 16 && keyCode !== 17 && keyCode !== 18) {
            const that = this;
            window.setTimeout(() => {
                that.virtualKeyUp(keyCode);
            }, Keyboard.KEYPRESS_DURATION);
        }
    }

    private virtualKeyDown(keyCode: number) {
        this.simulateKeyDown(keyCode);
        const that = this;
        if (keyCode !== 16) {
            window.setTimeout(() => { that.simulateKeyUp(16); }, Keyboard.KEYPRESS_DURATION);
        }
        if (keyCode !== 17) {
            window.setTimeout(() => { that.simulateKeyUp(17); }, Keyboard.KEYPRESS_DURATION);
        }
        if (keyCode !== 18) {
            window.setTimeout(() => { that.simulateKeyUp(18); }, Keyboard.KEYPRESS_DURATION);
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

    private simulateKeyDown2(keyCode: number) {
        this.keyEvent2({keyCode: keyCode, preventDefault() {}}, true);
        this.keyPressEvent({keyCode: keyCode, preventDefault() {}});
    }

    private simulateKeyUp2(keyCode: number) {
        this.keyEvent2({keyCode: keyCode, preventDefault() {}}, false);
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

    getState(): object {
        return {
            pcKeyboardEnabled: this.pcKeyboardEnabled,
            mapArrowKeysToFctnSDEX: this.mapArrowKeysToFctnSDEX,
            columns: this.columns,
            joystickActive: this.joystickActive,
            keyCode: this.keyCode,
            keyMap: this.keyMap,
            alphaLock: this.alphaLock,
            pasteBuffer: this.pasteBuffer,
            pasteIndex: this.pasteIndex,
            joystick1: this.joystick1.getState(),
            joystick2: this.joystick2.getState()
        };
    }

    restoreState(state) {
        this.pcKeyboardEnabled = state.pcKeyboardEnabled;
        this.mapArrowKeysToFctnSDEX = state.mapArrowKeysToFctnSDEX;
        this.columns = state.columns;
        this.joystickActive = state.joystickActive;
        this.keyCode = state.keyCode;
        this.keyMap = state.keyMap;
        this.alphaLock = state.alphaLock;
        this.pasteBuffer = state.pasteBuffer;
        this.pasteIndex = state.pasteIndex;
        this.joystick1.restoreState(state.joystick1);
        this.joystick2.restoreState(state.joystick2);
    }
}
