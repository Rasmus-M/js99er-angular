export interface Key {
    code?: string;
    key?: string;
    keyCode?: number;
    charCode?: number;
    tiKeys: (TIKey | {col: number, row: number})[];
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

export class TIKey {

    static Equal =      new TIKey(0, 3);
    static Space =      new TIKey(0, 4);
    static Enter =      new TIKey(0, 5);
    static Fctn =       new TIKey(0, 7);
    static Shift =      new TIKey(0, 8);
    static Ctrl =       new TIKey(0, 9);
    static Period =     new TIKey(1, 3);
    static KeyL =       new TIKey(1, 4);
    static KeyO =       new TIKey(1, 5);
    static Digit9 =     new TIKey(1, 6);
    static Digit2 =     new TIKey(1, 7);
    static KeyS =       new TIKey(1, 8);
    static KeyW =       new TIKey(1, 9);
    static KeyX =       new TIKey(1, 10);
    static Comma =      new TIKey(2, 3);
    static KeyK =       new TIKey(2, 4);
    static KeyI =       new TIKey(2, 5);
    static Digit8 =     new TIKey(2, 6);
    static Digit3 =     new TIKey(2, 7);
    static KeyD =       new TIKey(2, 8);
    static KeyE =       new TIKey(2, 9);
    static KeyC =       new TIKey(2, 10);
    static KeyM =       new TIKey(3, 3);
    static KeyJ =       new TIKey(3, 4);
    static KeyU =       new TIKey(3, 5);
    static Digit7 =     new TIKey(3, 6);
    static Digit4 =     new TIKey(3, 7);
    static KeyF =       new TIKey(3, 8);
    static KeyR =       new TIKey(3, 9);
    static KeyV =       new TIKey(3, 10);
    static KeyN =       new TIKey(4, 3);
    static KeyH =       new TIKey(4, 4);
    static KeyY =       new TIKey(4, 5);
    static Digit6 =     new TIKey(4, 6);
    static Digit5 =     new TIKey(4, 7);
    static KeyG =       new TIKey(4, 8);
    static KeyT =       new TIKey(4, 9);
    static KeyB =       new TIKey(4, 10);
    static Slash =      new TIKey(5, 3);
    static Semicolon =  new TIKey(5, 4);
    static KeyP =       new TIKey(5, 5);
    static Digit0 =     new TIKey(5, 6);
    static Digit1 =     new TIKey(5, 7);
    static KeyA =       new TIKey(5, 8);
    static KeyQ =       new TIKey(5, 9);
    static KeyZ =       new TIKey(5, 10);
    static J1Fire =     new TIKey(6, 3);
    static J1Left =     new TIKey(6, 4);
    static J1Right =    new TIKey(6, 5);
    static J1Down =     new TIKey(6, 6);
    static J1Up =       new TIKey(6, 7);
    static J2Fire =     new TIKey(7, 3);
    static J2Left =     new TIKey(7, 4);
    static J2Right =    new TIKey(7, 5);
    static J2Down =     new TIKey(7, 6);
    static J2Up =       new TIKey(7, 7);

    row: number;
    col: number;

    constructor(col: number, row: number) {
        this.row = row;
        this.col = col;
    }
}

export class KeyMapper {

    private static tiKeysByCode: Key[] = [
        {code: "Digit0", keyCode: 48, tiKeys: [TIKey.Digit0]},
        {code: "Digit1", keyCode: 49, tiKeys: [TIKey.Digit1]},
        {code: "Digit2", keyCode: 50, tiKeys: [TIKey.Digit2]},
        {code: "Digit3", keyCode: 51, tiKeys: [TIKey.Digit3]},
        {code: "Digit4", keyCode: 52, tiKeys: [TIKey.Digit4]},
        {code: "Digit5", keyCode: 53, tiKeys: [TIKey.Digit5]},
        {code: "Digit6", keyCode: 54, tiKeys: [TIKey.Digit6]},
        {code: "Digit7", keyCode: 55, tiKeys: [TIKey.Digit7]},
        {code: "Digit8", keyCode: 56, tiKeys: [TIKey.Digit8]},
        {code: "Digit9", keyCode: 57, tiKeys: [TIKey.Digit9]},
        {code: "KeyA", keyCode: 65, tiKeys: [TIKey.KeyA]},
        {code: "KeyB", keyCode: 66, tiKeys: [TIKey.KeyB]},
        {code: "KeyC", keyCode: 67, tiKeys: [TIKey.KeyC]},
        {code: "KeyD", keyCode: 68, tiKeys: [TIKey.KeyD]},
        {code: "KeyE", keyCode: 69, tiKeys: [TIKey.KeyE]},
        {code: "KeyF", keyCode: 70, tiKeys: [TIKey.KeyF]},
        {code: "KeyG", keyCode: 71, tiKeys: [TIKey.KeyG]},
        {code: "KeyH", keyCode: 72, tiKeys: [TIKey.KeyH]},
        {code: "KeyI", keyCode: 73, tiKeys: [TIKey.KeyI]},
        {code: "KeyJ", keyCode: 74, tiKeys: [TIKey.KeyJ]},
        {code: "KeyK", keyCode: 75, tiKeys: [TIKey.KeyK]},
        {code: "KeyL", keyCode: 76, tiKeys: [TIKey.KeyL]},
        {code: "KeyM", keyCode: 77, tiKeys: [TIKey.KeyM]},
        {code: "KeyN", keyCode: 78, tiKeys: [TIKey.KeyN]},
        {code: "KeyO", keyCode: 79, tiKeys: [TIKey.KeyO]},
        {code: "KeyP", keyCode: 80, tiKeys: [TIKey.KeyP]},
        {code: "KeyQ", keyCode: 81, tiKeys: [TIKey.KeyQ]},
        {code: "KeyR", keyCode: 82, tiKeys: [TIKey.KeyR]},
        {code: "KeyS", keyCode: 83, tiKeys: [TIKey.KeyS]},
        {code: "KeyT", keyCode: 84, tiKeys: [TIKey.KeyT]},
        {code: "KeyU", keyCode: 85, tiKeys: [TIKey.KeyU]},
        {code: "KeyV", keyCode: 86, tiKeys: [TIKey.KeyV]},
        {code: "KeyW", keyCode: 87, tiKeys: [TIKey.KeyW]},
        {code: "KeyX", keyCode: 88, tiKeys: [TIKey.KeyX]},
        {code: "KeyY", keyCode: 89, tiKeys: [TIKey.KeyY]},
        {code: "KeyZ", keyCode: 90, tiKeys: [TIKey.KeyZ]},
        {code: "Equal", keyCode: 187, tiKeys: [TIKey.Equal]},
        {code: "Minus", keyCode: 187, tiKeys: [TIKey.Shift, TIKey.Slash]},
        {code: "Period", keyCode: 190, tiKeys: [TIKey.Period]},
        {code: "Comma", keyCode: 188, tiKeys: [TIKey.Comma]},
        {code: "Quote", keyCode: 222, tiKeys: [TIKey.Fctn, TIKey.KeyP]},
        {code: "Slash", keyCode: 189, tiKeys: [TIKey.Slash]},
        {code: "Semicolon", keyCode: 192, tiKeys: [TIKey.Semicolon]},
        {code: "BracketLeft", keyCode: 219, tiKeys: [TIKey.Fctn, TIKey.KeyR]},
        {code: "BracketRight", keyCode: 221, tiKeys: [TIKey.Fctn, TIKey.KeyT]},
        {code: "Backslash", keyCode: 191, tiKeys: [TIKey.Fctn, TIKey.KeyZ]},
        {code: "Space", keyCode: 32, tiKeys: [TIKey.Space]},
        {code: "Enter", keyCode: 13, tiKeys: [TIKey.Enter]},
        {code: "Tab", keyCode: 9, tiKeys: [TIKey.J1Fire]},
        {code: "AltLeft", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {code: "AltRight", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {code: "ControlLeft", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {code: "ControlRight", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {code: "ShiftLeft", keyCode: 16, tiKeys: [TIKey.Shift]},
        {code: "ShiftRight", keyCode: 16, tiKeys: [TIKey.Shift]},
        {code: "ArrowDown", keyCode: 40, tiKeys: [TIKey.J1Down]},
        {code: "ArrowLeft", keyCode: 37, tiKeys: [TIKey.J1Left]},
        {code: "ArrowRight", keyCode: 39, tiKeys: [TIKey.J1Right]},
        {code: "ArrowUp", keyCode: 38, tiKeys: [TIKey.J1Up]},
        {code: "Escape", keyCode: 27, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        {code: "Backspace", keyCode: 8, tiKeys: [TIKey.Fctn, TIKey.KeyS]},
        {code: "Delete", keyCode: 46, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        {code: "Insert", keyCode: 45, tiKeys: [TIKey.Fctn, TIKey.Digit2]},
        {code: "CapsLock", keyCode: 20, tiKeys: []}
    ];

    private static tiKeysByKey: Key[] = [
        {key: " ", charCode: 32, tiKeys: [TIKey.Space]},
        {key: "!", charCode: 33, tiKeys: [TIKey.Shift, TIKey.Digit1]},
        {key: "\"", charCode: 34, tiKeys: [TIKey.Fctn, TIKey.KeyP]},
        {key: "#", charCode: 35, tiKeys: [TIKey.Shift, TIKey.Digit3]},
        {key: "$", charCode: 36, tiKeys: [TIKey.Shift, TIKey.Digit4]},
        {key: "%", charCode: 37, tiKeys: [TIKey.Shift, TIKey.Digit5]},
        {key: "&", charCode: 38, tiKeys: [TIKey.Shift, TIKey.Digit7]},
        {key: "'", charCode: 39, tiKeys: [TIKey.Fctn, TIKey.KeyO]},
        {key: "(", charCode: 40, tiKeys: [TIKey.Shift, TIKey.Digit9]},
        {key: ")", charCode: 41, tiKeys: [TIKey.Shift, TIKey.Digit0]},
        {key: "*", charCode: 42, tiKeys: [TIKey.Shift, TIKey.Digit8]},
        {key: "+", charCode: 43, tiKeys: [TIKey.Shift, TIKey.Equal]},
        {key: ",", charCode: 44, tiKeys: [TIKey.Comma]},
        {key: "-", charCode: 45, tiKeys: [TIKey.Shift, TIKey.Slash]},
        {key: ".", charCode: 46, tiKeys: [TIKey.Period]},
        {key: "/", charCode: 47, tiKeys: [TIKey.Slash]},
        {key: "0", charCode: 48, tiKeys: [TIKey.Digit0]},
        {key: "1", charCode: 49, tiKeys: [TIKey.Digit1]},
        {key: "2", charCode: 50, tiKeys: [TIKey.Digit2]},
        {key: "3", charCode: 51, tiKeys: [TIKey.Digit3]},
        {key: "4", charCode: 52, tiKeys: [TIKey.Digit4]},
        {key: "5", charCode: 53, tiKeys: [TIKey.Digit5]},
        {key: "6", charCode: 54, tiKeys: [TIKey.Digit6]},
        {key: "7", charCode: 55, tiKeys: [TIKey.Digit7]},
        {key: "8", charCode: 56, tiKeys: [TIKey.Digit8]},
        {key: "9", charCode: 57, tiKeys: [TIKey.Digit9]},
        {key: ":", charCode: 58, tiKeys: [TIKey.Shift, TIKey.Semicolon]},
        {key: ";", charCode: 59, tiKeys: [TIKey.Semicolon]},
        {key: "<", charCode: 60, tiKeys: [TIKey.Shift, TIKey.Comma]},
        {key: "=", charCode: 61, tiKeys: [TIKey.Equal]},
        {key: ">", charCode: 62, tiKeys: [TIKey.Shift, TIKey.Period]},
        {key: "?", charCode: 63, tiKeys: [TIKey.Fctn, TIKey.KeyI]},
        {key: "@", charCode: 64, tiKeys: [TIKey.Shift, TIKey.Digit2]},
        {key: "A", charCode: 65, tiKeys: [TIKey.Shift, TIKey.KeyA]},
        {key: "B", charCode: 66, tiKeys: [TIKey.Shift, TIKey.KeyB]},
        {key: "C", charCode: 67, tiKeys: [TIKey.Shift, TIKey.KeyC]},
        {key: "D", charCode: 68, tiKeys: [TIKey.Shift, TIKey.KeyD]},
        {key: "E", charCode: 69, tiKeys: [TIKey.Shift, TIKey.KeyE]},
        {key: "F", charCode: 70, tiKeys: [TIKey.Shift, TIKey.KeyF]},
        {key: "G", charCode: 71, tiKeys: [TIKey.Shift, TIKey.KeyG]},
        {key: "H", charCode: 72, tiKeys: [TIKey.Shift, TIKey.KeyH]},
        {key: "I", charCode: 73, tiKeys: [TIKey.Shift, TIKey.KeyI]},
        {key: "J", charCode: 74, tiKeys: [TIKey.Shift, TIKey.KeyJ]},
        {key: "K", charCode: 75, tiKeys: [TIKey.Shift, TIKey.KeyK]},
        {key: "L", charCode: 76, tiKeys: [TIKey.Shift, TIKey.KeyL]},
        {key: "M", charCode: 77, tiKeys: [TIKey.Shift, TIKey.KeyM]},
        {key: "N", charCode: 78, tiKeys: [TIKey.Shift, TIKey.KeyN]},
        {key: "O", charCode: 79, tiKeys: [TIKey.Shift, TIKey.KeyO]},
        {key: "P", charCode: 80, tiKeys: [TIKey.Shift, TIKey.KeyP]},
        {key: "Q", charCode: 81, tiKeys: [TIKey.Shift, TIKey.KeyQ]},
        {key: "R", charCode: 82, tiKeys: [TIKey.Shift, TIKey.KeyR]},
        {key: "S", charCode: 83, tiKeys: [TIKey.Shift, TIKey.KeyS]},
        {key: "T", charCode: 84, tiKeys: [TIKey.Shift, TIKey.KeyT]},
        {key: "U", charCode: 85, tiKeys: [TIKey.Shift, TIKey.KeyU]},
        {key: "V", charCode: 86, tiKeys: [TIKey.Shift, TIKey.KeyV]},
        {key: "W", charCode: 87, tiKeys: [TIKey.Shift, TIKey.KeyW]},
        {key: "X", charCode: 88, tiKeys: [TIKey.Shift, TIKey.KeyX]},
        {key: "Y", charCode: 89, tiKeys: [TIKey.Shift, TIKey.KeyY]},
        {key: "Z", charCode: 90, tiKeys: [TIKey.Shift, TIKey.KeyZ]},
        {key: "[", charCode: 91, tiKeys: [TIKey.Fctn, TIKey.KeyR]},
        {key: "\\", charCode: 92, tiKeys: [TIKey.Fctn, TIKey.KeyZ]},
        {key: "]", charCode: 93, tiKeys: [TIKey.Fctn, TIKey.KeyT]},
        {key: "^", charCode: 94, tiKeys: [TIKey.Shift, TIKey.Digit6]},
        {key: "_", charCode: 95, tiKeys: [TIKey.Fctn, TIKey.KeyU]},
        {key: "`", charCode: 96, tiKeys: [TIKey.Fctn, TIKey.KeyC]},
        {key: "a", charCode: 97, tiKeys: [TIKey.KeyA]},
        {key: "b", charCode: 98, tiKeys: [TIKey.KeyB]},
        {key: "c", charCode: 99, tiKeys: [TIKey.KeyC]},
        {key: "d", charCode: 100, tiKeys: [TIKey.KeyD]},
        {key: "e", charCode: 101, tiKeys: [TIKey.KeyE]},
        {key: "f", charCode: 102, tiKeys: [TIKey.KeyF]},
        {key: "g", charCode: 103, tiKeys: [TIKey.KeyG]},
        {key: "h", charCode: 104, tiKeys: [TIKey.KeyH]},
        {key: "i", charCode: 105, tiKeys: [TIKey.KeyI]},
        {key: "j", charCode: 106, tiKeys: [TIKey.KeyJ]},
        {key: "k", charCode: 107, tiKeys: [TIKey.KeyK]},
        {key: "l", charCode: 108, tiKeys: [TIKey.KeyL]},
        {key: "m", charCode: 109, tiKeys: [TIKey.KeyM]},
        {key: "n", charCode: 110, tiKeys: [TIKey.KeyN]},
        {key: "o", charCode: 111, tiKeys: [TIKey.KeyO]},
        {key: "p", charCode: 112, tiKeys: [TIKey.KeyP]},
        {key: "q", charCode: 113, tiKeys: [TIKey.KeyQ]},
        {key: "r", charCode: 114, tiKeys: [TIKey.KeyR]},
        {key: "s", charCode: 115, tiKeys: [TIKey.KeyS]},
        {key: "t", charCode: 116, tiKeys: [TIKey.KeyT]},
        {key: "u", charCode: 117, tiKeys: [TIKey.KeyU]},
        {key: "v", charCode: 118, tiKeys: [TIKey.KeyV]},
        {key: "w", charCode: 119, tiKeys: [TIKey.KeyW]},
        {key: "x", charCode: 120, tiKeys: [TIKey.KeyX]},
        {key: "y", charCode: 121, tiKeys: [TIKey.KeyY]},
        {key: "z", charCode: 122, tiKeys: [TIKey.KeyZ]},
        {key: "{", charCode: 123, tiKeys: [TIKey.Fctn, TIKey.KeyF]},
        {key: "|", charCode: 124, tiKeys: [TIKey.Fctn, TIKey.KeyA]},
        {key: "}", charCode: 125, tiKeys: [TIKey.Fctn, TIKey.KeyG]},
        {key: "~", charCode: 126, tiKeys: [TIKey.Fctn, TIKey.KeyW]},
        {key: "Enter", keyCode: 13, tiKeys: [TIKey.Enter]},
        {key: "Alt", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {key: "Shift", keyCode: 16, tiKeys: [TIKey.Shift]},
        {key: "Control", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {key: "Tab", keyCode: 9, tiKeys: [TIKey.J1Fire]},
        {key: "Backspace", keyCode: 8, tiKeys: [TIKey.Fctn, TIKey.KeyS]},
        {key: "Delete", keyCode: 46, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        {key: "Escape", keyCode: 27, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        {key: "ArrowDown", keyCode: 40, tiKeys: [TIKey.J1Down]},
        {key: "ArrowLeft", keyCode: 37, tiKeys: [TIKey.J1Left]},
        {key: "ArrowRight", keyCode: 39, tiKeys: [TIKey.J1Right]},
        {key: "ArrowUp", keyCode: 38, tiKeys: [TIKey.J1Up]},
        {key: "F1", keyCode: 112, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        {key: "F2", keyCode: 113, tiKeys: [TIKey.Fctn, TIKey.Digit2]},
        {key: "F3", keyCode: 114, tiKeys: [TIKey.Fctn, TIKey.Digit3]},
        {key: "F4", keyCode: 115, tiKeys: [TIKey.Fctn, TIKey.Digit4]},
        {key: "F5", keyCode: 116, tiKeys: [TIKey.Fctn, TIKey.Digit5]},
        {key: "F6", keyCode: 117, tiKeys: [TIKey.Fctn, TIKey.Digit6]},
        {key: "F7", keyCode: 118, tiKeys: [TIKey.Fctn, TIKey.Digit7]},
        {key: "F8", keyCode: 119, tiKeys: [TIKey.Fctn, TIKey.Digit8]},
        {key: "F9", keyCode: 120, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        {key: "F10", keyCode: 21, tiKeys: [TIKey.Fctn, TIKey.Digit0]},
        {key: "CapsLock", keyCode: 20, tiKeys: []}
    ];

    public static getKeyFromCode(code: string): Key {
        return KeyMapper.tiKeysByCode.find(k => k.code === code);
    }

    public static getKeyFromKeyCode(keyCode: number): Key {
        return KeyMapper.tiKeysByCode.find(k => k.keyCode === keyCode);
    }

    public static getKeyFromKey(key: string): Key {
        return KeyMapper.tiKeysByKey.find(k => k.key === key);
    }

    public static getKeyFromCharCode(charCode: number): Key {
        return KeyMapper.tiKeysByKey.find(k => k.charCode === charCode);
    }
}

