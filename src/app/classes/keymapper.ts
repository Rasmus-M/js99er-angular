export interface Key {
    code: string;
    keyCode: number;
    tiKeys: {col: number, row: number}[];
}

export class Keymapper {

    private static keys: Key[] = [
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
        {code: "Minus", keyCode: 187, tiKeys: [{col: 0, row: 8}, {col: 5, row: 3}]},
        {code: "Period", keyCode: 190, tiKeys: [{col: 1, row: 3}]},
        {code: "Comma", keyCode: 188, tiKeys: [{col: 2, row: 3}]},
        {code: "Quote", keyCode: 222, tiKeys: [{col: 0, row: 7}, {col: 5, row: 5}]},
        {code: "Slash", keyCode: 189, tiKeys: [{col: 5, row: 3}]},
        {code: "Semicolon", keyCode: 192, tiKeys: [{col: 5, row: 4}]},
        {code: "BracketLeft", keyCode: 219, tiKeys: [{col: 0, row: 7}, {col: 3, row: 9}]},
        {code: "BracketRight", keyCode: 221, tiKeys: [{col: 0, row: 7}, {col: 4, row: 9}]},
        {code: "Backslash", keyCode: 191, tiKeys: [{col: 0, row: 7}, {col: 5, row: 10}]},
        {code: "Space", keyCode: 32, tiKeys: [{col: 0, row: 4}]},
        {code: "Enter", keyCode: 13, tiKeys: [{col: 0, row: 5}]},
        {code: "Tab", keyCode: 9, tiKeys: [{col: 6, row: 3}]},
        {code: "AltLeft", keyCode: 18, tiKeys: [{col: 0, row: 7}]},
        {code: "AltRight", keyCode: 18, tiKeys: [{col: 0, row: 7}]},
        {code: "ControlLeft", keyCode: 17, tiKeys: [{col: 0, row: 9}]},
        {code: "ControlRight", keyCode: 17, tiKeys: [{col: 0, row: 9}]},
        {code: "ShiftLeft", keyCode: 16, tiKeys: [{col: 0, row: 8}]},
        {code: "ShiftRight", keyCode: 16, tiKeys: [{col: 0, row: 8}]},
        {code: "ArrowDown", keyCode: 40, tiKeys: [{col: 6, row: 6}]},
        {code: "ArrowLeft", keyCode: 37, tiKeys: [{col: 6, row: 4}]},
        {code: "ArrowRight", keyCode: 39, tiKeys: [{col: 6, row: 5}]},
        {code: "ArrowUp", keyCode: 38, tiKeys: [{col: 6, row: 7}]},
        {code: "Escape", keyCode: 27, tiKeys: [{col: 0, row: 7}, {col: 1, row: 6}]},
        {code: "Backspace", keyCode: 8, tiKeys: [{col: 0, row: 7}, {col: 1, row: 8}]},
        {code: "Delete", keyCode: 46, tiKeys: [{col: 0, row: 7}, {col: 5, row: 7}]},
        {code: "Insert", keyCode: 45, tiKeys: [{col: 0, row: 7}, {col: 1, row: 7}]},
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

    public static keyFromCode(code: string): Key {
        return Keymapper.keys.find((key) => key.code === code);
    }

    public static keyFromKeyCode(keyCode: number): Key {
        return Keymapper.keys.find((key) => key.keyCode === keyCode);
    }
}

