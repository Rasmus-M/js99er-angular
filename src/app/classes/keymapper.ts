export interface Key {
    code?: string;
    key?: string;
    keyCode: number;
    tiKeys: {col: number, row: number}[];
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
    static Fctn = {col: 0, row: 7};
    static Shift = {col: 0, row: 8};
    static Ctrl = {col: 0, row: 9};
}

export class KeyMapper {

    private static tiKeysByCode: Key[] = [
        {code: "Digit0", keyCode: 48, tiKeys: [{col: 5, row: 6}]},
        {code: "Digit1", keyCode: 49, tiKeys: [{col: 5, row: 7}]},
        {code: "Digit2", keyCode: 50, tiKeys: [{col: 1, row: 7}]},
        {code: "Digit3", keyCode: 51, tiKeys: [{col: 2, row: 7}]},
        {code: "Digit4", keyCode: 52, tiKeys: [{col: 3, row: 7}]},
        {code: "Digit5", keyCode: 53, tiKeys: [{col: 4, row: 7}]},
        {code: "Digit6", keyCode: 54, tiKeys: [{col: 4, row: 6}]},
        {code: "Digit7", keyCode: 55, tiKeys: [{col: 3, row: 6}]},
        {code: "Digit8", keyCode: 56, tiKeys: [{col: 2, row: 6}]},
        {code: "Digit9", keyCode: 57, tiKeys: [{col: 1, row: 6}]},
        {code: "KeyA", keyCode: 65, tiKeys: [{col: 5, row: 8}]},
        {code: "KeyB", keyCode: 66, tiKeys: [{col: 4, row: 10}]},
        {code: "KeyC", keyCode: 67, tiKeys: [{col: 2, row: 10}]},
        {code: "KeyD", keyCode: 68, tiKeys: [{col: 2, row: 8}]},
        {code: "KeyE", keyCode: 69, tiKeys: [{col: 2, row: 9}]},
        {code: "KeyF", keyCode: 70, tiKeys: [{col: 3, row: 8}]},
        {code: "KeyG", keyCode: 71, tiKeys: [{col: 4, row: 8}]},
        {code: "KeyH", keyCode: 72, tiKeys: [{col: 4, row: 4}]},
        {code: "KeyI", keyCode: 73, tiKeys: [{col: 2, row: 5}]},
        {code: "KeyJ", keyCode: 74, tiKeys: [{col: 3, row: 4}]},
        {code: "KeyK", keyCode: 75, tiKeys: [{col: 2, row: 4}]},
        {code: "KeyL", keyCode: 76, tiKeys: [{col: 1, row: 4}]},
        {code: "KeyM", keyCode: 77, tiKeys: [{col: 3, row: 3}]},
        {code: "KeyN", keyCode: 78, tiKeys: [{col: 4, row: 3}]},
        {code: "KeyO", keyCode: 79, tiKeys: [{col: 1, row: 5}]},
        {code: "KeyP", keyCode: 80, tiKeys: [{col: 5, row: 5}]},
        {code: "KeyQ", keyCode: 81, tiKeys: [{col: 5, row: 9}]},
        {code: "KeyR", keyCode: 82, tiKeys: [{col: 3, row: 9}]},
        {code: "KeyS", keyCode: 83, tiKeys: [{col: 1, row: 8}]},
        {code: "KeyT", keyCode: 84, tiKeys: [{col: 4, row: 9}]},
        {code: "KeyU", keyCode: 85, tiKeys: [{col: 3, row: 5}]},
        {code: "KeyV", keyCode: 86, tiKeys: [{col: 3, row: 10}]},
        {code: "KeyW", keyCode: 87, tiKeys: [{col: 1, row: 9}]},
        {code: "KeyX", keyCode: 88, tiKeys: [{col: 1, row: 10}]},
        {code: "KeyY", keyCode: 89, tiKeys: [{col: 4, row: 5}]},
        {code: "KeyZ", keyCode: 90, tiKeys: [{col: 5, row: 10}]},
        {code: "Equal", keyCode: 187, tiKeys: [{col: 0, row: 3}]},
        {code: "Minus", keyCode: 187, tiKeys: [TIKey.Shift, {col: 5, row: 3}]},
        {code: "Period", keyCode: 190, tiKeys: [{col: 1, row: 3}]},
        {code: "Comma", keyCode: 188, tiKeys: [{col: 2, row: 3}]},
        {code: "Quote", keyCode: 222, tiKeys: [TIKey.Fctn, {col: 5, row: 5}]},
        {code: "Slash", keyCode: 189, tiKeys: [{col: 5, row: 3}]},
        {code: "Semicolon", keyCode: 192, tiKeys: [{col: 5, row: 4}]},
        {code: "BracketLeft", keyCode: 219, tiKeys: [TIKey.Fctn, {col: 3, row: 9}]},
        {code: "BracketRight", keyCode: 221, tiKeys: [TIKey.Fctn, {col: 4, row: 9}]},
        {code: "Backslash", keyCode: 191, tiKeys: [TIKey.Fctn, {col: 5, row: 10}]},
        {code: "Space", keyCode: 32, tiKeys: [{col: 0, row: 4}]},
        {code: "Enter", keyCode: 13, tiKeys: [{col: 0, row: 5}]},
        {code: "Tab", keyCode: 9, tiKeys: [{col: 6, row: 3}]},
        {code: "AltLeft", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {code: "AltRight", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {code: "ControlLeft", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {code: "ControlRight", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {code: "ShiftLeft", keyCode: 16, tiKeys: [TIKey.Shift]},
        {code: "ShiftRight", keyCode: 16, tiKeys: [TIKey.Shift]},
        {code: "ArrowDown", keyCode: 40, tiKeys: [{col: 6, row: 6}]},
        {code: "ArrowLeft", keyCode: 37, tiKeys: [{col: 6, row: 4}]},
        {code: "ArrowRight", keyCode: 39, tiKeys: [{col: 6, row: 5}]},
        {code: "ArrowUp", keyCode: 38, tiKeys: [{col: 6, row: 7}]},
        {code: "Escape", keyCode: 27, tiKeys: [TIKey.Fctn, {col: 1, row: 6}]},
        {code: "Backspace", keyCode: 8, tiKeys: [TIKey.Fctn, {col: 1, row: 8}]},
        {code: "Delete", keyCode: 46, tiKeys: [TIKey.Fctn, {col: 5, row: 7}]},
        {code: "Insert", keyCode: 45, tiKeys: [TIKey.Fctn, {col: 1, row: 7}]},
        {code: "CapsLock", keyCode: 0, tiKeys: []},
        /*
        {code: "Backquote", keyCode: 0, tiKeys: []},
        {code: "IntlBackslash", keyCode: 0, tiKeys: []},
        {code: "F1", keyCode: 0, tiKeys: []},
        {code: "F2", keyCode: 0, tiKeys: []},
        {code: "F3", keyCode: 0, tiKeys: []},
        {code: "F4", keyCode: 0, tiKeys: []},
        {code: "F5", keyCode: 0, tiKeys: []},
        {code: "F6", keyCode: 0, tiKeys: []},
        {code: "F7", keyCode: 0, tiKeys: []},
        {code: "F8", keyCode: 0, tiKeys: []},
        {code: "F9", keyCode: 0, tiKeys: []},
        {code: "F10", keyCode: 0, tiKeys: []},
        {code: "F11", keyCode: 0, tiKeys: []},
        {code: "F12", keyCode: 0, tiKeys: []},
        {code: "Fn", keyCode: 0, tiKeys: []},
        {code: "FnLock", keyCode: 0, tiKeys: []},
        {code: "ScrollLock", keyCode: 0, tiKeys: []},
        {code: "PrintScreen", keyCode: 0, tiKeys: []},
        {code: "Pause", keyCode: 0, tiKeys: []},
        {code: "MetaLeft", keyCode: 0, tiKeys: []},
        {code: "MetaRight", keyCode: 0, tiKeys: []},
        {code: "End", keyCode: 0, tiKeys: []},
        {code: "Home", keyCode: 0, tiKeys: []},
        {code: "PageDown", keyCode: 0, tiKeys: []},
        {code: "PageUp", keyCode: 0, tiKeys: []},
        {code: "ContextMenu", keyCode: 0, tiKeys: []},
        {code: "Help", keyCode: 0, tiKeys: []}
        */
    ];

    private static tiKeysByKey: Key[] = [
        {key: " ", keyCode: 32, tiKeys: [{col: 0, row: 4}]},
        {key: "!", keyCode: 33, tiKeys: [{col: 5, row: 7}]},
        {key: "\"", keyCode: 34, tiKeys: [TIKey.Fctn, {col: 5, row: 5}]},
        {key: "#", keyCode: 35, tiKeys: [TIKey.Shift, {col: 2, row: 7}]},
        {key: "$", keyCode: 36, tiKeys: [TIKey.Shift, {col: 3, row: 7}]},
        {key: "%", keyCode: 37, tiKeys: [TIKey.Shift, {col: 4, row: 7}]},
        {key: "&", keyCode: 38, tiKeys: [TIKey.Shift, {col: 3, row: 6}]},
        {key: "'", keyCode: 39, tiKeys: [TIKey.Fctn, {col: 1, row: 5}]},
        {key: "(", keyCode: 40, tiKeys: [TIKey.Shift, {col: 1, row: 6}]},
        {key: ")", keyCode: 41, tiKeys: [TIKey.Shift, {col: 5, row: 6}]},
        {key: "*", keyCode: 42, tiKeys: [TIKey.Shift, {col: 2, row: 6}]},
        {key: "+", keyCode: 43, tiKeys: [TIKey.Shift, {col: 0, row: 3}]},
        {key: ",", keyCode: 44, tiKeys: [{col: 2, row: 3}]},
        {key: "-", keyCode: 45, tiKeys: [TIKey.Shift, {col: 5, row: 3}]},
        {key: ".", keyCode: 46, tiKeys: [{col: 1, row: 3}]},
        {key: "/", keyCode: 47, tiKeys: [{col: 5, row: 3}]},
        {key: "0", keyCode: 48, tiKeys: [{col: 5, row: 6}]},
        {key: "1", keyCode: 49, tiKeys: [{col: 5, row: 7}]},
        {key: "2", keyCode: 50, tiKeys: [{col: 1, row: 7}]},
        {key: "3", keyCode: 51, tiKeys: [{col: 2, row: 7}]},
        {key: "4", keyCode: 52, tiKeys: [{col: 3, row: 7}]},
        {key: "5", keyCode: 53, tiKeys: [{col: 4, row: 7}]},
        {key: "6", keyCode: 54, tiKeys: [{col: 4, row: 6}]},
        {key: "7", keyCode: 55, tiKeys: [{col: 3, row: 6}]},
        {key: "8", keyCode: 56, tiKeys: [{col: 2, row: 6}]},
        {key: "9", keyCode: 57, tiKeys: [{col: 1, row: 6}]},
        {key: ":", keyCode: 58, tiKeys: [TIKey.Shift, {col: 5, row: 4}]},
        {key: ";", keyCode: 59, tiKeys: [{col: 5, row: 4}]},
        {key: "<", keyCode: 60, tiKeys: [TIKey.Shift, {col: 2, row: 3}]},
        {key: "=", keyCode: 61, tiKeys: [{col: 0, row: 3}]},
        {key: ">", keyCode: 62, tiKeys: [TIKey.Shift, {col: 1, row: 3}]},
        {key: "?", keyCode: 63, tiKeys: [TIKey.Fctn, {col: 2, row: 5}]},
        {key: "@", keyCode: 64, tiKeys: [TIKey.Shift, {col: 1, row: 7}]},
        {key: "A", keyCode: 65, tiKeys: [TIKey.Shift, {col: 5, row: 8}]},
        {key: "B", keyCode: 66, tiKeys: [TIKey.Shift, {col: 4, row: 10}]},
        {key: "C", keyCode: 67, tiKeys: [TIKey.Shift, {col: 2, row: 10}]},
        {key: "D", keyCode: 68, tiKeys: [TIKey.Shift, {col: 2, row: 8}]},
        {key: "E", keyCode: 69, tiKeys: [TIKey.Shift, {col: 2, row: 9}]},
        {key: "F", keyCode: 70, tiKeys: [TIKey.Shift, {col: 3, row: 8}]},
        {key: "G", keyCode: 71, tiKeys: [TIKey.Shift, {col: 4, row: 8}]},
        {key: "H", keyCode: 72, tiKeys: [TIKey.Shift, {col: 4, row: 4}]},
        {key: "I", keyCode: 73, tiKeys: [TIKey.Shift, {col: 2, row: 5}]},
        {key: "J", keyCode: 74, tiKeys: [TIKey.Shift, {col: 3, row: 4}]},
        {key: "K", keyCode: 75, tiKeys: [TIKey.Shift, {col: 2, row: 4}]},
        {key: "L", keyCode: 76, tiKeys: [TIKey.Shift, {col: 1, row: 4}]},
        {key: "M", keyCode: 77, tiKeys: [TIKey.Shift, {col: 3, row: 3}]},
        {key: "N", keyCode: 78, tiKeys: [TIKey.Shift, {col: 4, row: 3}]},
        {key: "O", keyCode: 79, tiKeys: [TIKey.Shift, {col: 1, row: 5}]},
        {key: "P", keyCode: 80, tiKeys: [TIKey.Shift, {col: 5, row: 5}]},
        {key: "Q", keyCode: 81, tiKeys: [TIKey.Shift, {col: 5, row: 9}]},
        {key: "R", keyCode: 82, tiKeys: [TIKey.Shift, {col: 3, row: 9}]},
        {key: "S", keyCode: 83, tiKeys: [TIKey.Shift, {col: 1, row: 8}]},
        {key: "T", keyCode: 84, tiKeys: [TIKey.Shift, {col: 4, row: 9}]},
        {key: "U", keyCode: 85, tiKeys: [TIKey.Shift, {col: 3, row: 5}]},
        {key: "V", keyCode: 86, tiKeys: [TIKey.Shift, {col: 3, row: 10}]},
        {key: "W", keyCode: 87, tiKeys: [TIKey.Shift, {col: 1, row: 9}]},
        {key: "X", keyCode: 88, tiKeys: [TIKey.Shift, {col: 1, row: 10}]},
        {key: "Y", keyCode: 89, tiKeys: [TIKey.Shift, {col: 4, row: 5}]},
        {key: "Z", keyCode: 90, tiKeys: [TIKey.Shift, {col: 5, row: 10}]},
        {key: "[", keyCode: 91, tiKeys: [TIKey.Fctn, {col: 3, row: 9}]},
        {key: "\\", keyCode: 92, tiKeys: [TIKey.Fctn, {col: 5, row: 10}]},
        {key: "]", keyCode: 93, tiKeys: [TIKey.Fctn, {col: 4, row: 9}]},
        {key: "^", keyCode: 94, tiKeys: [TIKey.Shift, {col: 4, row: 6}]},
        {key: "_", keyCode: 95, tiKeys: [TIKey.Fctn, {col: 3, row: 5}]},
        {key: "`", keyCode: 96, tiKeys: [TIKey.Fctn, {col: 2, row: 10}]},
        {key: "a", keyCode: 97, tiKeys: [{col: 5, row: 8}]},
        {key: "b", keyCode: 98, tiKeys: [{col: 4, row: 10}]},
        {key: "c", keyCode: 99, tiKeys: [{col: 2, row: 10}]},
        {key: "d", keyCode: 100, tiKeys: [{col: 2, row: 8}]},
        {key: "e", keyCode: 101, tiKeys: [{col: 2, row: 9}]},
        {key: "f", keyCode: 102, tiKeys: [{col: 3, row: 8}]},
        {key: "g", keyCode: 103, tiKeys: [{col: 4, row: 8}]},
        {key: "h", keyCode: 104, tiKeys: [{col: 4, row: 4}]},
        {key: "i", keyCode: 105, tiKeys: [{col: 2, row: 5}]},
        {key: "j", keyCode: 106, tiKeys: [{col: 3, row: 4}]},
        {key: "k", keyCode: 107, tiKeys: [{col: 2, row: 4}]},
        {key: "l", keyCode: 108, tiKeys: [{col: 1, row: 4}]},
        {key: "m", keyCode: 109, tiKeys: [{col: 3, row: 3}]},
        {key: "n", keyCode: 110, tiKeys: [{col: 4, row: 3}]},
        {key: "o", keyCode: 111, tiKeys: [{col: 1, row: 5}]},
        {key: "p", keyCode: 112, tiKeys: [{col: 5, row: 5}]},
        {key: "q", keyCode: 113, tiKeys: [{col: 5, row: 9}]},
        {key: "r", keyCode: 114, tiKeys: [{col: 3, row: 9}]},
        {key: "s", keyCode: 115, tiKeys: [{col: 1, row: 8}]},
        {key: "t", keyCode: 116, tiKeys: [{col: 4, row: 9}]},
        {key: "u", keyCode: 117, tiKeys: [{col: 3, row: 5}]},
        {key: "v", keyCode: 118, tiKeys: [{col: 3, row: 10}]},
        {key: "w", keyCode: 119, tiKeys: [{col: 1, row: 9}]},
        {key: "x", keyCode: 120, tiKeys: [{col: 1, row: 10}]},
        {key: "y", keyCode: 121, tiKeys: [{col: 4, row: 5}]},
        {key: "z", keyCode: 122, tiKeys: [{col: 5, row: 10}]},
        {key: "{", keyCode: 123, tiKeys: [TIKey.Fctn, {col: 3, row: 8}]},
        {key: "|", keyCode: 124, tiKeys: [TIKey.Fctn, {col: 5, row: 8}]},
        {key: "}", keyCode: 125, tiKeys: [TIKey.Fctn, {col: 4, row: 8}]},
        {key: "~", keyCode: 126, tiKeys: [TIKey.Fctn, {col: 1, row: 9}]},
        {key: "Enter", keyCode: 13, tiKeys: [{col: 0, row: 5}]},
        {key: "Alt", keyCode: 18, tiKeys: [TIKey.Fctn]},
        {key: "Shift", keyCode: 16, tiKeys: [TIKey.Shift]},
        {key: "Control", keyCode: 17, tiKeys: [TIKey.Ctrl]},
        {key: "Tab", keyCode: 9, tiKeys: [{col: 6, row: 3}]},
        {key: "Backspace", keyCode: 8, tiKeys: [TIKey.Fctn, {col: 1, row: 8}]},
        {key: "Delete", keyCode: 46, tiKeys: [TIKey.Fctn, {col: 5, row: 7}]},
        {key: "Escape", keyCode: 27, tiKeys: [TIKey.Fctn, {col: 1, row: 6}]},
        {key: "ArrowDown", keyCode: 40, tiKeys: [{col: 6, row: 6}]},
        {key: "ArrowLeft", keyCode: 37, tiKeys: [{col: 6, row: 4}]},
        {key: "ArrowRight", keyCode: 39, tiKeys: [{col: 6, row: 5}]},
        {key: "ArrowUp", keyCode: 38, tiKeys: [{col: 6, row: 7}]},
        /*
        {key: "F1", keyCode: 112, tiKeys: [TIKey.Fctn, {col: 5, row: 7}]},
        {key: "F2", keyCode: 113, tiKeys: [TIKey.Fctn, {col: 1, row: 7}]},
        {key: "F3", keyCode: 114, tiKeys: [TIKey.Fctn, {col: 2, row: 7}]},
        {key: "F4", keyCode: 115, tiKeys: [TIKey.Fctn, {col: 3, row: 7}]},
        {key: "F5", keyCode: 116, tiKeys: [TIKey.Fctn, {col: 4, row: 7}]},
        {key: "F6", keyCode: 117, tiKeys: [TIKey.Fctn, {col: 4, row: 6}]},
        {key: "F7", keyCode: 118, tiKeys: [TIKey.Fctn, {col: 3, row: 6}]},
        {key: "F8", keyCode: 119, tiKeys: [TIKey.Fctn, {col: 2, row: 6}]},
        {key: "F9", keyCode: 120, tiKeys: [TIKey.Fctn, {col: 1, row: 6}]},
        {key: "F10", keyCode: 21, tiKeys: [TIKey.Fctn, {col: 0, row: 3}]},
        */
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

}

