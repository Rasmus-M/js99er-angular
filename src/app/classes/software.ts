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

    static PROGRAMS: any = [
        {
            name: "TI Basic",
            type: SoftwareType.SYSTEM
        },
        {
            name: "TI Extended Basic",
            type: SoftwareType.CART,
            url: "software/xb.json"
        },
        {
            name: "Editor/Assembler",
            type: SoftwareType.CART,
            url: "software/editor-assembler.json"
        },
        {
            type: SoftwareType.DIVIDER
        },
        {
            name: "Apps",
            type: SoftwareType.GROUP,
            programs: [
                {
                    name: "Mini Memory",
                    type: SoftwareType.CART,
                    url: "software/minimem.json"
                },
                {
                    name: "Supercart",
                    type: SoftwareType.CART,
                    url: "software/supercart.json"
                },
                {
                    name: "Editor Assembler II",
                    type: SoftwareType.CART,
                    url: "software/ea2.json"
                },
                {
                    name: "RXB 2015",
                    type: SoftwareType.CART,
                    url: "software/RXB2015.rpk"
                },
                {
                    name: "Cortex Basic",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/cortexbasic.rpk"
                },
                {
                    name: "Cortex Basic 80",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/cortex_basic_80.rpk"
                },
                {
                    name: "TurboForth",
                    type: SoftwareType.CART,
                    url: "software/turboforth.rpk"
                },
                {
                    name: "fbForth",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/fbForth200.rpk"
                },
                {
                    name: "TI Workshop",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/ti-workshop.json"
                },
                {
                    name: "XB 2.7 Suite",
                    type: SoftwareType.CART,
                    url: "software/xb27suite2.json"
                },
                {
                    name: "Jumpstart for xas99",
                    type: SoftwareType.CART,
                    url: "software/jumpstart.rpk"
                }
            ]
        },
        {
            type: SoftwareType.DIVIDER
        },
        {
            name: "Games",
            type: SoftwareType.GROUP,
            programs: [
                {
                    name: "Parsec",
                    type: SoftwareType.CART,
                    url: "software/parsec.json"
                },
                {
                    name: "TI Invaders",
                    type: SoftwareType.CART,
                    url: "software/ti-invaders.json"
                },
                {
                    name: "Q-Bert",
                    type: SoftwareType.CART,
                    url: "software/qbert.json"
                },
                {
                    name: "Atarisoft compilation",
                    type: SoftwareType.CART,
                    url: "software/atarisoft-multicart.rpk"
                },
                {
                    name: "Game cart 1 (512K)",
                    type: SoftwareType.CART,
                    url: "software/gamecart.rpk"
                },
                {
                    name: "Game cart 2 (512K)",
                    type: SoftwareType.CART,
                    url: "software/gamecart2.rpk"
                },
                {
                    name: "Game cart 3 (512K)",
                    type: SoftwareType.CART,
                    url: "software/gamecart3.rpk"
                },
                {
                    name: "Rasmus 8-in-1 game cart",
                    type: SoftwareType.CART,
                    url: "software/rasmus-8in1-cart.rpk"
                },
                {
                    name: "Road Hunter/TI Scramble/Titanium",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/scrolling-trilogy.json"
                },
                {
                    name: "Flappy Bird",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/flappybird.json"
                },
                {
                    name: "Sabre Wulf",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/sabrewulf.rpk"
                },
                {
                    name: "Sports",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/sports.rpk"
                },
                {
                    name: "Jet Set Willy",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/jsw.rpk"
                },
                {
                    name: "Bouncy",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/bouncy.rpk"
                },
                {
                    name: "Knight Lore",
                    type: SoftwareType.CART,
                    url: "software/knightlore8.bin"
                },
                {
                    name: "Skyway",
                    type: SoftwareType.CART,
                    url: "software/skyway8.bin"
                },
                {
                    name: "JetPac",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/JetPac3.bin"
                },
                {
                    name: "Pitfall!",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/pitfall.json"
                },
                {
                    name: "Break Free",
                    type: SoftwareType.CART,
                    url: "software/brkfree.rpk"
                },
                {
                    name: "Flying Shark",
                    type: SoftwareType.CART,
                    url: "software/flying-shark-v1.2.rpk"
                }
            ]
        },
        {
            type: SoftwareType.DIVIDER
        },
        {
            name: "Demos",
            type: SoftwareType.GROUP,
            programs: [
                {
                    name: "Megademo",
                    type: SoftwareType.CART,
                    url: "software/ti99demo.rpk"
                },
                {
                    name: "Horizontal scrolling demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/hscroll.json"
                },
                {
                    name: "Platform 2D scrolling demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/platform.json"
                },
                {
                    name: "Isometric scrolling demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/isoscroll.json"
                },
                {
                    name: "Dungeon demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/dungeon.json"
                },
                {
                    name: "Light-year demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/light-year.json"
                },
                {
                    name: "Lines demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/lines.json"
                },
                {
                    name: "Multicolor demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/multicolor.json"
                },
                {
                    name: "Scrolling Text demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/scrolltxt.json"
                },
                {
                    name: "Happy 2015 demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/happy2015.json"
                },
                {
                    name: "Another scrolling demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/platform2.json"
                },
                {
                    name: "Animated hat demo",
                    type: SoftwareType.CART,
                    url: "software/hat.rpk"
                },
                {
                    name: "Monkey Island demo",
                    type: SoftwareType.CART,
                    url: "software/monkey8.rpk"
                }
            ]
        },
        {
            type: SoftwareType.DIVIDER
        },
        {
            name: "F18A specific",
            type: SoftwareType.GROUP,
            programs: [
                {
                    name: "F18A scrolling demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/ecm3scroll.json"
                },
                {
                    name: "F18A bitmap demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/bitmap.json"
                },
                {
                    name: "GPU image rotation",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/gpu-rotate.json"
                },
                {
                    name: "GPU lines demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/gpu-lines.json"
                },
                {
                    name: "GPU PIX lines demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/gpu-pixlines.json"
                },
                {
                    name: "GPU Mandelbrot (Tursi)",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/gpu-mandelbrot.json"
                },
                {
                    name: "Power Strike demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/powerstrike.json"
                },
                {
                    name: "Poly 3D demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/poly3d.json"
                },
                {
                    name: "Position attributes demo",
                    type: SoftwareType.MEMORY_DUMP,
                    url: "software/posattr.json"
                },
                {
                    name: "TI-99 Mario Bros",
                    type: SoftwareType.INVERTED_CART,
                    url: "software/Mario3.bin"
                },
                {
                    name: "Monkey Island Demo",
                    type: SoftwareType.CART,
                    url: "software/f18a-monkey8.bin"
                }
            ]
        },
        {
            type: SoftwareType.DIVIDER
        },
        {
            name: "More...",
            type: SoftwareType.MORE
        }
    ];

    private _name: string;
    private _type: SoftwareType;
    private _inverted: boolean;
    private _url: string;
    private _rom: Uint8Array;
    private _grom: Uint8Array;
    private _groms: Uint8Array[];
    private _ramAt6000: boolean;
    private _ramAt7000: boolean;
    private _ramPaged: boolean;
    private _startAddress: number;
    private _memoryBlocks: MemoryBlock[];

    constructor(data: any) {
        this._name = data.name;
        this._type = data.type;
        this._url = data.url;
    }

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

    get memoryBlocks(): MemoryBlock[] {
        return this._memoryBlocks;
    }

    set memoryBlocks(value: MemoryBlock[]) {
        this._memoryBlocks = value;
    }
}
