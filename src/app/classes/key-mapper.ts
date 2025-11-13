export interface Key {
    code?: string;
    key?: string;
    keyCode?: number;
    charCode?: number;
    tiKeys: TIKey[];
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

    static Equal =      new TIKey(0, 3, false);
    static Space =      new TIKey(0, 4, false);
    static Enter =      new TIKey(0, 5, false);
    static Fctn =       new TIKey(0, 7, true);
    static Shift =      new TIKey(0, 8, true);
    static Ctrl =       new TIKey(0, 9, true);
    static Period =     new TIKey(1, 3, false);
    static KeyL =       new TIKey(1, 4, false);
    static KeyO =       new TIKey(1, 5, false);
    static Digit9 =     new TIKey(1, 6, false);
    static Digit2 =     new TIKey(1, 7, false);
    static KeyS =       new TIKey(1, 8, false);
    static KeyW =       new TIKey(1, 9, false);
    static KeyX =       new TIKey(1, 10, false);
    static Comma =      new TIKey(2, 3, false);
    static KeyK =       new TIKey(2, 4, false);
    static KeyI =       new TIKey(2, 5, false);
    static Digit8 =     new TIKey(2, 6, false);
    static Digit3 =     new TIKey(2, 7, false);
    static KeyD =       new TIKey(2, 8, false);
    static KeyE =       new TIKey(2, 9, false);
    static KeyC =       new TIKey(2, 10, false);
    static KeyM =       new TIKey(3, 3, false);
    static KeyJ =       new TIKey(3, 4, false);
    static KeyU =       new TIKey(3, 5, false);
    static Digit7 =     new TIKey(3, 6, false);
    static Digit4 =     new TIKey(3, 7, false);
    static KeyF =       new TIKey(3, 8, false);
    static KeyR =       new TIKey(3, 9, false);
    static KeyV =       new TIKey(3, 10, false);
    static KeyN =       new TIKey(4, 3, false);
    static KeyH =       new TIKey(4, 4, false);
    static KeyY =       new TIKey(4, 5, false);
    static Digit6 =     new TIKey(4, 6, false);
    static Digit5 =     new TIKey(4, 7, false);
    static KeyG =       new TIKey(4, 8, false);
    static KeyT =       new TIKey(4, 9, false);
    static KeyB =       new TIKey(4, 10, false);
    static Slash =      new TIKey(5, 3, false);
    static Semicolon =  new TIKey(5, 4, false);
    static KeyP =       new TIKey(5, 5, false);
    static Digit0 =     new TIKey(5, 6, false);
    static Digit1 =     new TIKey(5, 7, false);
    static KeyA =       new TIKey(5, 8, false);
    static KeyQ =       new TIKey(5, 9, false);
    static KeyZ =       new TIKey(5, 10, false);
    static J1Fire =     new TIKey(6, 3, true);
    static J1Left =     new TIKey(6, 4, true);
    static J1Right =    new TIKey(6, 5, true);
    static J1Down =     new TIKey(6, 6, true);
    static J1Up =       new TIKey(6, 7, true);
    static J2Fire =     new TIKey(7, 3, true);
    static J2Left =     new TIKey(7, 4, true);
    static J2Right =    new TIKey(7, 5, true);
    static J2Down =     new TIKey(7, 6, true);
    static J2Up =       new TIKey(7, 7, true);

    row: number;
    col: number;
    sticky: boolean;

    constructor(col: number, row: number, sticky: boolean) {
        this.row = row;
        this.col = col;
        this.sticky = sticky;
    }

    isSticky(): boolean {
        return this.sticky;
    }
}

export class KeyMapper {

    private static tiKeysByCode: {[key: string]: Key} = {
        "Digit0": {code: "Digit0", keyCode: 48, tiKeys: [TIKey.Digit0]},
        "Digit1": {code: "Digit1", keyCode: 49, tiKeys: [TIKey.Digit1]},
        "Digit2": {code: "Digit2", keyCode: 50, tiKeys: [TIKey.Digit2]},
        "Digit3": {code: "Digit3", keyCode: 51, tiKeys: [TIKey.Digit3]},
        "Digit4": {code: "Digit4", keyCode: 52, tiKeys: [TIKey.Digit4]},
        "Digit5": {code: "Digit5", keyCode: 53, tiKeys: [TIKey.Digit5]},
        "Digit6": {code: "Digit6", keyCode: 54, tiKeys: [TIKey.Digit6]},
        "Digit7": {code: "Digit7", keyCode: 55, tiKeys: [TIKey.Digit7]},
        "Digit8": {code: "Digit8", keyCode: 56, tiKeys: [TIKey.Digit8]},
        "Digit9": {code: "Digit9", keyCode: 57, tiKeys: [TIKey.Digit9]},
        "KeyA": {code: "KeyA", keyCode: 65, tiKeys: [TIKey.KeyA]},
        "KeyB": {code: "KeyB", keyCode: 66, tiKeys: [TIKey.KeyB]},
        "KeyC": {code: "KeyC", keyCode: 67, tiKeys: [TIKey.KeyC]},
        "KeyD": {code: "KeyD", keyCode: 68, tiKeys: [TIKey.KeyD]},
        "KeyE": {code: "KeyE", keyCode: 69, tiKeys: [TIKey.KeyE]},
        "KeyF": {code: "KeyF", keyCode: 70, tiKeys: [TIKey.KeyF]},
        "KeyG": {code: "KeyG", keyCode: 71, tiKeys: [TIKey.KeyG]},
        "KeyH": {code: "KeyH", keyCode: 72, tiKeys: [TIKey.KeyH]},
        "KeyI": {code: "KeyI", keyCode: 73, tiKeys: [TIKey.KeyI]},
        "KeyJ": {code: "KeyJ", keyCode: 74, tiKeys: [TIKey.KeyJ]},
        "KeyK": {code: "KeyK", keyCode: 75, tiKeys: [TIKey.KeyK]},
        "KeyL": {code: "KeyL", keyCode: 76, tiKeys: [TIKey.KeyL]},
        "KeyM": {code: "KeyM", keyCode: 77, tiKeys: [TIKey.KeyM]},
        "KeyN": {code: "KeyN", keyCode: 78, tiKeys: [TIKey.KeyN]},
        "KeyO": {code: "KeyO", keyCode: 79, tiKeys: [TIKey.KeyO]},
        "KeyP": {code: "KeyP", keyCode: 80, tiKeys: [TIKey.KeyP]},
        "KeyQ": {code: "KeyQ", keyCode: 81, tiKeys: [TIKey.KeyQ]},
        "KeyR": {code: "KeyR", keyCode: 82, tiKeys: [TIKey.KeyR]},
        "KeyS": {code: "KeyS", keyCode: 83, tiKeys: [TIKey.KeyS]},
        "KeyT": {code: "KeyT", keyCode: 84, tiKeys: [TIKey.KeyT]},
        "KeyU": {code: "KeyU", keyCode: 85, tiKeys: [TIKey.KeyU]},
        "KeyV": {code: "KeyV", keyCode: 86, tiKeys: [TIKey.KeyV]},
        "KeyW": {code: "KeyW", keyCode: 87, tiKeys: [TIKey.KeyW]},
        "KeyX": {code: "KeyX", keyCode: 88, tiKeys: [TIKey.KeyX]},
        "KeyY": {code: "KeyY", keyCode: 89, tiKeys: [TIKey.KeyY]},
        "KeyZ": {code: "KeyZ", keyCode: 90, tiKeys: [TIKey.KeyZ]},
        "Equal": {code: "Equal", keyCode: 187, tiKeys: [TIKey.Equal]},
        "Minus": {code: "Minus", keyCode: 187, tiKeys: [TIKey.Shift, TIKey.Slash]},
        "Period": {code: "Period", keyCode: 190, tiKeys: [TIKey.Period]},
        "Comma": {code: "Comma", keyCode: 188, tiKeys: [TIKey.Comma]},
        "Quote": {code: "Quote", keyCode: 222, tiKeys: [TIKey.Fctn, TIKey.KeyP]},
        "Slash": {code: "Slash", keyCode: 189, tiKeys: [TIKey.Slash]},
        "Semicolon": {code: "Semicolon", keyCode: 186, tiKeys: [TIKey.Semicolon]},
        "BracketLeft": {code: "BracketLeft", keyCode: 219, tiKeys: [TIKey.Fctn, TIKey.KeyR]},
        "BracketRight": {code: "BracketRight", keyCode: 221, tiKeys: [TIKey.Fctn, TIKey.KeyT]},
        "Backslash": {code: "Backslash", keyCode: 191, tiKeys: [TIKey.Fctn, TIKey.KeyZ]},
        "Space": {code: "Space", keyCode: 32, tiKeys: [TIKey.Space]},
        "Enter": {code: "Enter", keyCode: 13, tiKeys: [TIKey.Enter]},
        "Tab": {code: "Tab", keyCode: 9, tiKeys: [TIKey.J1Fire]},
        "Backquote": {code: "Backquote", keyCode: 220, tiKeys: [TIKey.J2Fire]},
        "AltLeft": {code: "AltLeft", keyCode: 18, tiKeys: [TIKey.Fctn]},
        "AltRight": {code: "AltRight", keyCode: 18, tiKeys: [TIKey.Fctn]},
        "ControlLeft": {code: "ControlLeft", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        "ControlRight": {code: "ControlRight", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        "ShiftLeft": {code: "ShiftLeft", keyCode: 16, tiKeys: [TIKey.Shift]},
        "ShiftRight": {code: "ShiftRight", keyCode: 16, tiKeys: [TIKey.Shift]},
        "ArrowDown": {code: "ArrowDown", keyCode: 40, tiKeys: [TIKey.J1Down]},
        "ArrowLeft": {code: "ArrowLeft", keyCode: 37, tiKeys: [TIKey.J1Left]},
        "ArrowRight": {code: "ArrowRight", keyCode: 39, tiKeys: [TIKey.J1Right]},
        "ArrowUp": {code: "ArrowUp", keyCode: 38, tiKeys: [TIKey.J1Up]},
        "Numpad2": {code: "Numpad2", keyCode: 98, tiKeys: [TIKey.J2Down]},
        "Numpad4": {code: "Numpad4", keyCode: 100, tiKeys: [TIKey.J2Left]},
        "Numpad6": {code: "Numpad6", keyCode: 102, tiKeys: [TIKey.J2Right]},
        "Numpad8": {code: "Numpad8", keyCode: 104, tiKeys: [TIKey.J2Up]},
        "Escape": {code: "Escape", keyCode: 27, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        "Backspace": {code: "Backspace", keyCode: 8, tiKeys: [TIKey.Fctn, TIKey.KeyS]},
        "Delete": {code: "Delete", keyCode: 46, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        "Insert": {code: "Insert", keyCode: 45, tiKeys: [TIKey.Fctn, TIKey.Digit2]},
        "CapsLock": {code: "CapsLock", keyCode: 20, tiKeys: []}
    };

    private static tiKeysByKey: {[key: string]: Key} = {
        " ": {key: " " , charCode: 32, tiKeys: [TIKey.Space]},
        "!": {key: "!" , charCode: 33, tiKeys: [TIKey.Shift, TIKey.Digit1]},
        "\"": {key: "\"", charCode: 34, tiKeys: [TIKey.Fctn, TIKey.KeyP]},
        "#": {key: "#" , charCode: 35, tiKeys: [TIKey.Shift, TIKey.Digit3]},
        "$": {key: "$" , charCode: 36, tiKeys: [TIKey.Shift, TIKey.Digit4]},
        "%": {key: "%" , charCode: 37, tiKeys: [TIKey.Shift, TIKey.Digit5]},
        "&": {key: "&" , charCode: 38, tiKeys: [TIKey.Shift, TIKey.Digit7]},
        "'": {key: "'" , charCode: 39, tiKeys: [TIKey.Fctn, TIKey.KeyO]},
        "(": {key: "(" , charCode: 40, tiKeys: [TIKey.Shift, TIKey.Digit9]},
        ")": {key: ")" , charCode: 41, tiKeys: [TIKey.Shift, TIKey.Digit0]},
        "*": {key: "*" , charCode: 42, tiKeys: [TIKey.Shift, TIKey.Digit8]},
        "+": {key: "+" , charCode: 43, tiKeys: [TIKey.Shift, TIKey.Equal]},
        ",": {key: "," , charCode: 44, tiKeys: [TIKey.Comma]},
        "-": {key: "-" , charCode: 45, tiKeys: [TIKey.Shift, TIKey.Slash]},
        ".": {key: "." , charCode: 46, tiKeys: [TIKey.Period]},
        "/": {key: "/" , charCode: 47, tiKeys: [TIKey.Slash]},
        "0": {key: "0" , charCode: 48, tiKeys: [TIKey.Digit0]},
        "1": {key: "1" , charCode: 49, tiKeys: [TIKey.Digit1]},
        "2": {key: "2" , charCode: 50, tiKeys: [TIKey.Digit2]},
        "3": {key: "3" , charCode: 51, tiKeys: [TIKey.Digit3]},
        "4": {key: "4" , charCode: 52, tiKeys: [TIKey.Digit4]},
        "5": {key: "5" , charCode: 53, tiKeys: [TIKey.Digit5]},
        "6": {key: "6" , charCode: 54, tiKeys: [TIKey.Digit6]},
        "7": {key: "7" , charCode: 55, tiKeys: [TIKey.Digit7]},
        "8": {key: "8" , charCode: 56, tiKeys: [TIKey.Digit8]},
        "9": {key: "9" , charCode: 57, tiKeys: [TIKey.Digit9]},
        ":": {key: ":" , charCode: 58, tiKeys: [TIKey.Shift, TIKey.Semicolon]},
        ";": {key: ";" , charCode: 59, tiKeys: [TIKey.Semicolon]},
        "<": {key: "<" , charCode: 60, tiKeys: [TIKey.Shift, TIKey.Comma]},
        "=": {key: "=" , charCode: 61, tiKeys: [TIKey.Equal]},
        ">": {key: ">" , charCode: 62, tiKeys: [TIKey.Shift, TIKey.Period]},
        "?": {key: "?" , charCode: 63, tiKeys: [TIKey.Fctn, TIKey.KeyI]},
        "@": {key: "@" , charCode: 64, tiKeys: [TIKey.Shift, TIKey.Digit2]},
        "A": {key: "A" , charCode: 65, tiKeys: [TIKey.Shift, TIKey.KeyA]},
        "B": {key: "B" , charCode: 66, tiKeys: [TIKey.Shift, TIKey.KeyB]},
        "C": {key: "C" , charCode: 67, tiKeys: [TIKey.Shift, TIKey.KeyC]},
        "D": {key: "D" , charCode: 68, tiKeys: [TIKey.Shift, TIKey.KeyD]},
        "E": {key: "E" , charCode: 69, tiKeys: [TIKey.Shift, TIKey.KeyE]},
        "F": {key: "F" , charCode: 70, tiKeys: [TIKey.Shift, TIKey.KeyF]},
        "G": {key: "G" , charCode: 71, tiKeys: [TIKey.Shift, TIKey.KeyG]},
        "H": {key: "H" , charCode: 72, tiKeys: [TIKey.Shift, TIKey.KeyH]},
        "I": {key: "I" , charCode: 73, tiKeys: [TIKey.Shift, TIKey.KeyI]},
        "J": {key: "J" , charCode: 74, tiKeys: [TIKey.Shift, TIKey.KeyJ]},
        "K": {key: "K" , charCode: 75, tiKeys: [TIKey.Shift, TIKey.KeyK]},
        "L": {key: "L" , charCode: 76, tiKeys: [TIKey.Shift, TIKey.KeyL]},
        "M": {key: "M" , charCode: 77, tiKeys: [TIKey.Shift, TIKey.KeyM]},
        "N": {key: "N" , charCode: 78, tiKeys: [TIKey.Shift, TIKey.KeyN]},
        "O": {key: "O" , charCode: 79, tiKeys: [TIKey.Shift, TIKey.KeyO]},
        "P": {key: "P" , charCode: 80, tiKeys: [TIKey.Shift, TIKey.KeyP]},
        "Q": {key: "Q" , charCode: 81, tiKeys: [TIKey.Shift, TIKey.KeyQ]},
        "R": {key: "R" , charCode: 82, tiKeys: [TIKey.Shift, TIKey.KeyR]},
        "S": {key: "S" , charCode: 83, tiKeys: [TIKey.Shift, TIKey.KeyS]},
        "T": {key: "T" , charCode: 84, tiKeys: [TIKey.Shift, TIKey.KeyT]},
        "U": {key: "U" , charCode: 85, tiKeys: [TIKey.Shift, TIKey.KeyU]},
        "V": {key: "V" , charCode: 86, tiKeys: [TIKey.Shift, TIKey.KeyV]},
        "W": {key: "W" , charCode: 87, tiKeys: [TIKey.Shift, TIKey.KeyW]},
        "X": {key: "X" , charCode: 88, tiKeys: [TIKey.Shift, TIKey.KeyX]},
        "Y": {key: "Y" , charCode: 89, tiKeys: [TIKey.Shift, TIKey.KeyY]},
        "Z": {key: "Z" , charCode: 90, tiKeys: [TIKey.Shift, TIKey.KeyZ]},
        "[": {key: "[" , charCode: 91, tiKeys: [TIKey.Fctn, TIKey.KeyR]},
        "\\": {key: "\\" , charCode: 92, tiKeys: [TIKey.Fctn, TIKey.KeyZ]},
        "]": {key: "]" , charCode: 93, tiKeys: [TIKey.Fctn, TIKey.KeyT]},
        "^": {key: "^" , charCode: 94, tiKeys: [TIKey.Shift, TIKey.Digit6]},
        "_": {key: "_" , charCode: 95, tiKeys: [TIKey.Fctn, TIKey.KeyU]},
        "`": {key: "`" , charCode: 96, tiKeys: [TIKey.Fctn, TIKey.KeyC]},
        "a": {key: "a" , charCode: 97, tiKeys: [TIKey.KeyA]},
        "b": {key: "b" , charCode: 98, tiKeys: [TIKey.KeyB]},
        "c": {key: "c" , charCode: 99, tiKeys: [TIKey.KeyC]},
        "d": {key: "d" , charCode: 100, tiKeys: [TIKey.KeyD]},
        "e": {key: "e" , charCode: 101, tiKeys: [TIKey.KeyE]},
        "f": {key: "f" , charCode: 102, tiKeys: [TIKey.KeyF]},
        "g": {key: "g" , charCode: 103, tiKeys: [TIKey.KeyG]},
        "h": {key: "h" , charCode: 104, tiKeys: [TIKey.KeyH]},
        "i": {key: "i" , charCode: 105, tiKeys: [TIKey.KeyI]},
        "j": {key: "j" , charCode: 106, tiKeys: [TIKey.KeyJ]},
        "k": {key: "k" , charCode: 107, tiKeys: [TIKey.KeyK]},
        "l": {key: "l" , charCode: 108, tiKeys: [TIKey.KeyL]},
        "m": {key: "m" , charCode: 109, tiKeys: [TIKey.KeyM]},
        "n": {key: "n" , charCode: 110, tiKeys: [TIKey.KeyN]},
        "o": {key: "o" , charCode: 111, tiKeys: [TIKey.KeyO]},
        "p": {key: "p" , charCode: 112, tiKeys: [TIKey.KeyP]},
        "q": {key: "q" , charCode: 113, tiKeys: [TIKey.KeyQ]},
        "r": {key: "r" , charCode: 114, tiKeys: [TIKey.KeyR]},
        "s": {key: "s" , charCode: 115, tiKeys: [TIKey.KeyS]},
        "t": {key: "t" , charCode: 116, tiKeys: [TIKey.KeyT]},
        "u": {key: "u" , charCode: 117, tiKeys: [TIKey.KeyU]},
        "v": {key: "v" , charCode: 118, tiKeys: [TIKey.KeyV]},
        "w": {key: "w" , charCode: 119, tiKeys: [TIKey.KeyW]},
        "x": {key: "x" , charCode: 120, tiKeys: [TIKey.KeyX]},
        "y": {key: "y" , charCode: 121, tiKeys: [TIKey.KeyY]},
        "z": {key: "z" , charCode: 122, tiKeys: [TIKey.KeyZ]},
        "{": {key: "{" , charCode: 123, tiKeys: [TIKey.Fctn, TIKey.KeyF]},
        "|": {key: "|" , charCode: 124, tiKeys: [TIKey.Fctn, TIKey.KeyA]},
        "}": {key: "}" , charCode: 125, tiKeys: [TIKey.Fctn, TIKey.KeyG]},
        "~": {key: "~" , charCode: 126, tiKeys: [TIKey.Fctn, TIKey.KeyW]},
        "Enter": {key: "Enter" , keyCode: 13, tiKeys: [TIKey.Enter]},
        "Alt": {key: "Alt" , keyCode: 18, tiKeys: [TIKey.Fctn]},
        "Shift": {key: "Shift" , keyCode: 16, tiKeys: [TIKey.Shift]},
        "Control": {key: "Control" , keyCode: 17, tiKeys: [TIKey.Ctrl]},
        "Tab": {key: "Tab" , keyCode: 9, tiKeys: [TIKey.J1Fire]},
        "Backspace": {key: "Backspace" , keyCode: 8, tiKeys: [TIKey.Fctn, TIKey.KeyS]},
        "Delete": {key: "Delete" , keyCode: 46, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        "Escape": {key: "Escape" , keyCode: 27, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        "ArrowDown": {key: "ArrowDown" , keyCode: 40, tiKeys: [TIKey.J1Down]},
        "ArrowLeft": {key: "ArrowLeft" , keyCode: 37, tiKeys: [TIKey.J1Left]},
        "ArrowRight": {key: "ArrowRight" , keyCode: 39, tiKeys: [TIKey.J1Right]},
        "ArrowUp": {key: "ArrowUp" , keyCode: 38, tiKeys: [TIKey.J1Up]},
        "F1": {key: "F1" , keyCode: 112, tiKeys: [TIKey.Fctn, TIKey.Digit1]},
        "F2": {key: "F2" , keyCode: 113, tiKeys: [TIKey.Fctn, TIKey.Digit2]},
        "F3": {key: "F3" , keyCode: 114, tiKeys: [TIKey.Fctn, TIKey.Digit3]},
        "F4": {key: "F4" , keyCode: 115, tiKeys: [TIKey.Fctn, TIKey.Digit4]},
        "F5": {key: "F5" , keyCode: 116, tiKeys: [TIKey.Fctn, TIKey.Digit5]},
        "F6": {key: "F6" , keyCode: 117, tiKeys: [TIKey.Fctn, TIKey.Digit6]},
        "F7": {key: "F7" , keyCode: 118, tiKeys: [TIKey.Fctn, TIKey.Digit7]},
        "F8": {key: "F8" , keyCode: 119, tiKeys: [TIKey.Fctn, TIKey.Digit8]},
        "F9": {key: "F9" , keyCode: 120, tiKeys: [TIKey.Fctn, TIKey.Digit9]},
        "F10": {key: "F10" , keyCode: 21, tiKeys: [TIKey.Fctn, TIKey.Equal]},
        "CapsLock": {key: "CapsLock" , keyCode: 20, tiKeys: []}
    };

    public static getKeyFromCode(code: string): Key {
        return KeyMapper.tiKeysByCode[code];
    }

    public static getKeyFromKey(key: string): Key {
        return KeyMapper.tiKeysByKey[key];
    }

    public static getKeyFromKeyCode(keyCode: number): Key | undefined {
        return Object.values(KeyMapper.tiKeysByCode).find(k => k.keyCode === keyCode);
    }
}

