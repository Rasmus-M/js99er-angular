export enum SoftwareType {
    SYSTEM = 0,
    MEMORY_DUMP = 1,
    CART = 2,
    INVERTED_CART = 3,
    DIVIDER = 4,
    GROUP = 5,
    MORE = 6
}

export class MemoryBlock {

    private _address: number;
    private _data: Uint8Array;

    constructor(address: number, data: Uint8Array) {
        this._address = address;
        this._data = data;
    }

    get address(): number {
        return this._address;
    }

    set address(value: number) {
        this._address = value;
    }

    get data(): Uint8Array {
        return this._data;
    }

    set data(value: Uint8Array) {
        this._data = value;
    }
}

export class Software {

    static MENU: any = [
        {
            type: "ITEM",
            name: "TI Basic"
        },
        {
            type: "ITEM",
            name: "TI Extended Basic",
            url: "software/xb.json"
        },
        {
            type: "ITEM",
            name: "Editor/Assembler",
            url: "software/editor-assembler.json"
        },
        {
            type: "DIVIDER"
        },
        {
            type: "SUBMENU",
            name: "Apps",
            items: [
                {
                    type: "ITEM",
                    name: "Mini Memory",
                    url: "software/minimem.json"
                },
                {
                    type: "ITEM",
                    name: "Supercart",
                    url: "software/supercart.json"
                },
                {
                    type: "ITEM",
                    name: "Editor Assembler II",
                    url: "software/ea2.json"
                },
                {
                    type: "ITEM",
                    name: "RXB 2015",
                    url: "software/RXB2015.rpk"
                },
                {
                    type: "ITEM",
                    name: "Cortex Basic",
                    url: "software/cortexbasic.rpk"
                },
                {
                    type: "ITEM",
                    name: "Cortex Basic 80",
                    url: "software/cortex_basic_80.rpk"
                },
                {
                    type: "ITEM",
                    name: "TurboForth",
                    url: "software/turboforth.rpk"
                },
                {
                    type: "ITEM",
                    name: "fbForth",
                    url: "software/fbForth200.rpk"
                },
                {
                    type: "ITEM",
                    name: "TI Workshop",
                    url: "software/ti-workshop.json"
                },
                {
                    type: "ITEM",
                    name: "XB 2.7 Suite",
                    url: "software/xb27suite2.json"
                },
                {
                    type: "ITEM",
                    name: "Jumpstart for xas99",
                    url: "software/jumpstart.rpk"
                }
            ]
        },
        {
            type: "DIVIDER"
        },
        {
            type: "SUBMENU",
            name: "Games",
            items: [
                {
                    type: "ITEM",
                    name: "Parsec",
                    url: "software/parsec.json"
                },
                {
                    type: "ITEM",
                    name: "TI Invaders",
                    url: "software/ti-invaders.json"
                },
                {
                    type: "ITEM",
                    name: "Q-Bert",
                    url: "software/qbert.json"
                },
                {
                    type: "ITEM",
                    name: "Atarisoft compilation",
                    url: "software/atarisoft-multicart.rpk"
                },
                {
                    type: "ITEM",
                    name: "Game cart 1 (512K)",
                    url: "software/gamecart.rpk"
                },
                {
                    type: "ITEM",
                    name: "Game cart 2 (512K)",
                    url: "software/gamecart2.rpk"
                },
                {
                    type: "ITEM",
                    name: "Game cart 3 (512K)",
                    url: "software/gamecart3.rpk"
                },
                {
                    type: "ITEM",
                    name: "Rasmus 8-in-1 game cart",
                    url: "software/rasmus-8in1-cart.rpk"
                },
                {
                    type: "ITEM",
                    name: "Road Hunter/TI Scramble/Titanium",
                    url: "software/scrolling-trilogy.json"
                },
                {
                    type: "ITEM",
                    name: "Flappy Bird",
                    url: "software/flappybird.json"
                },
                {
                    type: "ITEM",
                    name: "Sabre Wulf",
                    url: "software/sabrewulf.rpk"
                },
                {
                    type: "ITEM",
                    name: "Sports",
                    url: "software/sports.rpk"
                },
                {
                    type: "ITEM",
                    name: "Jet Set Willy",
                    url: "software/jsw.rpk"
                },
                {
                    type: "ITEM",
                    name: "Bouncy",
                    url: "software/bouncy.rpk"
                },
                {
                    type: "ITEM",
                    name: "Knight Lore",
                    url: "software/knightlore8.bin"
                },
                {
                    type: "ITEM",
                    name: "Skyway",
                    url: "software/skyway8.bin"
                },
                {
                    type: "ITEM",
                    name: "JetPac",
                    url: "software/JetPac3.bin"
                },
                {
                    type: "ITEM",
                    name: "Pitfall!",
                    url: "software/pitfall.json"
                },
                {
                    type: "ITEM",
                    name: "Break Free",
                    url: "software/brkfree.rpk"
                },
                {
                    type: "ITEM",
                    name: "Flying Shark",
                    url: "software/flying-shark-v1.2.rpk"
                }
            ]
        },
        {
            type: "DIVIDER"
        },
        {
            type: "SUBMENU",
            name: "Demos",
            items: [
                {
                    type: "ITEM",
                    name: "Megademo",
                    url: "software/ti99demo.rpk"
                },
                {
                    type: "ITEM",
                    name: "Horizontal scrolling demo",
                    url: "software/hscroll.json"
                },
                {
                    type: "ITEM",
                    name: "Platform 2D scrolling demo",
                    url: "software/platform.json"
                },
                {
                    type: "ITEM",
                    name: "Isometric scrolling demo",
                    url: "software/isoscroll.json"
                },
                {
                    type: "ITEM",
                    name: "Dungeon demo",
                    url: "software/dungeon.json"
                },
                {
                    type: "ITEM",
                    name: "Light-year demo",
                    url: "software/light-year.json"
                },
                {
                    type: "ITEM",
                    name: "Lines demo",
                    url: "software/lines.json"
                },
                {
                    type: "ITEM",
                    name: "Multicolor demo",
                    url: "software/multicolor.json"
                },
                {
                    type: "ITEM",
                    name: "Scrolling Text demo",
                    url: "software/scrolltxt.json"
                },
                {
                    type: "ITEM",
                    name: "Happy 2015 demo",
                    url: "software/happy2015.json"
                },
                {
                    type: "ITEM",
                    name: "Another scrolling demo",
                    url: "software/platform2.json"
                },
                {
                    type: "ITEM",
                    name: "Animated hat demo",
                    url: "software/hat.rpk"
                },
                {
                    type: "ITEM",
                    name: "Monkey Island demo",
                    url: "software/monkey8.rpk"
                }
            ]
        },
        {
            type: "DIVIDER"
        },
        {
            type: "SUBMENU",
            name: "F18A specific",
            items: [
                {
                    type: "ITEM",
                    name: "F18A scrolling demo",
                    url: "software/ecm3scroll.json"
                },
                {
                    type: "ITEM",
                    name: "F18A bitmap demo",
                    url: "software/bitmap.json"
                },
                {
                    type: "ITEM",
                    name: "GPU image rotation",
                    url: "software/gpu-rotate.json"
                },
                {
                    type: "ITEM",
                    name: "GPU lines demo",
                    url: "software/gpu-lines.json"
                },
                {
                    type: "ITEM",
                    name: "GPU PIX lines demo",
                    url: "software/gpu-pixlines.json"
                },
                {
                    type: "ITEM",
                    name: "GPU Mandelbrot (Tursi)",
                    url: "software/gpu-mandelbrot.json"
                },
                {
                    type: "ITEM",
                    name: "Power Strike demo",
                    url: "software/powerstrike.json"
                },
                {
                    type: "ITEM",
                    name: "Poly 3D demo",
                    url: "software/poly3d.json"
                },
                {
                    type: "ITEM",
                    name: "Position attributes demo",
                    url: "software/posattr.json"
                },
                {
                    type: "ITEM",
                    name: "TI-99 Mario Bros",
                    url: "software/Mario3.bin"
                },
                {
                    type: "ITEM",
                    name: "Monkey Island Demo",
                    url: "software/f18a-monkey8.bin"
                }
            ]
        },
        {
            type: "DIVIDER"
        },
        {
            type: "MORE",
            name: "More..."
        }
    ];

    private _name: string;
    private _type: SoftwareType;
    private _inverted: boolean;
    private _url: string;
    private _rom: Uint8Array;
    private _grom: Uint8Array;
    private _groms: Uint8Array[];
    private _ramAt6000 = false;
    private _ramAt7000 = false;
    private _ramPaged: boolean;
    private _startAddress: number;
    private _workspaceAddress: number;
    private _memoryBlocks: MemoryBlock[];
    private _keyPresses: string;

    constructor() {}

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get type(): SoftwareType {
        return this._type;
    }

    set type(value: SoftwareType) {
        this._type = value;
    }

    get inverted(): boolean {
        return this._inverted;
    }

    set inverted(value: boolean) {
        this._inverted = value;
    }

    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }

    get rom(): Uint8Array {
        return this._rom;
    }

    set rom(value: Uint8Array) {
        this._rom = value;
    }

    get grom(): Uint8Array {
        return this._grom;
    }

    set grom(value: Uint8Array) {
        this._grom = value;
    }

    get groms(): Uint8Array[] {
        return this._groms;
    }

    set groms(value: Uint8Array[]) {
        this._groms = value;
    }

    get ramAt6000(): boolean {
        return this._ramAt6000;
    }

    set ramAt6000(value: boolean) {
        this._ramAt6000 = value;
    }

    get ramAt7000(): boolean {
        return this._ramAt7000;
    }

    set ramAt7000(value: boolean) {
        this._ramAt7000 = value;
    }

    get ramPaged(): boolean {
        return this._ramPaged;
    }

    set ramPaged(value: boolean) {
        this._ramPaged = value;
    }

    get startAddress(): number {
        return this._startAddress;
    }

    set startAddress(value: number) {
        this._startAddress = value;
    }

    get workspaceAddress(): number {
        return this._workspaceAddress;
    }

    set workspaceAddress(value: number) {
        this._workspaceAddress = value;
    }

    get memoryBlocks(): MemoryBlock[] {
        return this._memoryBlocks;
    }

    set memoryBlocks(value: MemoryBlock[]) {
        this._memoryBlocks = value;
    }

    get keyPresses(): string {
        return this._keyPresses;
    }

    set keyPresses(value: string) {
        this._keyPresses = value;
    }
}
