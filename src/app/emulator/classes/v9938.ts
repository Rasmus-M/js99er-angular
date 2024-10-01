/* tslint:disable */

import {VDP} from "../interfaces/vdp";
import {CPU} from "../interfaces/cpu";
import {MemoryView} from "../../classes/memoryview";
import {Util} from "../../classes/util";
import {Log} from "../../classes/log";
import {Console} from '../interfaces/console';
import {VDPType} from "../../classes/settings";

declare type int = number;
declare type int16_t = number;
declare type u8 = number;
declare type uint8_t = number;
declare type uint16_t = number;
declare type uint32_t = number;
declare type offs_t = number;
declare type pen_t = number;

interface V99x8Mode {
    m: uint8_t;
    visible_32: (ln: uint32_t[], line: int) => void;
    border_32: (ln: uint32_t[]) => void;
    sprites?: (line: int, ln: uint8_t[]) => void;
    draw_sprite_32?: (ln: uint32_t[], col: uint8_t[]) => void;
}

class MMC {
    SX: int = 0;
    SY: int = 0;
    DX: int = 0;
    DY: int = 0;
    TX: int = 0;
    TY: int = 0;
    NX: int = 0;
    NY: int = 0;
    MX: int = 0;
    ASX: int = 0;
    ADX: int = 0;
    ANX: int = 0;
    CL: uint8_t = 0;
    LO: uint8_t = 0;
    CM: uint8_t = 0;
    MXS: uint8_t = 0;
    MXD: uint8_t = 0;
}

class Color {

    private _rgba: number;

    constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 0xff) {
        this._rgba = (r << 24) | (g << 16) | (b << 8) | a;
    }

    set_rgb(rgba: number) {
        this._rgba = rgba;
        return this;
    }

    set_a(a: number): Color {
        this._rgba = (this._rgba & 0xffffff00) | (a & 0xff);
        return this;
    }

    get rgba() {
        return this._rgba;
    }

    set rgba(rgb: number) {
        this._rgba = rgb;
    }

    get r() {
        return (this._rgba & 0xff000000) >>> 24;
    }

    get g() {
        return (this._rgba & 0x00ff0000) >>> 16;
    }

    get b() {
        return (this._rgba & 0x0000ff00) >>> 8;
    }
}

class Rectangle {

    left: number;
    right: number;
    top: number;
    bottom: number;

    set(left: number, right: number, top: number, bottom: number) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
}

export class V9938 implements VDP {

    // license:BSD-3-Clause
    // copyright-holders:Aaron Giles, Nathan Woods
    /***************************************************************************

     v9938 / v9958 emulation

     ***************************************************************************/

        // #ifndef MAME_VIDEO_V9938_H
        // #define MAME_VIDEO_V9938_H
        //
        // #pragma once
        //
        // #include "screen.h"
        //
        //
        // //**************************************************************************
        // //  GLOBAL VARIABLES
        // //**************************************************************************
        //
        // // device type definition
        // DECLARE_DEVICE_TYPE(V9938, v9938_device)
        // DECLARE_DEVICE_TYPE(V9958, v9958_device)
        //
        //
        //
        // //**************************************************************************
        // //  TYPE DEFINITIONS
        // //**************************************************************************
        //
        // // ======================> v99x8_device
        //
        // class v99x8_device :    public device_t,
        //     public device_memory_interface,
        //     public device_palette_interface,
        //     public device_video_interface
        // {
        // public:
        //     auto int_cb() { return m_int_callback.bind(); }
        //     template <class T> void set_screen_ntsc(T &&screen)
        //     {
        //         set_screen(std::forward<T>(screen));
        //         m_pal_config = false;
        //     }
        //     template <class T> void set_screen_pal(T &&screen)
        //     {
        //         set_screen(std::forward<T>(screen));
        //         m_pal_config = true;
        //     }
        //
        //     bitmap_rgb32 &get_bitmap() { return m_bitmap; }
        //     void colorbus_x_input(int mx_delta);
        //     void colorbus_y_input(int my_delta);
        //     void colorbus_button_input(bool button1, bool button2);
        //
        //     uint32_t screen_update(screen_device &screen, bitmap_rgb32 &bitmap, const rectangle &cliprect);
        //
        //     uint8_t read(offs_t offset);
        //     void write(offs_t offset, uint8_t data);
        //
        //     uint8_t vram_r();
        //     uint8_t status_r();
        //     void palette_w(uint8_t data);
        //     void vram_w(uint8_t data);
        //     void command_w(uint8_t data);
        //     void register_w(uint8_t data);
        //
        //     void set_vram_size(uint32_t vram_size) { m_vram_size = vram_size; }
        //
        //     /* RESET pin */
        //     void reset_line(int state) { if (state==ASSERT_LINE) device_reset(); }
        //

    static HTOTAL = 684;
    static HVISIBLE = 544;
    static VTOTAL_NTSC = 262;
    static VTOTAL_PAL = 313;
    static VVISIBLE_NTSC = 26 + 192 + 25;
    static VVISIBLE_PAL = 53 + 192 + 49;
    // Looking at some youtube videos of real units on real monitors
    // there appear to be small vertical timing differences. Some (LCD)
    // monitors show the full borders, other CRT monitors seem to
    // display ~5 lines less at the top and bottom of the screen.
    static VERTICAL_ADJUST = 5;
    static TOP_ERASE = 13;
    static VERTICAL_SYNC = 3;
    //
    // protected:
    //     // construction/destruction
    //     v99x8_device(const machine_config &mconfig, device_type type, const char *tag, device_t *owner, uint32_t clock, int model);
    //
    //     const address_space_config      m_space_config;
    //     address_space*                  m_vram_space;
    //
    //     const int m_model;
    //
    //     bool m_pal_config;
    //
    //     // device overrides
    //     virtual void device_config_complete() override;
    //     virtual void device_start() override;
    //     virtual void device_reset() override;
    //     virtual void device_post_load() override;
    //
    //     // device_memory_interface overrides
    //     virtual space_config_vector memory_space_config() const override;
    //
    //     virtual void palette_init() = 0;
    //     virtual u32 palette_entries() const noexcept override { return 16 + 256; }
    //
    //     TIMER_CALLBACK_MEMBER(update_line);
    //
    //     void configure_pal_ntsc();
    //     void set_screen_parameters();
    //
    // private:
    //     // internal helpers
    //     pen_t pen16(int index) const { return uint32_t(pen_color(index)); }
    //     pen_t pen256(int index) const { return uint32_t(pen_color(index + 16)); }
    //     void set_pen16(int index, pen_t pen) { set_pen_color(index, rgb_t(pen).set_a(index != 0 ? 0xff : 0x00)); }
    //     void set_pen256(int index, pen_t pen) { set_pen_color(index + 16, rgb_t(pen).set_a(index != 0 ? 0xff : 0x00)); }
    //
    //     inline int position_offset(uint8_t value) { value &= 0x0f; return (value < 8) ? -value : 16 - value; }
    //     void reset_palette();
    //     void vram_write(int offset, int data);
    //     int vram_read(int offset);
    //     void check_int();
    //     void register_write(int reg, int data);
    //
    //     void default_border(uint32_t *ln);
    //     void graphic7_border(uint32_t *ln);
    //     void graphic5_border(uint32_t *ln);
    //     void mode_text1(uint32_t *ln, int line);
    //     void mode_text2(uint32_t *ln, int line);
    //     void mode_multi(uint32_t *ln, int line);
    //     void mode_graphic1(uint32_t *ln, int line);
    //     void mode_graphic23(uint32_t *ln, int line);
    //     void mode_graphic4(uint32_t *ln, int line);
    //     void mode_graphic5(uint32_t *ln, int line);
    //     void mode_graphic6(uint32_t *ln, int line);
    //     void mode_graphic7(uint32_t *ln, int line);
    // //  template<typename _PixelType, int _Width> void mode_yae(_PixelType *ln, int line);
    // //  template<typename _PixelType, int _Width> void mode_yjk(_PixelType *ln, int line);
    //     void mode_unknown(uint32_t *ln, int line);
    //     void default_draw_sprite(uint32_t *ln, uint8_t *col);
    //     void graphic5_draw_sprite(uint32_t *ln, uint8_t *col);
    //     void graphic7_draw_sprite(uint32_t *ln, uint8_t *col);
    //
    //     void sprite_mode1(int line, uint8_t *col);
    //     void sprite_mode2(int line, uint8_t *col);
    //     void set_mode();
    //     void refresh_32(int line);
    //     void refresh_line(int line);
    //
    //     void interrupt_start_vblank();
    //
    //     int VDPVRMP(uint8_t M, int MX, int X, int Y);
    //
    //     uint8_t VDPpoint5(int MXS, int SX, int SY);
    //     uint8_t VDPpoint6(int MXS, int SX, int SY);
    //     uint8_t VDPpoint7(int MXS, int SX, int SY);
    //     uint8_t VDPpoint8(int MXS, int SX, int SY);
    //
    //     uint8_t VDPpoint(uint8_t SM, int MXS, int SX, int SY);
    //
    //     void VDPpsetlowlevel(int addr, uint8_t CL, uint8_t M, uint8_t OP);
    //
    //     void VDPpset5(int MXD, int DX, int DY, uint8_t CL, uint8_t OP);
    //     void VDPpset6(int MXD, int DX, int DY, uint8_t CL, uint8_t OP);
    //     void VDPpset7(int MXD, int DX, int DY, uint8_t CL, uint8_t OP);
    //     void VDPpset8(int MXD, int DX, int DY, uint8_t CL, uint8_t OP);
    //
    //     void VDPpset(uint8_t SM, int MXD, int DX, int DY, uint8_t CL, uint8_t OP);
    //
    //     int get_vdp_timing_value(const int *);
    //
    //     void srch_engine();
    //     void line_engine();
    //     void lmmv_engine();
    //     void lmmm_engine();
    //     void lmcm_engine();
    //     void lmmc_engine();
    //     void hmmv_engine();
    //     void hmmm_engine();
    //     void ymmm_engine();
    //     void hmmc_engine();
    //
    //     inline bool v9938_second_field();
    //
    //     void cpu_to_vdp(uint8_t V);
    //     uint8_t vdp_to_cpu();
    //     void report_vdp_command(uint8_t Op);
    //     uint8_t command_unit_w(uint8_t Op);
    //     void update_command();
    //
    //     void memmap(address_map &map);
    //
    //     // general
    //     int m_offset_x, m_offset_y, m_visible_y, m_mode;
    //     // palette
    //     int m_pal_write_first, m_cmd_write_first;
    //     uint8_t m_pal_write, m_cmd_write;
    //     uint8_t m_pal_reg[32], this.stat_reg[10], this.cont_reg[48], m_read_ahead;
    //     uint8_t m_v9958_sp_mode;
    //
    //     // memory
    //     uint16_t m_address_latch;
    //     int m_vram_size;
    //
    //     // interrupt
    //     uint8_t m_int_state;
    //     devcb_write_line   m_int_callback;
    //     int m_scanline;
    //     // blinking
    //     int m_blink, m_blink_count;
    //     // mouse
    //     int16_t m_mx_delta, m_my_delta;
    //     // mouse & lightpen
    //     uint8_t m_button_state;
    //     // render bitmap
    //     bitmap_rgb32 m_bitmap;
    //     // Command unit
    //     struct {
    //     int SX,SY;
    //     int DX,DY;
    //     int TX,TY;
    //     int NX,NY;
    //     int MX;
    //     int ASX,ADX,ANX;
    //     uint8_t CL;
    //     uint8_t LO;
    //     uint8_t CM;
    //     uint8_t MXS, MXD;
    // } m_mmc;
    //     int  m_vdp_ops_count;
    //     void (v99x8_device::*m_vdp_engine)();
    //
    //     struct v99x8_mode
    //     {
    //         uint8_t m;
    //         void (v99x8_device::*visible_32)(uint32_t*, int);
    //         void (v99x8_device::*border_32)(uint32_t*);
    //         void (v99x8_device::*sprites)(int, uint8_t*);
    //         void (v99x8_device::*draw_sprite_32)(uint32_t*, uint8_t*);
    //     };
    //     static const v99x8_mode s_modes[];
    //     emu_timer *m_line_timer;
    //     uint8_t m_pal_ntsc;
    //     int m_scanline_start;
    //     int m_vblank_start;
    //     int m_scanline_max;
    //     int m_height;
    // protected:
    // static uint32_t s_pal_indYJK[0x20000];
    // };
    //
    //
    // class v9938_device : public v99x8_device
    // {
    // public:
    //     v9938_device(const machine_config &mconfig, const char *tag, device_t *owner, uint32_t clock);
    //
    // protected:
    //     virtual void palette_init() override;
    // };
    //
    // class v9958_device : public v99x8_device
    // {
    // public:
    //     v9958_device(const machine_config &mconfig, const char *tag, device_t *owner, uint32_t clock);
    //
    // protected:
    //     virtual void palette_init() override;
    // };
    //
    //
    // #endif // MAME_DEVICES_VIDEO_V9938_H

    // license:BSD-3-Clause
    // copyright-holders:Aaron Giles, Nathan Woods

    /***************************************************************************

     v9938 / v9958 emulation

     Vertical display parameters from Yamaha V9938 Technical Data Book.
     NTSC: page 146, Table 7-2
     PAL: page 147, Table 7-3

     Vertical timing:
     PAL                 NTSC
     192(LN=0) 212(LN=1) 192(LN=0) 212(LN=1)
     ------------------- --------------------
     1. Top erase (top blanking)                13        13        13        13
     2. Top border                              53        43        26        16
     3. Active display                         192       212       192       212
     4. Bottom border                           49        39        25        15
     5. Bottom erase (bottom blanking)           3         3         3         3
     6. Vertical sync (bottom blanking)          3         3         3         3
     7. Total                                  313       313       262       262

     Refresh rate                           50.158974           59.922743


     ***************************************************************************/

    /*
    todo:

    - sprite collision
    - vdp engine -- make run at correct speed
    - vr/hr/fh flags: double-check all of that
    - make vdp engine work in exp. ram
    */

    static MODE_TEXT1 = 0;
    static MODE_MULTI = 1;
    static MODE_GRAPHIC1 = 2;
    static MODE_GRAPHIC2 = 3;
    static MODE_GRAPHIC3 = 4;
    static MODE_GRAPHIC4 = 5;
    static MODE_GRAPHIC5 = 6;
    static MODE_GRAPHIC6 = 7;
    static MODE_GRAPHIC7 = 8;
    static MODE_TEXT2 = 9;
    static MODE_UNKNOWN = 10;

    static MODEL_V9938 = 0;
    static MODEL_V9958 = 1;

    static EXPMEM_OFFSET = 0x20000;

    static V9938_LONG_WIDTH = 512 + 32;

    static v9938_modes = [
        "TEXT 1", "MULTICOLOR", "GRAPHIC 1", "GRAPHIC 2", "GRAPHIC 3",
        "GRAPHIC 4", "GRAPHIC 5", "GRAPHIC 6", "GRAPHIC 7", "TEXT 2",
        "UNKNOWN"
    ];

    static LOG_GENERAL = 0;

    static LOG_WARN = 1 << 1;
    static LOG_INT = 1 << 2;
    static LOG_STATUS = 1 << 3;
    static LOG_REGWRITE = 1 << 4;
    static LOG_COMMAND = 1 << 5;
    static LOG_MODE = 1 << 6;
    static LOG_NOTIMP = 1 << 7;
    static LOG_DETAIL = 1 << 8;

    // Minimum log should be warnings+
    static LOG_LEVEL = V9938.LOG_WARN | V9938.LOG_MODE;

    // #include "logmacro.h"

    // **************************************************************************
    //  GLOBAL VARIABLES
    // **************************************************************************

    private model = V9938.MODEL_V9938;
    private vram_space = new Uint8Array(0x30000);

    // general
    private offset_x: int = 0;
    private offset_y: int = 0;
    private visible_y: int = 0;
    private mode: int = 0;

    // palette
    private pal_write_first: int = 0;
    private cmd_write_first: int = 0;
    private pal_write: uint8_t = 0;
    private cmd_write: uint8_t = 0;
    private pal_reg = new Uint8Array(32);

    private stat_reg = new Uint8Array(10);
    private cont_reg = new Uint8Array(48);
    private read_ahead: uint8_t = 0;
    private v9958_sp_mode: uint8_t = 0;

    // memory
    private address_latch: uint16_t = 0;
    private vram_size: int = 0;

    // interrupt
    private int_state: uint8_t = 0;
    // private int_callback: devcb_write_line;
    private scanline: int = 0;

    // blinking
    private blink: int = 0;
    private blink_count: int = 0;

    // mouse
    private mx_delta: int16_t = 0;
    private my_delta: int16_t = 0;

    // mouse & lightpen
    private button_state: uint8_t = 0;

    // render bitmap
    // private bitmap: bitmap_rgb32;

    // Command unit
    private mmc = new MMC();
    private vdp_ops_count: int = 0;
    private vdp_engine: (() => void) | undefined;

    private s_modes: V99x8Mode[] = [
        {
            m: 0x02,
            visible_32: this.mode_text1.bind(this),
            border_32: this.default_border.bind(this),
            sprites: undefined,
            draw_sprite_32: undefined
        },
        {
            m: 0x01,
            visible_32: this.mode_multi.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode1.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x00,
            visible_32: this.mode_graphic1.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode1.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x04,
            visible_32: this.mode_graphic23.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode1.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x08,
            visible_32: this.mode_graphic23.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode2.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x0c,
            visible_32: this.mode_graphic4.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode2.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x10,
            visible_32: this.mode_graphic5.bind(this),
            border_32: this.graphic5_border.bind(this),
            sprites: this.sprite_mode2.bind(this),
            draw_sprite_32: this.graphic5_draw_sprite.bind(this)
        },
        {
            m: 0x14,
            visible_32: this.mode_graphic6.bind(this),
            border_32: this.default_border.bind(this),
            sprites: this.sprite_mode2.bind(this),
            draw_sprite_32: this.default_draw_sprite.bind(this)
        },
        {
            m: 0x1c,
            visible_32: this.mode_graphic7.bind(this),
            border_32: this.graphic7_border.bind(this),
            sprites: this.sprite_mode2.bind(this),
            draw_sprite_32: this.graphic7_draw_sprite.bind(this)
        },
        {
            m: 0x0a,
            visible_32: this.mode_text2.bind(this),
            border_32: this.default_border.bind(this),
            sprites: undefined,
            draw_sprite_32: undefined
        },
        {
            m: 0xff,
            visible_32: this.mode_unknown.bind(this),
            border_32: this.default_border.bind(this),
            sprites: undefined,
            draw_sprite_32: undefined
        }
    ];

    // emu_timer *m_line_timer;
    private pal_ntsc: uint8_t = 0;
    private scanline_start: int = 0;
    private vblank_start: int = 0;
    private scanline_max: int = 0;
    private height: int = 0;
    private visible: Rectangle;

    private s_pal_indYJK = new Uint32Array(0x20000);
    private palette: Color[] = [];

    /*
    Similar to the TMS9928, the V9938 has an own address space. It can handle
    at most 192 KiB RAM (128 KiB base, 64 KiB expansion).
    */

    // memmap(address_map &map)
    // {
    //     map.global_mask(0x3ffff);
    //     map(0x00000, 0x2ffff).ram();
    // }

    // devices
    // DEFINE_DEVICE_TYPE(V9938, v9938_device, "v9938", "Yamaha V9938 VDP")
    // DEFINE_DEVICE_TYPE(V9958, v9958_device, "v9958", "Yamaha V9958 VDP")

    // v99x8_device(const machine_config &mconfig, device_type type, const char *tag, device_t *owner, uint32_t clock, int model)
    // :   device_t(mconfig, type, tag, owner, clock),
    // device_memory_interface(mconfig, *this),
    // device_palette_interface(mconfig, *this),
    // device_video_interface(mconfig, *this),
    // m_space_config("vram", ENDIANNESS_BIG, 8, 18),
    //     m_model(model),
    //     m_pal_config(false),
    //     m_offset_x(0),
    //     m_offset_y(0),
    //     m_visible_y(0),
    //     m_mode(0),
    //     m_pal_write_first(0),
    //     m_cmd_write_first(0),
    //     m_pal_write(0),
    //     m_cmd_write(0),
    //     m_read_ahead(0),
    //     m_v9958_sp_mode(0),
    //     m_address_latch(0),
    //     m_vram_size(0),
    //     m_int_state(0),
    //     m_int_callback(*this),
    //     m_scanline(0),
    //     m_blink(0),
    //     m_blink_count(0),
    //     m_mx_delta(0),
    //     m_my_delta(0),
    //     m_button_state(0),
    //     m_vdp_ops_count(0),
    //     m_vdp_engine(nullptr),
    //     m_pal_ntsc(0)
    // {
    //     set_addrmap(AS_DATA, address_map_constructor(FUNC(memmap), this));
    // }
    //
    // v9938_device::v9938_device(const machine_config &mconfig, const char *tag, device_t *owner, uint32_t clock)
    // : v99x8_device(mconfig, V9938, tag, owner, clock, MODEL_V9938)
    // {
    // }
    //
    // v9958_device::v9958_device(const machine_config &mconfig, const char *tag, device_t *owner, uint32_t clock)
    // : v99x8_device(mconfig, V9958, tag, owner, clock, MODEL_V9958)
    // {
    // }
    //
    // device_memory_interface::space_config_vector memory_space_config() const
    //     {
    //         return space_config_vector {
    //     std::make_pair(AS_DATA, &m_space_config)
    // };
    // }

    // device_config_complete() {
    //     if (!has_screen())
    //         return;
    //
    //     if (!screen().refresh_attoseconds())
    //         screen().set_raw(clock(),
    //             HTOTAL,
    //             0,
    //             HVISIBLE - 1,
    //             (m_pal_config ? VTOTAL_PAL : VTOTAL_NTSC) * 2,
    //             VERTICAL_ADJUST * 2,
    //             (m_pal_config ? VVISIBLE_PAL : VVISIBLE_NTSC) * 2 - 1 - VERTICAL_ADJUST * 2);
    //
    //     if (!screen().has_screen_update())
    //         screen().set_screen_update(*this, FUNC(screen_update));
    // }

    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;
    private imageData: ImageData;
    private console: Console;

    constructor(canvas: HTMLCanvasElement, console: Console) {
        this.canvas = canvas;
        this.console = console;
        const canvasContext = canvas.getContext('2d', {willReadFrequently: true});
        if (canvasContext) {
            this.canvasContext = canvasContext;
        } else {
            throw new Error("No canvas context provided.");
        }
        this.device_start();
        this.mouseEmulation();
    }

    static LOGMASKED(logType: number, message: string, ...args: (string | number)[]) {
        if (logType & V9938.LOG_LEVEL) {
            if (logType === V9938.LOG_WARN) {
                Log.getLog().warn(Util.format(message, ...args));
            } else {
                Log.getLog().info(Util.format(message, ...args));
            }
        }
    }

    static BIT(value: int, bitNo: int) {
        return (value >> bitNo) & 1;
    }

    /***************************************************************************

     JS99'er interface

     ***************************************************************************/

    getType(): VDPType {
        return 'V9938';
    }

    reset(): void {
        this.patch_groms(this.console.getMemory().getGROMs());
        this.device_reset();
        this.canvas.width = V9938.HVISIBLE;
        this.canvas.height = 2 * V9938.VVISIBLE_NTSC;
        this.imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    initFrame(): void {
        this.scanline = 0;
    }

    drawScanline(y: number): void {
        this.timer_callback_member(y);
    }

    drawInvisibleScanline(y: number): void {
        this.timer_callback_member(y);
    }

    updateCanvas(): void {
        this.canvasContext.putImageData(this.imageData, 0, 0);
    }

    writeAddress(i: number): void {
        this.command_w(i);
    }

    writeData(i: number): void {
        this.vram_w(i);
    }

    writePalette(i: number): void {
        this.palette_w(i);
    }

    writeRegisterIndirect(i: number): void {
        this.register_w(i);
    }

    readStatus(): number {
        return this.status_r();
    }

    readData(): number {
        return this.vram_r();
    }

    getRAM(): Uint8Array {
        return this.vram_space;
    }

    getRegister(r: number): number {
        return this.cont_reg[r];
    }

    getRegsString(detailed: boolean): string {
        let s = "";
        const nRegs = detailed ? 48 : 8;
        for (let i = 0; i < nRegs; i++) {
            s += "VR" + i + ":" + Util.toHexByte(this.cont_reg[i]) + (i === nRegs - 1 || i % 8 === 7 ? "\n" : " ");
        }
        s +=
            'NMT:' + Util.toHexWord(this.nameTableAddress()) + ' ' +
            'PDT:' + Util.toHexWord(this.patternTableAddress()) + ' (' + Util.toHexWord(this.patternTableSize()) + ') ' +
            'CLT:' + Util.toHexWord(this.colorTableAddress()) + ' (' + Util.toHexWord(this.colorTableSize()) + ') ' +
            'SDT:' + Util.toHexWord(this.spritePatternTableAddress()) + ' ' +
            'SAT:' + Util.toHexWord(this.spriteAttributeTableAddress()) + '\n' +
            'VDP:' + Util.toHexWord((this.cont_reg[14] << 8) | this.address_latch) + ' ' +
            'ST:' + Util.toHexByte(this.stat_reg[0]);
        return s;
    }
    getByte(addr: number): number {
        const pageOffset = (this.cont_reg[14] << 14) + (this.cont_reg[45] & 0x40 ? V9938.EXPMEM_OFFSET : 0);
        return this.vram_read(pageOffset + addr);
    }

    setByte(addr: number, i: number) {
        const pageOffset = (this.cont_reg[14] << 14) + (this.cont_reg[45] & 0x40 ? V9938.EXPMEM_OFFSET : 0);
        this.vram_write(pageOffset + addr, i);
    }

    getWord(addr: number): number {
        const pageOffset = (this.cont_reg[14] << 14) + (this.cont_reg[45] & 0x40 ? V9938.EXPMEM_OFFSET : 0);
        return (this.vram_read(pageOffset + addr) << 8) | this.vram_read(pageOffset + addr + 1);
    }

    getCharAt(x: number, y: number): number {
        const scaleX = (this.mode === V9938.MODE_TEXT2 ? 512 : 256) / 300; // ?
        x *= scaleX;
        x -= 8;
        y -= 24;
        if (x >= 0 && x < 256 && y >= 0 && y < 192) {
            switch (this.mode) {
                case V9938.MODE_GRAPHIC1:
                case V9938.MODE_GRAPHIC2:
                case V9938.MODE_GRAPHIC3:
                    return this.getByte(this.nameTableAddress() + (x >> 3) + ((y >> 3) << 5));
                case V9938.MODE_TEXT1:
                    return this.getByte(this.nameTableAddress() + Math.floor((x - 8) / 6) + (y >> 3) * 40);
                case V9938.MODE_TEXT2:
                    return this.getByte(this.nameTableAddress() + Math.floor((x - 24) / 6) + ((y + 8) >> 3) * 80);
            }
        }
        return -1;
    }

    getGPU(): CPU | undefined {
        return undefined;
    }

    drawPaletteImage(canvas: HTMLCanvasElement): void {
        const
            size = 32,
            width = canvas.width = 16 * size + 16,
            height = canvas.height = size,
            canvasContext = canvas.getContext("2d");
        if (canvasContext) {
            canvasContext.fillStyle = "rgba(255, 255, 255, 1)";
            canvasContext.fillRect(0, 0, width, height);
            let color = 0;
            for (let x = 0; x < width; x += size + 1) {
                const rgbColor = this.palette[color];
                canvasContext.fillStyle = "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + ",1)";
                canvasContext.fillRect(x, 0, size, size);
                color++;
            }
        }
    }

    drawTilePatternImage(canvas: HTMLCanvasElement, section: number, gap: boolean): void {
        const
            baseWidth = 256,
            width = canvas.width = baseWidth + (gap ? 32 : 0),
            baseHeight = 64,
            height = canvas.height = baseHeight + (gap ? 8 : 0),
            canvasContext = canvas.getContext("2d"),
            screenMode = this.mode,
            ram = this.vram_space,
            baseTableOffset = section << 11,
            colorTable = this.colorTableAddress(),
            charPatternTable = this.patternTableAddress(),
            colorTableMask = this.colorTableMask(),
            patternTableMask = this.patternTableMask(),
            palette = this.palette,
            fgColor = (this.cont_reg[7] & 0xf0) >> 4,
            bgColor = this.cont_reg[7] & 0x0f;
        if (!canvasContext) {
            return;
        }
        const
            imageData = canvasContext.createImageData(width, height),
            imageDataData = imageData.data;
        let
            name: number,
            tableOffset: number,
            colorByte: number,
            patternByte: number,
            color: number,
            rowNameOffset: number,
            lineOffset: number,
            pixelOffset: number,
            rgbColor: Color,
            imageDataAddr = 0;
        for (let y = 0; y < baseHeight; y++) {
            rowNameOffset = (y >> 3) << 5;
            lineOffset = y & 7;
            for (let x = 0; x < baseWidth; x++) {
                color = 0;
                pixelOffset = x & 7;
                switch (screenMode) {
                    case V9938.MODE_GRAPHIC1:
                        name = rowNameOffset + (x >> 3);
                        colorByte = ram[colorTable + (name >> 3)];
                        patternByte = ram[charPatternTable + (name << 3) + lineOffset];
                        color = (patternByte & (0x80 >> pixelOffset)) !== 0 ? (colorByte & 0xF0) >> 4 : (colorByte & 0x0F || bgColor);
                        break;
                    case V9938.MODE_GRAPHIC2:
                    case V9938.MODE_GRAPHIC3:
                        name = rowNameOffset + (x >> 3);
                        tableOffset = baseTableOffset + (name << 3);
                        colorByte = ram[colorTable + (tableOffset & colorTableMask) + lineOffset];
                        patternByte = ram[charPatternTable + (tableOffset & patternTableMask) + lineOffset];
                        color = (patternByte & (0x80 >> (x & 7))) !== 0 ? (colorByte & 0xF0) >> 4 : colorByte & 0x0F;
                        break;
                    case V9938.MODE_TEXT1:
                    case V9938.MODE_TEXT2:
                        name = rowNameOffset + (x >> 3);
                        patternByte = ram[charPatternTable + (name << 3) + lineOffset];
                        if (pixelOffset < 6) {
                            color = (patternByte & (0x80 >> pixelOffset)) !==  0 ? fgColor : bgColor;
                        } else {
                            color = bgColor;
                        }
                        break;
                }
                rgbColor = palette[color];
                imageDataData[imageDataAddr++] = rgbColor.r;
                imageDataData[imageDataAddr++] = rgbColor.g;
                imageDataData[imageDataAddr++] = rgbColor.b;
                imageDataData[imageDataAddr++] = 255; // Alpha
                if (gap && pixelOffset === 7) {
                    imageDataAddr += 4;
                }
            }
            if (gap && lineOffset === 7) {
                imageDataAddr += width * 4;
            }
        }
        canvasContext.putImageData(imageData, 0, 0);
    }

    drawSpritePatternImage(canvas: HTMLCanvasElement, gap: boolean): void {
        const
            baseWidth = 256,
            width = canvas.width = baseWidth + (gap ? 16 : 0),
            baseHeight = 64,
            height = canvas.height = baseHeight + (gap ? 4 : 0),
            canvasContext = canvas.getContext("2d"),
            ram = this.vram_space,
            spritePatternTable = this.spritePatternTableAddress(),
            spriteAttributeTable = this.spriteAttributeTableAddress(),
            palette = this.palette,
            patternColorMap = [],
            backgroundColor = new Color(224, 244, 255);
        if (!canvasContext) {
            return;
        }
        const
            imageData = canvasContext.createImageData(width, height),
            imageDataData = imageData.data;
        let
            pattern: number,
            patternByte: number,
            rowPatternOffset: number,
            lineOffset: number,
            pixelOffset: number,
            rgbColor: Color,
            imageDataAddr = 0;
        for (let i = 0; i < 128 && ram[spriteAttributeTable + i] !==  0xd0; i += 4) {
            if (ram[spriteAttributeTable] < 0xbf) {
                pattern = ram[spriteAttributeTable + i + 2];
                patternColorMap[pattern] = ram[spriteAttributeTable + i + 3] & 0x0f;
            }
        }
        for (let y = 0; y < baseHeight; y++) {
            rowPatternOffset = ((y >> 4) << 6) + ((y & 8) >> 3);
            lineOffset = y & 7;
            for (let x = 0; x < baseWidth; x++) {
                pixelOffset = x & 7;
                pattern = rowPatternOffset + ((x >> 3) << 1);
                patternByte = ram[spritePatternTable + (pattern << 3) + lineOffset];
                rgbColor = (patternByte & (0x80 >> pixelOffset)) !==  0 ? palette[(patternColorMap[pattern & 0xfc] || 0)] : backgroundColor;
                imageDataData[imageDataAddr++] = rgbColor.r;
                imageDataData[imageDataAddr++] = rgbColor.g;
                imageDataData[imageDataAddr++] = rgbColor.b;
                imageDataData[imageDataAddr++] = 255; // Alpha
                if (gap && pixelOffset === 7 && (x & 8) === 8) {
                    imageDataAddr += 4;
                }
            }
            if (gap && lineOffset === 7 && (y & 8) === 8) {
                imageDataAddr += width * 4;
            }
        }
        canvasContext.putImageData(imageData, 0, 0);
    }

    hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
        const pageOffset = (this.cont_reg[14] << 14) + (this.cont_reg[45] & 0x40 ? V9938.EXPMEM_OFFSET : 0);
        const getByte = (addr: number) => {
            return this.getByte(pageOffset + addr);
        };
        return MemoryView.hexView(start, length, width, anchorAddr, getByte);
    }

    getState(): any {
        return {
            model: this.model,
            vram_space: this.vram_space,
            offset_x: this.offset_x,
            offset_y: this.offset_y,
            visible_y: this.visible_y,
            mode: this.mode,
            pal_write_first: this.pal_write_first,
            cmd_write_first: this.cmd_write_first,
            pal_write: this.pal_write,
            cmd_write: this.cmd_write,
            pal_reg: this.pal_reg,
            stat_reg: this.stat_reg,
            cont_reg: this.cont_reg,
            read_ahead: this.read_ahead,
            v9958_sp_mode: this.v9958_sp_mode,
            address_latch: this.address_latch,
            vram_size: this.vram_size,
            int_state: this.int_state,
            scanline: this.scanline,
            blink: this.blink,
            blink_count: this.blink_count,
            mx_delta: this.mx_delta,
            my_delta: this.my_delta,
            button_state: this.button_state,
            vdp_ops_count: this.vdp_ops_count,
            pal_ntsc: this.pal_ntsc,
            scanline_start: this.scanline_start,
            vblank_start: this.vblank_start,
            scanline_max: this.scanline_max,
            height: this.height,
            mmc: {
                SX: this.mmc.SX,
                SY: this.mmc.SY,
                DX: this.mmc.DX,
                DY: this.mmc.DY,
                TX: this.mmc.TX,
                TY: this.mmc.TY,
                NX: this.mmc.NX,
                NY: this.mmc.NY,
                MX: this.mmc.MX,
                ASX: this.mmc.ASX,
                ADX: this.mmc.ADX,
                ANX: this.mmc.ANX,
                CL: this.mmc.CL,
                LO: this.mmc.LO,
                CM: this.mmc.CM,
                MXS: this.mmc.MXS,
                MXD: this.mmc.MXD
            }
        };
    }

    restoreState(state: any) {
        this.model = state.model;
        this.vram_space = state.vram_space;
        this.offset_x = state.offset_x;
        this.offset_y = state.offset_y;
        this.visible_y = state.visible_y;
        this.mode = state.mode;
        this.pal_write_first = state.pal_write_first;
        this.cmd_write_first = state.cmd_write_first;
        this.pal_write = state.pal_write;
        this.cmd_write = state.cmd_write;
        this.pal_reg = state.pal_reg;
        this.stat_reg = state.stat_reg;
        this.cont_reg = state.cont_reg;
        this.read_ahead = state.read_ahead;
        this.v9958_sp_mode = state.v9958_sp_mode;
        this.address_latch = state.address_latch;
        this.vram_size = state.vram_size;
        this.int_state = state.int_state;
        this.scanline = state.scanline;
        this.blink = state.blink;
        this.blink_count = state.blink_count;
        this.mx_delta = state.mx_delta;
        this.my_delta = state.my_delta;
        this.button_state = state.button_state;
        this.vdp_ops_count = state.vdp_ops_count;
        this.pal_ntsc = state.pal_ntsc;
        this.scanline_start = state.scanline_start;
        this.vblank_start = state.vblank_start;
        this.scanline_max = state.scanline_max;
        this.height = state.height;
        this.mmc.SX = state.mmc.SX;
        this.mmc.SY = state.mmc.SY;
        this.mmc.DX = state.mmc.DX;
        this.mmc.DY = state.mmc.DY;
        this.mmc.TX = state.mmc.TX;
        this.mmc.TY = state.mmc.TY;
        this.mmc.NX = state.mmc.NX;
        this.mmc.NY = state.mmc.NY;
        this.mmc.MX = state.mmc.MX;
        this.mmc.ASX = state.mmc.ASX;
        this.mmc.ADX = state.mmc.ADX;
        this.mmc.ANX = state.mmc.ANX;
        this.mmc.CL = state.mmc.CL;
        this.mmc.LO = state.mmc.LO;
        this.mmc.CM = state.mmc.CM;
        this.mmc.MXS = state.mmc.MXS;
        this.mmc.MXD = state.mmc.MXD;
        this.device_post_load();
    }

    /***************************************************************************

     JS99'er helper functions

     ***************************************************************************/

    private patch_groms(groms: Uint8Array[]) {
        const vdpRegisterData = 0x0451;
        if (groms && groms.length) {
            groms[0][vdpRegisterData + 2] = groms[0][vdpRegisterData + 2] & 0x0f; // Name table
            groms[0][vdpRegisterData + 4] = groms[0][vdpRegisterData + 4] & 0x07; // Pattern table
            groms[0][vdpRegisterData + 5] = groms[0][vdpRegisterData + 5] & 0x7f; // Sprite attribute table
            groms[0][vdpRegisterData + 6] = groms[0][vdpRegisterData + 6] & 0x07; // Sprite pattern table
        } else {
            console.error("GROM patching failed");
        }
    }

    private colorTableAddress() {
        if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return (this.cont_reg[3] & 0x80) << 6;
        } else if (this.mode === V9938.MODE_TEXT2) {
            return ((this.cont_reg[10] << 8) | (this.cont_reg[3] & 0xf8)) << 6;
        } else {
            return ((this.cont_reg[10] << 8) | this.cont_reg[3]) << 6;
        }
    }

    private nameTableAddress() {
        if (this.mode === V9938.MODE_TEXT2) {
            return (this.cont_reg[2] & 0x7c0) << 10;
        } else if (this.mode === V9938.MODE_GRAPHIC6) {
            return (this.cont_reg[2] & 0x40) << 10;
        } else if (this.mode === V9938.MODE_GRAPHIC7) {
            return (this.cont_reg[2] & 0x20) << 11;
        } else {
            return (this.cont_reg[2] & 0x7f) << 10;
        }
    }

    private patternTableAddress() {
        if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return (this.cont_reg[4] & 0x04) << 11;
        } else {
            return (this.cont_reg[4] & 0x07) << 11;
        }
    }

    private spritePatternTableAddress() {
        return this.cont_reg[6] << 11;
    }

    private spriteAttributeTableAddress() {
        return ((this.cont_reg[11] << 8) | this.cont_reg[5]) << 7;
    }

    private colorTableSize() {
        if (this.mode === V9938.MODE_GRAPHIC1) {
            return 0x20;
        } else if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return Math.min(this.colorTableMask() + 1, 0x1800);
        } else {
            return 0;
        }
    }

    private patternTableSize() {
        if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return Math.min(this.patternTableMask() + 1, 0x1800);
        } else {
            return 0x800;
        }
    }

    private colorTableMask() {
        if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return ((this.cont_reg[3] & 0x7F) << 6) | 0x3F; // 000CCCCCCC111111
        } else if (this.mode === V9938.MODE_TEXT1 || this.mode === V9938.MODE_MULTI) {
            return 0x3fff;
        } else {
            return 0x3fff;
        }
    }

    private patternTableMask() {
        if (this.mode === V9938.MODE_GRAPHIC2 || this.mode === V9938.MODE_GRAPHIC3) {
            return ((this.cont_reg[4] & 0x03) << 11) | (this.colorTableMask() & 0x7FF); // 000PPCCCCC111111
        } else if (this.mode === V9938.MODE_TEXT1 || this.mode === V9938.MODE_MULTI) {
            return ((this.cont_reg[4] & 0x03) << 11) | 0x7FF; // 000PP11111111111
        } else {
            return 0x3fff;
        }
    }

    private mouseEmulation() {
        this.canvas.addEventListener('mousemove', (evt: MouseEvent) => {
            const scale = this.canvas.clientHeight / 240;
            this.colorbus_x_input(Math.round(evt.movementX / scale));
            this.colorbus_y_input(Math.round(evt.movementY / scale));
        });
        this.canvas.addEventListener('mouseup', (evt: MouseEvent) => {
            this.colorbus_button_input((evt.buttons & 1) !==  0, (evt.buttons & 4) !==  0);
        });
        this.canvas.addEventListener('mousedown', (evt: MouseEvent) => {
            this.colorbus_button_input((evt.buttons & 1) !==  0, (evt.buttons & 2) !==  0);
        });
    }

    /***************************************************************************

     MAME code

     ***************************************************************************/

    private position_offset(value: uint8_t): int {
        value &= 0x0f;
        return (value < 8) ? -value : 16 - value;
    }

    timer_callback_member(update_line: number) {
        const scanline: int = (this.scanline - (this.scanline_start + this.offset_y));

        this.update_command();

        // set flags
        if (this.scanline === (this.scanline_start + this.offset_y)) {
            this.stat_reg[2] &= ~0x40;
        } else if (this.scanline === (this.scanline_start + this.offset_y + this.visible_y)) {
            this.stat_reg[2] |= 0x40;
            this.stat_reg[0] |= 0x80;
            this.console.getCRU().setVDPInterrupt(true);
        }

        if ((scanline >= 0) && (scanline <= this.scanline_max) &&
            (((scanline + this.cont_reg[23]) & 255) === this.cont_reg[19])) {
            this.stat_reg[1] |= 1;
            V9938.LOGMASKED(V9938.LOG_INT, "Scanline interrupt (%d)\n", scanline);
        } else if (this.cont_reg[0] & 0x10) {
            this.stat_reg[1] &= 0xfe;
        }

        this.check_int();

        // check for start of vblank
        if (this.scanline === this.vblank_start) {
            this.interrupt_start_vblank();
        }

        // render the current line
        if (this.scanline < this.vblank_start) {
            this.refresh_line(scanline);
        }

        if (++this.scanline >= this.height) {
            this.scanline = 0;
            // PAL/NTSC changed?
            const pal: int = this.cont_reg[9] & 2;
            if (this.pal_ntsc !==  pal) {
                this.pal_ntsc = pal;
                this.configure_pal_ntsc();
            }
            // screen().reset_origin();
            this.offset_y = this.position_offset(this.cont_reg[18] >> 4);
            this.set_screen_parameters();
        }
    }

    set_screen_parameters() {
        if (this.pal_ntsc) {
            // PAL
            this.scanline_start = (this.cont_reg[9] & 0x80) ? 43 : 53;
            this.scanline_max = 255;
        } else {
            // NTSC
            this.scanline_start = (this.cont_reg[9] & 0x80) ? 16 : 26;
            this.scanline_max = (this.cont_reg[9] & 0x80) ? 234 : 244;
        }
        this.visible_y = (this.cont_reg[9] & 0x80) ? 212 : 192;
    }

    // FIXME: this doesn't really allow for external clock configuration
    configure_pal_ntsc() {
        if (this.pal_ntsc) {
            // PAL
            this.height = V9938.VTOTAL_PAL;
            this.visible = new Rectangle();
            this.visible.set(0, V9938.HVISIBLE - 1, V9938.VERTICAL_ADJUST * 2, V9938.VVISIBLE_PAL * 2 - 1 - V9938.VERTICAL_ADJUST * 2);
            // screen().configure(V9938.HTOTAL, V9938.VTOTAL_PAL * 2, visible, HZ_TO_ATTOSECONDS(50.158974));
        } else {
            // NTSC
            this.height = V9938.VTOTAL_NTSC;
            this.visible = new Rectangle();
            this.visible.set(0, V9938.HVISIBLE - 1, V9938.VERTICAL_ADJUST * 2, V9938.VVISIBLE_NTSC * 2 - 1 - V9938.VERTICAL_ADJUST * 2);
            // screen().configure(V9938.HTOTAL, V9938.VTOTAL_NTSC * 2, visible, HZ_TO_ATTOSECONDS(59.922743));
        }
        this.vblank_start = this.height - V9938.VERTICAL_SYNC - V9938.TOP_ERASE; /* Sync + top erase */
    }

    /*
        Colorbus inputs
        vdp will process mouse deltas only if it is in mouse mode
        Reg 8: MS LP x x x x x x
    */
    colorbus_x_input(mx_delta: int) {
        if ((this.cont_reg[8] & 0xc0) === 0x80) {
            this.mx_delta += mx_delta;
            if (this.mx_delta < -127) {
                this.mx_delta = -127;
            }
            if (this.mx_delta > 127) {
                this.mx_delta = 127;
            }
        }
    }

    colorbus_y_input(my_delta: int) {
        if ((this.cont_reg[8] & 0xc0) === 0x80) {
            this.my_delta += my_delta;
            if (this.my_delta < -127) {
                this.my_delta = -127;
            }
            if (this.my_delta > 127) {
                this.my_delta = 127;
            }
        }
    }

    colorbus_button_input(switch1_pressed: boolean, switch2_pressed: boolean) {
        // save button state
        this.button_state = (switch2_pressed ? 0x80 : 0x00) | (switch1_pressed ? 0x40 : 0x00);
    }


    /***************************************************************************

     Palette functions

     ***************************************************************************/

    /*
    About the colour burst registers:

    The color burst registers will only have effect on the composite video output from
    the V9938. but the output is only NTSC (Never The Same Color ,so the
    effects are already present) . this system is not used in europe
    the european machines use a separate PAL  (Phase Alternating Line) encoder
    or no encoder at all , only RGB output.

    Erik de Boer.

    --
    Right now they're not emulated. For completeness sake, they should -- with
    a dip-switch to turn them off. I really don't know how they work though. :(
    */

    /*
    In screen 8, the colors are encoded as:

    7  6  5  4  3  2  1  0
    +--+--+--+--+--+--+--+--+
    |g2|g1|g0|r2|r1|r0|b2|b1|
    +--+--+--+--+--+--+--+--+

    b0 is set if b2 and b1 are set (remember, color bus is 3 bits)

    */

    // void v9938_device::palette_init()
    // {
    // }

    private uint32_t(color: Color) {
        return color.rgba;
    }

    private pal5bit(c: number) {
        return Math.round(c * 255 / 31);
    }

    private pal3bit(c: number) {
        return Math.round(c * 255 / 7);
    }

    private pen_color(index: number) {
        return this.palette[index];
    }

    private set_pen_color(index: number, color: Color) {
        this.palette[index] = color;
    }

    private pen16(index: int): pen_t {
        return this.uint32_t(this.pen_color(index));
    }

    private pen256(index: int): pen_t {
        return this.uint32_t(this.pen_color(index + 16));
    }

    private set_pen16(index: int, pen: pen_t) {
        this.set_pen_color(index, new Color().set_rgb(pen));
    }

    private set_pen256(index: int, pen: pen_t) {
        this.set_pen_color(index + 16, new Color().set_rgb(pen));
    }

    reset_palette() {
        // taken from V9938 Technical Data book, page 148. it's in G-R-B format
        const pal16 = [
            0, 0, 0, // 0: black/transparent
            0, 0, 0, // 1: black
            6, 1, 1, // 2: medium green
            7, 3, 3, // 3: light green
            1, 1, 7, // 4: dark blue
            3, 2, 7, // 5: light blue
            1, 5, 1, // 6: dark red
            6, 2, 7, // 7: cyan
            1, 7, 1, // 8: medium red
            3, 7, 3, // 9: light red
            6, 6, 1, // 10: dark yellow
            6, 6, 4, // 11: light yellow
            4, 1, 1, // 12: dark green
            2, 6, 5, // 13: magenta
            5, 5, 5, // 14: gray
            7, 7, 7  // 15: white
        ];
        let i: int;
        let red: int;

        for (i = 0; i < 16; i++) {
            // set the palette registers
            this.pal_reg[i * 2] = pal16[i * 3 + 1] << 4 | pal16[i * 3 + 2];
            this.pal_reg[i * 2 + 1] = pal16[i * 3];
            // set the reference table
            this.set_pen16(i, this.uint32_t(new Color(this.pal3bit(pal16[i * 3 + 1]), this.pal3bit(pal16[i * 3]), this.pal3bit(pal16[i * 3 + 2]))));
        }

        // set internal palette GRAPHIC 7
        for (i = 0; i < 256; i++) {
            red = (i << 1) & 6;
            if (red === 6) {
                red++;
            }
            this.set_pen256(i, this.uint32_t(new Color(this.pal3bit((i & 0x1c) >> 2), this.pal3bit((i & 0xe0) >> 5), this.pal3bit(red))));
        }
    }

    /*

    The v9958 can display up to 19286 colours. For this we need a larger palette.

    The colours are encoded in 17 bits; however there are just 19268 different colours.
    Here we calculate the palette and a 2^17 reference table to the palette,
    which is: s_pal_indYJK. It's 256K in size, but I can't think of a faster way
    to emulate this. Also, it keeps the palette a reasonable size. :)

    */

    palette_init() {

        let r: int, g: int, b: int, y: int, j: int, k: int, k0: int, j0: int;

        // set up YJK table
        V9938.LOGMASKED(V9938.LOG_DETAIL, "Building YJK table for V9958 screens, may take a while ... \n");

        for (y = 0; y < 32; y++) {
            for (k = 0; k < 64; k++) {
                for (j = 0; j < 64; j++) {
                    // calculate the color
                    if (k >= 32) {
                        k0 = (k - 64);
                    } else {
                        k0 = k;
                    }
                    if (j >= 32) {
                        j0 = (j - 64);
                    } else {
                        j0 = j;
                    }
                    r = y + j0;
                    b = (y * 5 - 2 * j0 - k0) / 4;
                    g = y + k0;
                    if (r < 0) {
                        r = 0;
                    } else if (r > 31) {
                        r = 31;
                    }
                    if (g < 0) {
                        g = 0;
                    } else if (g > 31) {
                        g = 31;
                    }
                    if (b < 0) {
                        b = 0;
                    } else if (b > 31) {
                        b = 31;
                    }

                    this.s_pal_indYJK[y | j << 5 | k << (5 + 6)] = this.uint32_t(new Color(this.pal5bit(r), this.pal5bit(g), this.pal5bit(b)));
                }
            }
        }
    }

    read(offset: offs_t): uint8_t {
        switch (offset & 3) {
            case 0:
                return this.vram_r();
            case 1:
                return this.status_r();
        }
        return 0xff;
    }

    write(offset: offs_t, data: uint8_t) {
        switch (offset & 3) {
            case 0:
                this.vram_w(data);
                break;
            case 1:
                this.command_w(data);
                break;
            case 2:
                this.palette_w(data);
                break;
            case 3:
                this.register_w(data);
                break;
        }
    }

    vram_r(): uint8_t {
        let ret: uint8_t;
        let address: int;

        address = (this.cont_reg[14] << 14) | this.address_latch;

        this.cmd_write_first = 0;

        ret = this.read_ahead;

        if (this.cont_reg[45] & 0x40) { // Expansion memory
            if ((this.mode === V9938.MODE_GRAPHIC6) || (this.mode === V9938.MODE_GRAPHIC7)) {
                address >>= 1; // correct?
            }
            // Expansion memory only offers 64 K
            if (this.vram_size > 0x20000 && ((address & 0x10000) === 0)) {
                this.read_ahead = this.vram_space[address + V9938.EXPMEM_OFFSET];
            } else {
                this.read_ahead = 0xff;
            }
        } else {
            this.read_ahead = this.vram_read(address);
        }

        this.address_latch = (this.address_latch + 1) & 0x3fff;
        if ((!this.address_latch) && (this.cont_reg[0] & 0x0c)) { // correct ???
            this.cont_reg[14] = (this.cont_reg[14] + 1) & 7;
        }

        return ret;
    }

    status_r(): uint8_t {
        let reg: int;
        let ret: uint8_t;

        this.cmd_write_first = 0;

        reg = this.cont_reg[15] & 0x0f;
        if (reg > 9) {
            return 0xff;
        }

        switch (reg) {
            case 0:
                ret = this.stat_reg[0];
                this.stat_reg[0] &= 0x1f;
                this.console.getCRU().setVDPInterrupt(false);
                break;
            case 1:
                ret = this.stat_reg[1];
                this.stat_reg[1] &= 0xfe;
                // mouse mode: add button state
                if ((this.cont_reg[8] & 0xc0) === 0x80) {
                    ret |= this.button_state & 0xc0;
                }
                break;
            case 2:
                /*update_command ();*/
                /*
                WTF is this? Whatever this was intended to do, it is nonsensical.
                Might as well pick a random number....
                This was an attempt to emulate H-Blank flag ;)
                n = cycles_currently_ran ();
                if ( (n < 28) || (n > 199) ) vdp.statReg[2] |= 0x20;
                else vdp.statReg[2] &= ~0x20;
                */
                if (Math.random() * 2 & 1) {
                    this.stat_reg[2] |= 0x20;
                } else {
                    this.stat_reg[2] &= ~0x20;
                }
                ret = this.stat_reg[2];
                break;
            case 3:
                if ((this.cont_reg[8] & 0xc0) === 0x80) {   // mouse mode: return x mouse delta
                    ret = this.mx_delta;
                    this.mx_delta = 0;
                } else {
                    ret = this.stat_reg[3];
                }
                break;
            case 5:
                if ((this.cont_reg[8] & 0xc0) === 0x80) {   // mouse mode: return y mouse delta
                    ret = this.my_delta;
                    this.my_delta = 0;
                } else {
                    ret = this.stat_reg[5];
                }
                break;
            case 7:
                ret = this.stat_reg[7];
                this.stat_reg[7] = this.cont_reg[44] = this.vdp_to_cpu();
                break;
            default:
                ret = this.stat_reg[reg];
                break;
        }

        V9938.LOGMASKED(V9938.LOG_STATUS, "Read %02x from S#%d\n", ret, reg);
        this.check_int();

        return ret;
    }

    palette_w(data: uint8_t) {
        let indexp: int;

        if (this.pal_write_first) {
            // store in register
            indexp = this.cont_reg[0x10] & 15;
            this.pal_reg[indexp * 2] = this.pal_write & 0x77;
            this.pal_reg[indexp * 2 + 1] = data & 0x07;

            // update palette
            this.set_pen16(indexp, this.uint32_t(new Color(this.pal3bit((this.pal_write & 0x70) >> 4), this.pal3bit(data & 0x07), this.pal3bit(this.pal_write & 0x07))));

            this.cont_reg[0x10] = (this.cont_reg[0x10] + 1) & 15;
            this.pal_write_first = 0;
        } else {
            this.pal_write = data;
            this.pal_write_first = 1;
        }
    }

    vram_w(data: uint8_t) {
        let address: int;

        /*update_command ();*/

        this.cmd_write_first = 0;

        address = (this.cont_reg[14] << 14) | this.address_latch;

        if (this.cont_reg[45] & 0x40) {
            if ((this.mode === V9938.MODE_GRAPHIC6) || (this.mode === V9938.MODE_GRAPHIC7)) {
                address >>= 1; // correct?
            }
            if (this.vram_size > 0x20000 && ((address & 0x10000) === 0)) {
                this.vram_space[V9938.EXPMEM_OFFSET + address] = data;
            }
        } else {
            this.vram_write(address, data);
        }

        this.address_latch = (this.address_latch + 1) & 0x3fff;
        if ((!this.address_latch) && (this.cont_reg[0] & 0x0c)) { // correct ???
            this.cont_reg[14] = (this.cont_reg[14] + 1) & 7;
        }
    }

    command_w(data: uint8_t) {
        if (this.cmd_write_first) {
            if (data & 0x80) {
                if (!(data & 0x40)) {
                    this.register_write(data & 0x3f, this.cmd_write);
                }
            } else {
                this.address_latch =
                    ((data << 8) | this.cmd_write) & 0x3fff;
                if (!(data & 0x40)) {
                    this.vram_r();
                } // read ahead!
            }

            this.cmd_write_first = 0;
        } else {
            this.cmd_write = data;
            this.cmd_write_first = 1;
        }
    }

    register_w(data: uint8_t) {
        let reg: int;

        reg = this.cont_reg[17] & 0x3f;

        if (reg !== 17) {
            this.register_write(reg, data);
        } // true ?

        if (!(this.cont_reg[17] & 0x80)) {
            this.cont_reg[17] = (this.cont_reg[17] + 1) & 0x3f;
        }
    }

    /***************************************************************************

     Init/stop/reset/Interrupt functions

     ***************************************************************************/

    device_start() {
        this.vdp_ops_count = 1;
        this.vdp_engine = undefined;

        // screen().register_screen_bitmap(this.bitmap);

        // Video RAM is allocated as an own address space
        this.vram_size = 0x30000;
        this.vram_space = new Uint8Array(this.vram_size);


        // allocate VRAM
        // assert(this.vram_size > 0);

        if (this.vram_size < 0x20000) {
            // set unavailable RAM to 0xff
            for (let addr = this.vram_size; addr < 0x30000; addr++) {
                this.vram_space[addr] = 0xff;
            }
        }

        // this.line_timer = timer_alloc(FUNC(update_line), this);

        this.palette_init();

        // save_item(NAME(this.offset_x));
        // save_item(NAME(this.offset_y));
        // save_item(NAME(this.visible_y));
        // save_item(NAME(this.mode));
        // save_item(NAME(this.pal_write_first));
        // save_item(NAME(this.cmd_write_first));
        // save_item(NAME(this.pal_write));
        // save_item(NAME(this.cmd_write));
        // save_item(NAME(this.pal_reg));
        // save_item(NAME(this.stat_reg));
        // save_item(NAME(this.cont_reg));
        // save_item(NAME(this.read_ahead));
        // save_item(NAME(this.v9958_sp_mode));
        // save_item(NAME(this.address_latch));
        // save_item(NAME(this.int_state));
        // save_item(NAME(this.scanline));
        // save_item(NAME(this.blink));
        // save_item(NAME(this.blink_count));
        // save_item(NAME(this.mx_delta));
        // save_item(NAME(this.my_delta));
        // save_item(NAME(this.button_state));
        // save_item(NAME(this.mmc.SX));
        // save_item(NAME(this.mmc.SY));
        // save_item(NAME(this.mmc.DX));
        // save_item(NAME(this.mmc.DY));
        // save_item(NAME(this.mmc.TX));
        // save_item(NAME(this.mmc.TY));
        // save_item(NAME(this.mmc.NX));
        // save_item(NAME(this.mmc.NY));
        // save_item(NAME(this.mmc.MX));
        // save_item(NAME(this.mmc.ASX));
        // save_item(NAME(this.mmc.ADX));
        // save_item(NAME(this.mmc.ANX));
        // save_item(NAME(this.mmc.CL));
        // save_item(NAME(this.mmc.LO));
        // save_item(NAME(this.mmc.CM));
        // save_item(NAME(this.mmc.MXS));
        // save_item(NAME(this.mmc.MXD));
        // save_item(NAME(this.vdp_ops_count));
        // save_item(NAME(this.pal_ntsc));
        // save_item(NAME(this.scanline_start));
        // save_item(NAME(this.vblank_start));
        // save_item(NAME(this.scanline_max));
        // save_item(NAME(this.height));
    }

    device_reset() {
        let i: int;

        // offset reset
        this.offset_x = 8;
        this.offset_y = 0;
        this.visible_y = 192;
        // register reset
        this.reset_palette(); // palette registers
        for (i = 0; i < 10; i++) {
            this.stat_reg[i] = 0;
        }
        this.stat_reg[2] = 0x0c;
        if (this.model === V9938.MODEL_V9958) {
            this.stat_reg[1] |= 4;
        }
        for (i = 0; i < 48; i++) {
            this.cont_reg[i] = 0;
        }
        this.cmd_write_first = this.pal_write_first = 0;
        this.int_state = 0;
        this.read_ahead = 0;
        this.address_latch = 0; // ???
        // FIXME: this drifts the scanline number wrt screen h/vpos
        this.scanline = 0;
        // MZ: The status registers 4 and 6 hold the high bits of the sprite
        // collision location. The unused bits are set to 1.
        // SR3: x x x x x x x x
        // SR4: 1 1 1 1 1 1 1 x
        // SR5: y y y y y y y y
        // SR6: 1 1 1 1 1 1 y y
        // Note that status register 4 is used in detection algorithms to tell
        // apart the tms9929 from the v99x8.

        // TODO: SR3-S6 do not yet store the information about the sprite collision
        this.stat_reg[4] = 0xfe;
        this.stat_reg[6] = 0xfc;

        // Start the timer
        // m_line_timer->adjust(attotime::from_ticks(HTOTAL*2, m_clock), 0, attotime::from_ticks(HTOTAL*2, m_clock));

        this.configure_pal_ntsc();
        this.set_screen_parameters();
    }

    /***************************************************************************

     Memory functions

     ***************************************************************************/

    vram_write(offset: int, data: int) {
        let newoffset: int;

        if ((this.mode === V9938.MODE_GRAPHIC6) || (this.mode === V9938.MODE_GRAPHIC7)) {
            newoffset = ((offset & 1) << 16) | (offset >> 1);
            if (newoffset < this.vram_size) {
                this.vram_space[newoffset] = data;
            }
        } else {
            if (offset < this.vram_size) {
                this.vram_space[offset] = data;
            }
        }
    }

    vram_read(offset: int): int {
        if ((this.mode === V9938.MODE_GRAPHIC6) || (this.mode === V9938.MODE_GRAPHIC7)) {
            return this.vram_space[((offset & 1) << 16) | (offset >> 1)];
        } else {
            return this.vram_space[offset];
        }
    }

    check_int() {
        let n: uint8_t;

        n = ((this.cont_reg[1] & 0x20) && (this.stat_reg[0] & 0x80) /*&& this.vblank_int*/) ||
            ((this.stat_reg[1] & 0x01) && (this.cont_reg[0] & 0x10));

        // #if 0
        // if(n && this.vblank_int)
        // {
        //     this.vblank_int = 0;
        // }
        // #endif

        if (n !== this.int_state) {
            this.int_state = n;
            V9938.LOGMASKED(V9938.LOG_INT, "IRQ line %s\n", n ? "up" : "down");
        }

        /*
        ** Somehow the IRQ request is going down without cpu_irq_line () being
        ** called; because of this Mr. Ghost, Xevious and SD Snatcher don't
        ** run. As a patch it's called every scanline
        */
        // FIXME: breaks nichibutsu hrdvd.cpp & nichild.cpp, really needs INPUT_MERGER instead.
        // this.int_callback(n);
    }

    /***************************************************************************

     Register functions

     ***************************************************************************/

    register_write(reg: int, data: int) {

        const reg_mask = [
            0x7e, 0x7b, 0x7f, 0xff, 0x3f, 0xff, 0x3f, 0xff,
            0xfb, 0xbf, 0x07, 0x03, 0xff, 0xff, 0x07, 0x0f,
            0x0f, 0xbf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
            0x00, 0x7f, 0x3f, 0x07
        ];

        if (reg <= 27) {
            data &= reg_mask[reg];
            if (this.cont_reg[reg] === data) {
                return;
            }
        }

        if (reg > 46) {
            V9938.LOGMASKED(V9938.LOG_WARN, "Attempted to write to non-existent R#%d\n", reg);
            return;
        }

        /*update_command ();*/

        switch (reg) {
            // registers that affect interrupt and display mode
            case 0:
            case 1:
                this.cont_reg[reg] = data;
                this.set_mode();
                this.check_int();
                V9938.LOGMASKED(V9938.LOG_MODE, "Mode = %s", V9938.v9938_modes[this.mode]);
                break;

            case 18:
            case 9:
                this.cont_reg[reg] = data;
                // recalc offset
                this.offset_x = 8 + this.position_offset(this.cont_reg[18] & 0x0f);
                // Y offset is only applied once per frame?
                break;

            case 15:
                this.pal_write_first = 0;
                break;

            // color burst registers aren't emulated
            case 20:
            case 21:
            case 22:
                V9938.LOGMASKED(V9938.LOG_NOTIMP, "Write %02xh to R#%d; color burst not emulated\n", data, reg);
                break;
            case 25:
            case 26:
            case 27:
                if (this.model !== V9938.MODEL_V9958) {
                    V9938.LOGMASKED(V9938.LOG_WARN, "Attempting to write %02xh to R#%d (invalid on v9938)\n", data, reg);
                    data = 0;
                } else {
                    if (reg === 25) {
                        this.v9958_sp_mode = data & 0x18;
                    }
                }
                break;

            case 44:
                this.cpu_to_vdp(data);
                break;

            case 46:
                this.command_unit_w(data);
                break;
        }

        if (reg !== 15) {
            V9938.LOGMASKED(V9938.LOG_REGWRITE, "Write %02x to R#%d\n", data, reg);
        }

        this.cont_reg[reg] = data;
    }

    /***************************************************************************

     Refresh / render function

     ***************************************************************************/

    v9938_second_field(): boolean {
        return !(((this.cont_reg[9] & 0x04) && !(this.stat_reg[2] & 2)) || this.blink);
    }

    default_border(ln: uint32_t[]) {
        let idx = 0;
        let pen: pen_t;
        let i: int;

        pen = this.pen16(this.cont_reg[7] & 0x0f);
        i = V9938.V9938_LONG_WIDTH;
        while (i--) {
            ln[idx++] = pen;
        }
    }

    graphic7_border(ln: uint32_t[]) {
        let idx = 0;
        let pen: pen_t;
        let i: int;

        pen = this.pen256(this.cont_reg[7]);
        i = V9938.V9938_LONG_WIDTH;
        while (i--) {
            ln[idx++] = pen;
        }
    }

    graphic5_border(ln: uint32_t[]) {
        let idx = 0;
        let i: int;
        let pen0: pen_t;
        let pen1: pen_t;

        pen1 = this.pen16(this.cont_reg[7] & 0x03);
        pen0 = this.pen16((this.cont_reg[7] >> 2) & 0x03);
        i = V9938.V9938_LONG_WIDTH / 2;
        while (i--) {
            ln[idx++] = pen0;
            ln[idx++] = pen1;
        }
    }

    mode_text1(ln: uint32_t[], line: int) {
        let idx = 0;
        let pattern: int;
        let x: int;
        let xx: int;
        let name: int;
        let xxx: int;
        let fg: pen_t;
        let bg: pen_t;
        let pen: pen_t;
        let nametbl_addr: int;
        let patterntbl_addr: int;

        patterntbl_addr = this.cont_reg[4] << 11;
        nametbl_addr = this.cont_reg[2] << 10;

        fg = this.pen16(this.cont_reg[7] >> 4);
        bg = this.pen16(this.cont_reg[7] & 15);

        name = (line >> 3) * 40;

        pen = this.pen16(this.cont_reg[7] & 0x0f);

        xxx = (this.offset_x + 8) << 1;
        while (xxx--) {
            ln[idx++] = pen;
        }

        for (x = 0; x < 40; x++) {
            pattern = this.vram_space[patterntbl_addr + (this.vram_space[nametbl_addr + name] << 3) +
            ((line + this.cont_reg[23]) & 7)];
            for (xx = 0; xx < 6; xx++) {
                ln[idx++] = (pattern & 0x80) ? fg : bg;
                ln[idx++] = (pattern & 0x80) ? fg : bg;
                pattern <<= 1;
            }
            /* width height 212, characters start repeating at the bottom */
            name = (name + 1) & 0x3ff;
        }

        xxx = ((16 - this.offset_x) + 8) << 1;
        while (xxx--) {
            ln[idx++] = pen;
        }
    }

    mode_text2(ln: uint32_t[], line: int) {
        let idx = 0;
        let pattern: int;
        let x: int;
        let charcode: int;
        let name: int;
        let xxx: int;
        let patternmask: int;
        let colourmask: int;
        let fg: pen_t;
        let bg: pen_t;
        let fg0: pen_t;
        let bg0: pen_t;
        let pen: pen_t;
        let nametbl_addr: int;
        let patterntbl_addr: int;
        let colourtbl_addr: int;

        patterntbl_addr = this.cont_reg[4] << 11;
        colourtbl_addr = ((this.cont_reg[3] & 0xf8) << 6) + (this.cont_reg[10] << 14);
        // colourmask = ((this.cont_reg[3] & 7) << 5) | 0x1f; /* cause a bug in Forth+ v1.0 on Geneve */
        colourmask = ((this.cont_reg[3] & 7) << 6) | 0x3f; /* verify! */
        nametbl_addr = ((this.cont_reg[2] & 0xfc) << 10);
        patternmask = ((this.cont_reg[2] & 3) << 10) | 0x3ff; /* seems correct */

        fg = this.pen16(this.cont_reg[7] >> 4);
        bg = this.pen16(this.cont_reg[7] & 15);
        fg0 = this.pen16(this.cont_reg[12] >> 4);
        bg0 = this.pen16(this.cont_reg[12] & 15);

        name = (line >> 3) * 80;

        xxx = (this.offset_x + 8) * 2;
        pen = this.pen16(this.cont_reg[7] & 0x0f);
        while (xxx--) {
            ln[idx++] = pen;
        }

        for (x = 0; x < 80; x++) {
            charcode = this.vram_space[nametbl_addr + (name & patternmask)];
            if (this.blink) {
                pattern = this.vram_space[colourtbl_addr + ((name >> 3) & colourmask)];
                if (pattern & (0x80 >> (name & 7))) {
                    pattern = this.vram_space[patterntbl_addr + ((charcode << 3) +
                        ((line + this.cont_reg[23]) & 7))];

                    ln[idx++] = (pattern & 0x80) ? fg0 : bg0;
                    ln[idx++] = (pattern & 0x40) ? fg0 : bg0;
                    ln[idx++] = (pattern & 0x20) ? fg0 : bg0;
                    ln[idx++] = (pattern & 0x10) ? fg0 : bg0;
                    ln[idx++] = (pattern & 0x08) ? fg0 : bg0;
                    ln[idx++] = (pattern & 0x04) ? fg0 : bg0;

                    name++;
                    continue;
                }
            }

            pattern = this.vram_space[patterntbl_addr + ((charcode << 3) +
                ((line + this.cont_reg[23]) & 7))];

            ln[idx++] = (pattern & 0x80) ? fg : bg;
            ln[idx++] = (pattern & 0x40) ? fg : bg;
            ln[idx++] = (pattern & 0x20) ? fg : bg;
            ln[idx++] = (pattern & 0x10) ? fg : bg;
            ln[idx++] = (pattern & 0x08) ? fg : bg;
            ln[idx++] = (pattern & 0x04) ? fg : bg;

            name++;
        }

        xxx = (16 - this.offset_x + 8) * 2;
        while (xxx--) {
            ln[idx++] = pen;
        }
    }

    mode_multi(ln: uint32_t[], line: int) {
        let idx = 0;
        let nametbl_addr: int;
        let patterntbl_addr: int;
        let colour: int;
        let name: int;
        let line2: int;
        let x: int;
        let xx: int;
        let pen: pen_t;
        let pen_bg: pen_t;

        nametbl_addr = (this.cont_reg[2] << 10);
        patterntbl_addr = (this.cont_reg[4] << 11);

        line2 = (line - this.cont_reg[23]) & 255;
        name = (line2 >> 3) << 5;

        pen_bg = this.pen16(this.cont_reg[7] & 0x0f);
        xx = this.offset_x << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }

        for (x = 0; x < 32; x++) {
            colour = this.vram_space[patterntbl_addr + (this.vram_space[nametbl_addr + name] << 3) + ((line2 / 4) & 7)];
            pen = this.pen16(colour >> 4);
            /* eight pixels */
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            pen = this.pen16(colour & 15);
            /* eight pixels */
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            ln[idx++] = pen;
            name++;
        }

        xx = (16 - this.offset_x) << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }
    }

    mode_graphic1(ln: uint32_t[], line: int) {
        let idx = 0;
        let fg: pen_t;
        let bg: pen_t;
        let pen: pen_t;
        let nametbl_addr: int;
        let patterntbl_addr: int;
        let colourtbl_addr: int;
        let pattern: int;
        let x: int;
        let xx: int;
        let line2: int;
        let name: int;
        let charcode: int;
        let colour: int;
        let xxx: int;

        nametbl_addr = (this.cont_reg[2] << 10);
        colourtbl_addr = (this.cont_reg[3] << 6) + (this.cont_reg[10] << 14);
        patterntbl_addr = (this.cont_reg[4] << 11);

        line2 = (line - this.cont_reg[23]) & 255;

        name = (line2 >> 3) << 5;

        pen = this.pen16(this.cont_reg[7] & 0x0f);
        xxx = this.offset_x << 1;
        while (xxx--) {
            ln[idx++] = pen;
        }

        for (x = 0; x < 32; x++) {
            charcode = this.vram_space[nametbl_addr + name];
            colour = this.vram_space[colourtbl_addr + (charcode >> 3)];
            fg = this.pen16(colour >> 4);
            bg = this.pen16(colour & 15);
            pattern = this.vram_space[patterntbl_addr + ((charcode << 3) + (line2 & 7))];

            for (xx = 0; xx < 8; xx++) {
                ln[idx++] = (pattern & 0x80) ? fg : bg;
                ln[idx++] = (pattern & 0x80) ? fg : bg;
                pattern <<= 1;
            }
            name++;
        }

        xx = (16 - this.offset_x) << 1;
        while (xx--) {
            ln[idx++] = pen;
        }
    }

    mode_graphic23(ln: uint32_t[], line: int) {
        let idx = 0;
        const colourmask = ((this.cont_reg[3] & 0x7f) << 3) | 7;
        const patternmask = ((this.cont_reg[4] & 0x03) << 8) | 0xff;
        const scrolled_y = (line + this.cont_reg[23]) & 0xff;
        const colourtbl_addr = ((this.cont_reg[3] & 0x80) << 6) + (this.cont_reg[10] << 14);
        const patterntbl_addr = ((this.cont_reg[4] & 0x3c) << 11);
        const border_pen: pen_t = this.pen16(this.cont_reg[7] & 0x0f);

        let nametbl_base: int = (this.cont_reg[2] << 10) + ((scrolled_y >> 3) << 5);
        let nametbl_offset: int = (this.cont_reg[26] & 0x1f);

        if (V9938.BIT(this.cont_reg[25], 0) && V9938.BIT(this.cont_reg[26], 5)) {
            nametbl_base ^= 0x8000;
        }

        for (let x = this.offset_x << 1; x > 0; x--) {
            ln[idx++] = border_pen;
        }

        let dot_scroll: int = this.cont_reg[27] & 0x07;
        let pixels_to_mask: int = V9938.BIT(this.cont_reg[25], 1) ? 8 - dot_scroll : 0;
        let pixels_to_draw: int = 256 - dot_scroll;
        while (dot_scroll--) {
            ln[idx++] = border_pen;
            ln[idx++] = border_pen;
        }

        do {
            const charcode = this.vram_space[nametbl_base + nametbl_offset] + ((scrolled_y & 0xc0) << 2);
            const colour: u8 = this.vram_space[colourtbl_addr + ((charcode & colourmask) << 3) + (scrolled_y & 7)];
            let pattern: u8 = this.vram_space[patterntbl_addr + ((charcode & patternmask) << 3) + (scrolled_y & 7)];
            const fg: pen_t = this.pen16(colour >> 4);
            const bg: pen_t = this.pen16(colour & 0x0f);
            for (let x = 0; x < 8 && pixels_to_draw > 0; x++) {
                if (!pixels_to_mask) {
                    ln[idx++] = (pattern & 0x80) ? fg : bg;
                    ln[idx++] = (pattern & 0x80) ? fg : bg;
                } else {
                    pixels_to_mask--;
                    ln[idx++] = border_pen;
                    ln[idx++] = border_pen;
                }
                pixels_to_draw--;
                pattern <<= 1;
            }
            nametbl_offset = (nametbl_offset + 1) & 0x1f;
            if (V9938.BIT(this.cont_reg[25], 0) && !nametbl_offset) {
                nametbl_base ^= 0x8000;
            }
        }
        while (pixels_to_draw > 0);

        for (let x = (16 - this.offset_x) << 1; x > 0; x--) {
            ln[idx++] = border_pen;
        }
    }

    mode_graphic4(ln: uint32_t[], line: int) {
        let idx = 0;
        const linemask: int = ((this.cont_reg[2] & 0x1f) << 3) | 7;
        const scrolled_y = ((line + this.cont_reg[23]) & linemask) & 0xff;
        const border_pen: pen_t = this.pen16(this.cont_reg[7] & 0x0f);

        let nametbl_base: int = ((this.cont_reg[2] & 0x40) << 10) + (scrolled_y << 7);
        let nametbl_offset: int = (this.cont_reg[26] & 0x1f) << 2;
        if (!V9938.BIT(this.cont_reg[25], 0) && V9938.BIT(this.cont_reg[2], 5) && this.v9938_second_field()) {
            nametbl_base += 0x8000;
        }
        if (V9938.BIT(this.cont_reg[25], 0) && V9938.BIT(this.cont_reg[26], 5)) {
            nametbl_base ^= 0x8000;
        }

        for (let x = this.offset_x << 1; x > 0; x--) {
            ln[idx++] = border_pen;
        }

        let dot_scroll: int = this.cont_reg[27] & 0x07;
        let pixels_to_mask: int = V9938.BIT(this.cont_reg[25], 1) ? 8 - dot_scroll : 0;
        let pixels_to_draw: int = 256 - dot_scroll;
        while (dot_scroll--) {
            ln[idx++] = border_pen;
            ln[idx++] = border_pen;
        }

        do {
            let mask_pixel_1 = false;
            let mask_pixel_2 = false;
            if (pixels_to_mask) {
                mask_pixel_1 = true;
                pixels_to_mask--;
                if (pixels_to_mask) {
                    mask_pixel_2 = true;
                    pixels_to_mask--;
                }
            }
            const colour: u8 = this.vram_space[nametbl_base + nametbl_offset];
            const pen1: pen_t = mask_pixel_1 ? border_pen : this.pen16(colour >> 4);
            const pen2: pen_t = mask_pixel_2 ? border_pen : this.pen16(colour & 0x0f);
            ln[idx++] = pen1;
            ln[idx++] = pen1;
            pixels_to_draw--;
            if (pixels_to_draw) {
                ln[idx++] = pen2;
                ln[idx++] = pen2;
                pixels_to_draw--;
            }
            nametbl_offset = (nametbl_offset + 1) & 0x7f;
            if (V9938.BIT(this.cont_reg[25], 0) && !nametbl_offset) {
                nametbl_base ^= 0x8000;
            }
        }
        while (pixels_to_draw > 0);

        for (let x = (16 - this.offset_x) << 1; x > 0; x--) {
            ln[idx++] = border_pen;
        }
    }

    mode_graphic5(ln: uint32_t[], line: int) {
        let idx = 0;
        let nametbl_addr: int;
        let colour: int;
        let line2: int;
        let linemask: int;
        let x: int;
        let xx: int;
        const pen_bg0: pen_t[] = [];
        const pen_bg1: pen_t[] = [];

        linemask = ((this.cont_reg[2] & 0x1f) << 3) | 7;

        line2 = ((line + this.cont_reg[23]) & linemask) & 255;

        nametbl_addr = ((this.cont_reg[2] & 0x40) << 10) + (line2 << 7);
        if ((this.cont_reg[2] & 0x20) && this.v9938_second_field()) {
            nametbl_addr += 0x8000;
        }

        pen_bg1[0] = this.pen16(this.cont_reg[7] & 0x03);
        pen_bg0[0] = this.pen16((this.cont_reg[7] >> 2) & 0x03);

        xx = this.offset_x;
        while (xx--) {
            ln[idx++] = pen_bg0[0];
            ln[idx++] = pen_bg1[0];
        }

        x = (this.cont_reg[8] & 0x20) ? 0 : 1;

        for (; x < 4; x++) {
            pen_bg0[x] = this.pen16(x);
            pen_bg1[x] = this.pen16(x);
        }

        for (x = 0; x < 128; x++) {
            colour = this.vram_space[nametbl_addr++];

            ln[idx++] = pen_bg0[colour >> 6];
            ln[idx++] = pen_bg1[(colour >> 4) & 3];
            ln[idx++] = pen_bg0[(colour >> 2) & 3];
            ln[idx++] = pen_bg1[(colour & 3)];
        }

        pen_bg1[0] = this.pen16(this.cont_reg[7] & 0x03);
        pen_bg0[0] = this.pen16((this.cont_reg[7] >> 2) & 0x03);
        xx = 16 - this.offset_x;
        while (xx--) {
            ln[idx++] = pen_bg0[0];
            ln[idx++] = pen_bg1[0];
        }
    }

    mode_graphic6(ln: uint32_t[], line: int) {
        let idx = 0;
        let colour: uint8_t;
        let line2: int;
        let linemask: int;
        let x: int;
        let xx: int;
        let nametbl_addr: int;
        let pen_bg: pen_t;
        let fg0: pen_t;
        let fg1: pen_t;

        linemask = ((this.cont_reg[2] & 0x1f) << 3) | 7;

        line2 = ((line + this.cont_reg[23]) & linemask) & 255;

        nametbl_addr = line2 << 8;
        if ((this.cont_reg[2] & 0x20) && this.v9938_second_field()) {
            nametbl_addr += 0x10000;
        }

        pen_bg = this.pen16(this.cont_reg[7] & 0x0f);
        xx = this.offset_x << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }

        if (this.cont_reg[2] & 0x40) {
            for (x = 0; x < 32; x++) {
                nametbl_addr++;
                colour = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                fg0 = this.pen16(colour >> 4);
                fg1 = this.pen16(colour & 15);
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                ln[idx++] = fg0;
                ln[idx++] = fg1;
                nametbl_addr += 7;
            }
        } else {
            for (x = 0; x < 256; x++) {
                colour = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                ln[idx++] = this.pen16(colour >> 4);
                ln[idx++] = this.pen16(colour & 15);
                nametbl_addr++;
            }
        }

        xx = (16 - this.offset_x) << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }
    }

    mode_graphic7(ln: uint32_t[], line: int) {
        let idx = 0;
        let colour: uint8_t;
        let line2: int;
        let linemask: int;
        let x: int;
        let xx: int;
        let nametbl_addr: int;
        let pen: pen_t;
        let pen_bg: pen_t;

        linemask = ((this.cont_reg[2] & 0x1f) << 3) | 7;

        line2 = ((line + this.cont_reg[23]) & linemask) & 255;

        nametbl_addr = line2 << 8;
        if ((this.cont_reg[2] & 0x20) && this.v9938_second_field()) {
            nametbl_addr += 0x10000;
        }

        pen_bg = this.pen256(this.cont_reg[7]);
        xx = this.offset_x << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }

        if ((this.v9958_sp_mode & 0x18) === 0x08) {
            // v9958 screen 12, puzzle star title screen
            for (x = 0; x < 64; x++) {
                const colour: int[] = [];
                let ind: int;

                colour[0] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[1] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[2] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[3] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];

                ind = (colour[0] & 7) << 11 | (colour[1] & 7) << 14 |
                    (colour[2] & 7) << 5 | (colour[3] & 7) << 8;

                ln[idx++] = this.s_pal_indYJK[ind | ((colour[0] >> 3) & 31)];
                ln[idx++] = this.s_pal_indYJK[ind | ((colour[0] >> 3) & 31)];

                ln[idx++] = this.s_pal_indYJK[ind | ((colour[1] >> 3) & 31)];
                ln[idx++] = this.s_pal_indYJK[ind | ((colour[1] >> 3) & 31)];

                ln[idx++] = this.s_pal_indYJK[ind | ((colour[2] >> 3) & 31)];
                ln[idx++] = this.s_pal_indYJK[ind | ((colour[2] >> 3) & 31)];

                ln[idx++] = this.s_pal_indYJK[ind | ((colour[3] >> 3) & 31)];
                ln[idx++] = this.s_pal_indYJK[ind | ((colour[3] >> 3) & 31)];

                nametbl_addr++;
            }
        } else if ((this.v9958_sp_mode & 0x18) === 0x18) {
            // v9958 screen 10/11, puzzle star & sexy boom gameplay
            for (x = 0; x < 64; x++) {
                const colour: int[] = [];
                let ind: int;

                colour[0] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[1] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[2] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                nametbl_addr++;
                colour[3] = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];

                ind = (colour[0] & 7) << 11 | (colour[1] & 7) << 14 |
                    (colour[2] & 7) << 5 | (colour[3] & 7) << 8;

                ln[idx++] = colour[0] & 8 ? this.pen16(colour[0] >> 4) : this.s_pal_indYJK[ind | ((colour[0] >> 3) & 30)];
                ln[idx++] = colour[0] & 8 ? this.pen16(colour[0] >> 4) : this.s_pal_indYJK[ind | ((colour[0] >> 3) & 30)];

                ln[idx++] = colour[1] & 8 ? this.pen16(colour[1] >> 4) : this.s_pal_indYJK[ind | ((colour[1] >> 3) & 30)];
                ln[idx++] = colour[1] & 8 ? this.pen16(colour[1] >> 4) : this.s_pal_indYJK[ind | ((colour[1] >> 3) & 30)];

                ln[idx++] = colour[2] & 8 ? this.pen16(colour[2] >> 4) : this.s_pal_indYJK[ind | ((colour[2] >> 3) & 30)];
                ln[idx++] = colour[2] & 8 ? this.pen16(colour[2] >> 4) : this.s_pal_indYJK[ind | ((colour[2] >> 3) & 30)];

                ln[idx++] = colour[3] & 8 ? this.pen16(colour[3] >> 4) : this.s_pal_indYJK[ind | ((colour[3] >> 3) & 30)];
                ln[idx++] = colour[3] & 8 ? this.pen16(colour[3] >> 4) : this.s_pal_indYJK[ind | ((colour[3] >> 3) & 30)];

                nametbl_addr++;
            }
        } else if (this.cont_reg[2] & 0x40) {
            for (x = 0; x < 32; x++) {
                nametbl_addr++;
                colour = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                pen = this.pen256(colour);
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                ln[idx++] = pen;
                nametbl_addr++;
            }
        } else {
            for (x = 0; x < 256; x++) {
                colour = this.vram_space[((nametbl_addr & 1) << 16) | (nametbl_addr >> 1)];
                pen = this.pen256(colour);
                ln[idx++] = pen;
                ln[idx++] = pen;
                nametbl_addr++;
            }
        }

        xx = (16 - this.offset_x) << 1;
        while (xx--) {
            ln[idx++] = pen_bg;
        }
    }

    mode_unknown(ln: uint32_t[], line: int) {
        let idx = 0;
        const fg: pen_t = this.pen16(this.cont_reg[7] >> 4);
        const bg: pen_t = this.pen16(this.cont_reg[7] & 0x0f);

        for (let x = this.offset_x << 1; x > 0; x--) {
            ln[idx++] = bg;
        }

        for (let x = 512; x > 0; x--) {
            ln[idx++] = fg;
        }

        for (let x = (16 - this.offset_x) << 1; x > 0; x--) {
            ln[idx++] = bg;
        }
    }

    default_draw_sprite(ln: uint32_t[], col: uint32_t[]) {
        let idx = 0;
        let i: int;
        idx += this.offset_x << 1;

        for (i = 0; i < 256; i++) {
            if (col[i] & 0x80) {
                ln[idx++] = this.pen16(col[i] & 0x0f);
                ln[idx++] = this.pen16(col[i] & 0x0f);
            } else {
                idx += 2;
            }
        }
    }

    graphic5_draw_sprite(ln: uint32_t[], col: uint32_t[]) {
        let idx = 0;
        let i: int;
        idx += this.offset_x << 1;

        for (i = 0; i < 256; i++) {
            if (col[i] & 0x80) {
                ln[idx++] = this.pen16((col[i] >> 2) & 0x03);
                ln[idx++] = this.pen16(col[i] & 0x03);
            } else {
                idx += 2;
            }
        }
    }

    graphic7_draw_sprite(ln: uint32_t[], col: uint32_t[]) {
        const g7_ind16: uint16_t[] = [
            0, 2, 192, 194, 48, 50, 240, 242,
            482, 7, 448, 455, 56, 63, 504, 511
        ];

        let idx = 0;
        let i: int;

        idx += this.offset_x << 1;

        for (i = 0; i < 256; i++) {
            if (col[i] & 0x80) {
                const color = new Color(this.pal3bit(g7_ind16[col[i] & 0x0f] >> 6), this.pal3bit(g7_ind16[col[i] & 0x0f] >> 3), this.pal3bit(g7_ind16[col[i] & 0x0f]));
                ln[idx++] = this.uint32_t(color);
                ln[idx++] = this.uint32_t(color);
            } else {
                idx += 2;
            }
        }
    }

    sprite_mode1(line: int, col: uint32_t[]) {
        let attrtbl_addr: int;
        let patterntbl_addr: int;
        let pattern_addr: int;
        let x: int;
        let y: int;
        let p: int;
        let height: int;
        let c: int;
        let p2: int;
        let i: int;
        let n: int;
        let pattern: int;

        // memset(col, 0, 256);
        for (let i = 0; i < 256; i++) {
            col[i] = 0;
        }

        // are sprites disabled?
        if (this.cont_reg[8] & 0x02) {
            return;
        }

        attrtbl_addr = (this.cont_reg[5] << 7) + (this.cont_reg[11] << 15);
        patterntbl_addr = (this.cont_reg[6] << 11);

        // 16x16 or 8x8 sprites
        height = (this.cont_reg[1] & 2) ? 16 : 8;
        // magnified sprites (zoomed)
        if (this.cont_reg[1] & 1) {
            height <<= 1;
        }

        p2 = p = 0;
        while (1) {
            y = this.vram_space[attrtbl_addr];
            if (y === 208) {
                break;
            }
            y = (y - this.cont_reg[23]) & 255;
            if (y > 208) {
                y = -(~y & 255);
            } else {
                y++;
            }

            // if sprite in range, has to be drawn
            if ((line >= y) && (line < (y + height))) {
                if (p2 === 4) {
                    // max maximum sprites per line!
                    if (!(this.stat_reg[0] & 0x40)) {
                        this.stat_reg[0] = (this.stat_reg[0] & 0xa0) | 0x40 | p;
                    }

                    break;
                }
                // get x
                x = this.vram_space[attrtbl_addr + 1];
                if (this.vram_space[attrtbl_addr + 3] & 0x80) {
                    x -= 32;
                }

                // get pattern
                pattern = this.vram_space[attrtbl_addr + 2];
                if (this.cont_reg[1] & 2) {
                    pattern &= 0xfc;
                }
                n = line - y;
                pattern_addr = patterntbl_addr + (pattern << 3) + ((this.cont_reg[1] & 1) ? (n >> 1) : n);
                pattern = (this.vram_space[pattern_addr] << 8) | this.vram_space[pattern_addr + 16];

                // get colour
                c = this.vram_space[attrtbl_addr + 3] & 0x0f;

                // draw left part
                n = 0;
                while (1) {
                    if (n === 0) {
                        pattern = this.vram_space[pattern_addr];
                    } else if ((n === 1) && (this.cont_reg[1] & 2)) {
                        pattern = this.vram_space[pattern_addr + 16];
                    } else {
                        break;
                    }

                    n++;

                    for (i = 0; i < 8; i++) {
                        if (pattern & 0x80) {
                            if ((x >= 0) && (x < 256)) {
                                if (col[x] & 0x40) {
                                    // we have a collision!
                                    if (p2 < 4) {
                                        this.stat_reg[0] |= 0x20;
                                    }
                                }
                                if (!(col[x] & 0x80)) {
                                    if (c || (this.cont_reg[8] & 0x20)) {
                                        col[x] |= 0xc0 | c;
                                    } else {
                                        col[x] |= 0x40;
                                    }
                                }

                                // if zoomed, draw another pixel
                                if (this.cont_reg[1] & 1) {
                                    if (col[x + 1] & 0x40) {
                                        // we have a collision!
                                        if (p2 < 4) {
                                            this.stat_reg[0] |= 0x20;
                                        }
                                    }
                                    if (!(col[x + 1] & 0x80)) {
                                        if (c || (this.cont_reg[8] & 0x20)) {
                                            col[x + 1] |= 0xc0 | c;
                                        } else {
                                            col[x + 1] |= 0x80;
                                        }
                                    }
                                }
                            }
                        }
                        if (this.cont_reg[1] & 1) {
                            x += 2;
                        } else {
                            x++;
                        }
                        pattern <<= 1;
                    }
                }

                p2++;
            }

            if (p >= 31) {
                break;
            }
            p++;
            attrtbl_addr += 4;
        }

        if (!(this.stat_reg[0] & 0x40)) {
            this.stat_reg[0] = (this.stat_reg[0] & 0xa0) | p;
        }
    }

    sprite_mode2(line: int, col: uint32_t[]) {
        let attrtbl_addr: int;
        let patterntbl_addr: int;
        let pattern_addr: int;
        let colourtbl_addr: int;
        let x: int;
        let i: int;
        let y: int;
        let p: int;
        let height: int;
        let c: int;
        let p2: int;
        let n: int;
        let pattern: int;
        let colourmask: int;
        let first_cc_seen: int;

        // memset(col, 0, 256);
        for (let i = 0; i < 256; i++) {
            col[i] = 0;
        }

        // are sprites disabled?
        if (this.cont_reg[8] & 0x02) {
            return;
        }

        attrtbl_addr = ((this.cont_reg[5] & 0xfc) << 7) + (this.cont_reg[11] << 15);
        colourtbl_addr = ((this.cont_reg[5] & 0xf8) << 7) + (this.cont_reg[11] << 15);
        patterntbl_addr = (this.cont_reg[6] << 11);
        colourmask = ((this.cont_reg[5] & 3) << 3) | 0x7; // check this!

        // 16x16 or 8x8 sprites
        height = (this.cont_reg[1] & 2) ? 16 : 8;
        // magnified sprites (zoomed)
        if (this.cont_reg[1] & 1) {
            height *= 2;
        }

        p2 = p = first_cc_seen = 0;
        while (1) {
            y = this.vram_read(attrtbl_addr);
            if (y === 216) {
                break;
            }
            y = (y - this.cont_reg[23]) & 255;
            if (y > 216) {
                y = -(~y & 255);
            } else {
                y++;
            }

            // if sprite in range, has to be drawn
            if ((line >= y) && (line < (y + height))) {
                if (p2 === 8) {
                    // max maximum sprites per line!
                    if (!(this.stat_reg[0] & 0x40)) {
                        this.stat_reg[0] = (this.stat_reg[0] & 0xa0) | 0x40 | p;
                    }

                    break;
                }

                n = line - y;
                if (this.cont_reg[1] & 1) {
                    n /= 2;
                }
                // get colour
                c = this.vram_read(colourtbl_addr + (((p & colourmask) * 16) + n));

                // tslint:disable-next-line:label-position
                skip_first_cc_set: {
                    // don't draw all sprite with CC set before any sprites
                    // with CC = 0 are seen on this line
                    if (c & 0x40) {
                        if (!first_cc_seen) {
                            break skip_first_cc_set;
                        }
                    } else {
                        first_cc_seen = 1;
                    }

                    // get pattern
                    pattern = this.vram_read(attrtbl_addr + 2);
                    if (this.cont_reg[1] & 2) {
                        pattern &= 0xfc;
                    }
                    pattern_addr = patterntbl_addr + pattern * 8 + n;
                    pattern = (this.vram_read(pattern_addr) << 8) | this.vram_read(pattern_addr + 16);

                    // get x
                    x = this.vram_read(attrtbl_addr + 1);
                    if (c & 0x80) {
                        x -= 32;
                    }

                    n = (this.cont_reg[1] & 2) ? 16 : 8;
                    while (n--) {
                        for (i = 0; i <= (this.cont_reg[1] & 1); i++) {
                            if ((x >= 0) && (x < 256)) {
                                if ((pattern & 0x8000) && !(col[x] & 0x10)) {
                                    if ((c & 15) || (this.cont_reg[8] & 0x20)) {
                                        if (!(c & 0x40)) {
                                            if (col[x] & 0x20) {
                                                col[x] |= 0x10;
                                            } else {
                                                col[x] |= 0x20 | (c & 15);
                                            }
                                        } else {
                                            col[x] |= c & 15;
                                        }

                                        col[x] |= 0x80;
                                    }
                                } else {
                                    if (!(c & 0x40) && (col[x] & 0x20)) {
                                        col[x] |= 0x10;
                                    }
                                }

                                if (!(c & 0x60) && (pattern & 0x8000)) {
                                    if (col[x] & 0x40) {
                                        // sprite collision!
                                        if (p2 < 8) {
                                            this.stat_reg[0] |= 0x20;
                                        }
                                    } else {
                                        col[x] |= 0x40;
                                    }
                                }

                                x++;
                            }
                        }

                        pattern <<= 1;
                    }
                }
                // skip_first_cc_set:
                p2++;
            }

            if (p >= 31) {
                break;
            }
            p++;
            attrtbl_addr += 4;
        }

        if (!(this.stat_reg[0] & 0x40)) {
            this.stat_reg[0] = (this.stat_reg[0] & 0xa0) | p;
        }
    }

    set_mode() {
        let n: int;
        let i: int;

        n = (((this.cont_reg[0] & 0x0e) << 1) | ((this.cont_reg[1] & 0x18) >> 3));
        for (i = 0; ; i++) {
            if ((this.s_modes[i].m === n) || (this.s_modes[i].m === 0xff)) {
                break;
            }
        }

        // MZ: What happens when the mode is changed during command execution?
        // This is left unspecified in the docs. On a Geneve, experiments showed
        // that the command is not aborted (the CE flag is still 1) and runs for
        // about 90% of the nominal execution time, but VRAM is only correctly
        // filled up to the time of switching, and after that, isolated locations
        // within the normally affected area are changed, but inconsistently.
        // Obviously, it depends on the time when the switch happened.
        // This behavior occurs on every switch from a mode Graphics4 and higher
        // to another mode, e.g. also from Graphics7 to Graphics6.
        // Due to the lack of more information, we simply abort the command.

        if (this.vdp_engine && this.mode !== i) {
            V9938.LOGMASKED(V9938.LOG_WARN, "Command aborted due to mode change\n");
            this.vdp_engine = undefined;
            this.stat_reg[2] &= 0xFE;
        }

        this.mode = i;
    }

    refresh_32(line: int) {
        let double_lines = false;
        const col: uint32_t[] = [];
        const ln: uint32_t[] = [];

        let canvasLine: number;
        if (this.cont_reg[9] & 0x08) {
            canvasLine = this.scanline * 2 + ((this.stat_reg[2] >> 1) & 1);
        } else {
            canvasLine = this.scanline * 2;
            double_lines = true;
        }

        const mode = this.s_modes[this.mode];
        if (!(this.cont_reg[1] & 0x40) || (this.stat_reg[2] & 0x40)) {
            mode.border_32(ln);
        } else {
            mode.visible_32(ln, line);
            if (mode.sprites && mode.draw_sprite_32) {
                mode.sprites(line, col);
                mode.draw_sprite_32(ln, col);
            }
        }

        const data = this.imageData.data;

        let offset = canvasLine * this.imageData.width << 2;
        let startOffset = offset;
        for (let i = 0; i < ln.length; i++) {
            const rgba = ln[i];
            data[offset++] = (rgba & 0xff000000) >>> 24;
            data[offset++] = (rgba & 0x00ff0000) >> 16;
            data[offset++] = (rgba & 0x0000ff00) >> 8;
            data[offset++] = (rgba & 0x000000ff);
        }

        if (double_lines) {
            // memcpy(ln2, ln, (512 + 32) * sizeof(*ln));
            offset = (canvasLine + 1) * this.imageData.width << 2;
            data.copyWithin(offset, startOffset, startOffset + ln.length * 4)
        }
    }

    refresh_line(line: int) {
        let ind16: pen_t;
        let ind256: pen_t;

        ind16 = this.pen16(0);
        ind256 = this.pen256(0);

        if (!(this.cont_reg[8] & 0x20) && (this.mode !== V9938.MODE_GRAPHIC5)) {
            this.set_pen16(0, this.pen16(this.cont_reg[7] & 0x0f));
            this.set_pen256(0, this.pen256(this.cont_reg[7]));
        }

        this.refresh_32(line);

        if (!(this.cont_reg[8] & 0x20) && (this.mode !== V9938.MODE_GRAPHIC5)) {
            this.set_pen16(0, ind16);
            this.set_pen256(0, ind256);
        }
    }

    /*

    From: awulms@inter.nl.net (Alex Wulms)
    *** About the HR/VR topic: this is how it works according to me:

    *** HR:
    HR is very straightforward:
    -HR=1 during 'display time'
    -HR=0 during 'horizontal border, horizontal retrace'
    I have put 'display time' and 'horizontal border, horizontal retrace' between
    quotes because HR does not only flip between 0 and 1 during the display of
    the 192/212 display lines, but also during the vertical border and during the
    vertical retrace.

    *** VR:
    VR is a little bit tricky
    -VR always gets set to 0 when the VDP starts with display line 0
    -VR gets set to 1 when the VDP reaches display line (192 if LN=0) or (212 if
    LN=1)
    -The VDP displays contents of VRAM as long as VR=0

    As a consequence of this behaviour, it is possible to program the famous
    overscan trick, where VRAM contents is shown in the borders:
    Generate an interrupt at line 230 (or so) and on this interrupt: set LN=1
    Generate an interrupt at line 200 (or so) and on this interrupt: set LN=0
    Repeat the above two steps

    *** The top/bottom border contents during overscan:
    On screen 0:
    1) The VDP keeps increasing the name table address pointer during bottom
    border, vertical retrace and top border
    2) The VDP resets the name table address pointer when the first display line
    is reached

    On the other screens:
    1) The VDP keeps increasing the name table address pointer during the bottom
    border
    2) The VDP resets the name table address pointer such that the top border
    contents connects up with the first display line. E.g., when the top border
    is 26 lines high, the VDP will take:
    'logical'      vram line
    TOPB000  256-26
    ...
    TOPB025  256-01
    DISPL000 000
    ...
    DISPL211 211
    BOTB000  212
    ...
    BOTB024  236



    *** About the horizontal interrupt

    All relevant definitions on a row:
    -FH: Bit 0 of status register 1
    -IE1: Bit 4 of mode register 0
    -IL: Line number in mode register 19
    -DL: The line that the VDP is going to display (corrected for vertical scroll)
    -IRQ: Interrupt request line of VDP to Z80

    At the *start* of every new line (display, bottom border, part of vertical
    display), the VDP does:
    -FH = (FH && IE1) || (IL==DL)

    After reading of status register 1 by the CPU, the VDP does:
    -FH = 0

    Furthermore, the following is true all the time:
    -IRQ = FH && IE1

    The resulting behaviour:
    When IE1=0:
    -FH will be set as soon as display of line IL starts
    -FH will be reset as soon as status register 1 is read
    -FH will be reset as soon as the next display line is reached

    When IE=1:
    -FH and IRQ will be set as soon as display line IL is reached
    -FH and IRQ will be reset as soon as status register 1 is read

    Another subtile result:
    If, while FH and IRQ are set, IE1 gets reset, the next happens:
    -IRQ is reset immediately (since IRQ is always FH && IE1)
    -FH will be reset as soon as display of the next line starts (unless the next
    line is line IL)


    *** About the vertical interrupt:
    Another relevant definition:
    -FV: Bit 7 of status register 0
    -IE0: Bit 5 of mode register 1

    I only know for sure the behaviour when IE0=1:
    -FV and IRQ will be set as soon as VR changes from 0 to 1
    -FV and IRQ will be reset as soon as status register 0 is read

    A consequence is that NO vertical interrupts will be generated during the
    overscan trick, described in the VR section above.

    I do not know the behaviour of FV when IE0=0. That is the part that I still
    have to test.
    */

    interrupt_start_vblank() {
        // #if 0
        // if (machine.input().code_pressed (KEYCODE_D) )
        // {
        //     for (i=0;i<24;i++) osd_printf_debug ("R#%d = %02x\n", i, this.cont_reg[i]);
        // }
        // #endif

        // at every frame, vdp switches fields
        this.stat_reg[2] = (this.stat_reg[2] & 0xfd) | (~this.stat_reg[2] & 2);

        // color blinking
        if (!(this.cont_reg[13] & 0xf0)) {
            this.blink = 0;
        } else if (!(this.cont_reg[13] & 0x0f)) {
            this.blink = 1;
        } else {
            // both on and off counter are non-zero: timed blinking
            if (this.blink_count) {
                this.blink_count--;
            }
            if (!this.blink_count) {
                this.blink = this.blink === 0 ? 1 : 0;
                if (this.blink) {
                    this.blink_count = (this.cont_reg[13] >> 4) * 10;
                } else {
                    this.blink_count = (this.cont_reg[13] & 0x0f) * 10;
                }
            }
        }
    }

    /***************************************************************************

     Command unit

     ***************************************************************************/

    /*************************************************************/
    /** Completely rewritten by Alex Wulms:                     **/
    /**  - VDP Command execution 'in parallel' with CPU         **/
    /**  - Corrected behaviour of VDP commands                  **/
    /**  - Made it easier to implement correct S7/8 mapping     **/
    /**    by concentrating VRAM access in one single place     **/
    /**  - Made use of the 'in parallel' VDP command exec       **/
    /**    and correct timing. You must call the function       **/
    /**    LoopVDP() from LoopZ80 in MSX.c. You must call it    **/
    /**    exactly 256 times per screen refresh.                **/
    /** Started on       : 11-11-1999                           **/
    /** Beta release 1 on:  9-12-1999                           **/
    /** Beta release 2 on: 20-01-2000                           **/
    /**  - Corrected behaviour of VRM <-> Z80 transfer          **/
    /**  - Improved performance of the code                     **/
    /** Public release 1.0: 20-04-2000                          **/

    /*************************************************************/

    VDP_VRMP5(MX: int, X: int, Y: int) {
        return ((!MX) ? (((Y & 1023) << 7) + ((X & 255) >> 1)) : (V9938.EXPMEM_OFFSET + ((Y & 511) << 7) + ((X & 255) >> 1)));
    }

    VDP_VRMP6(MX: int, X: int, Y: int) {
        return ((!MX) ? (((Y & 1023) << 7) + ((X & 511) >> 2)) : (V9938.EXPMEM_OFFSET + ((Y & 511) << 7) + ((X & 511) >> 2)));
    }

    // #define VDP_VRMP7(MX, X, Y) ((!MX) ? (((Y&511)<<8) + ((X&511)>>1)) : (EXPMEM_OFFSET + ((Y&255)<<8) + ((X&511)>>1)))
    VDP_VRMP7(MX: int, X: int, Y: int) {
        return ((!MX) ? (((X & 2) << 15) + ((Y & 511) << 7) + ((X & 511) >> 2)) : (V9938.EXPMEM_OFFSET + ((Y & 511) << 7) + ((X & 511) >> 2))/*(EXPMEM_OFFSET + ((Y&255)<<8) + ((X&511)>>1))*/);
    }

    // #define VDP_VRMP8(MX, X, Y) ((!MX) ? (((Y&511)<<8) + (X&255)) : (EXPMEM_OFFSET + ((Y&255)<<8) + (X&255)))
    VDP_VRMP8(MX: int, X: int, Y: int) {
        return ((!MX) ? (((X & 1) << 16) + ((Y & 511) << 7) + ((X >> 1) & 127)) : (V9938.EXPMEM_OFFSET + ((Y & 511) << 7) + ((X >> 1) & 127))/*(EXPMEM_OFFSET + ((Y&255)<<8) + (X&255))*/);
    }

    VDP_VRMP(M: int, MX: int, X: int, Y: int) {
        return this.VDPVRMP(M, MX, X, Y);
    }

    VDP_POINT(M: int, MX: int, X: int, Y: int) {
        return this.VDPpoint(M, MX, X, Y);
    }

    VDP_PSET(M: int, MX: int, X: int, Y: int, C: int, O: int) {
        return this.VDPpset(M, MX, X, Y, C, O);
    }

    static CM_ABRT = 0x0;
    static CM_POINT = 0x4;
    static CM_PSET = 0x5;
    static CM_SRCH = 0x6;
    static CM_LINE = 0x7;
    static CM_LMMV = 0x8;
    static CM_LMMM = 0x9;
    static CM_LMCM = 0xA;
    static CM_LMMC = 0xB;
    static CM_HMMV = 0xC;
    static CM_HMMM = 0xD;
    static CM_YMMM = 0xE;
    static CM_HMMC = 0xF;

    /*************************************************************
     Many VDP commands are executed in some kind of loop but
     essentially, there are only a few basic loop structures
     that are re-used. We define the loop structures that are
     re-used here so that they have to be entered only once
     *************************************************************/

//     #define pre_loop \
//     while ((cnt-=delta) > 0) {
//
//     #define post_loop \
//     }
//
//     // Loop over DX, DY
//     #define post__x_y(MX) \
//     if (!--ANX || ((ADX += TX) & MX)) { \
//         if (!(--NY & 1023) || (DY += TY) == -1) \
//         break; \
//     else
//         { \
//             ADX = DX; \
//             ANX = NX; \
//         } \
//     } \
//     post_loop
//
//     // Loop over DX, SY, DY
//     #define post__xyy(MX) \
//     if ((ADX+=TX)&MX) { \
//         if (!(--NY&1023) || (SY+=TY)==-1 || (DY+=TY)==-1) \
//         break; \
//     else \
//             ADX=DX; \
//     } \
//     post_loop
//
//     // Loop over SX, DX, SY, DY
//     #define post_xxyy(MX) \
//     if (!--ANX || ((ASX+=TX)&MX) || ((ADX+=TX)&MX)) { \
//         if (!(--NY&1023) || (SY+=TY)==-1 || (DY+=TY)==-1) \
//         break; \
//     else { \
//             ASX=SX; \
//             ADX=DX; \
//             ANX=NX; \
//         } \
//     } \
//     post_loop

    /*************************************************************/
    /** Variables visible only in this module                   **/
    /*************************************************************/
    static Mask: uint8_t[] = [0x0F, 0x03, 0x0F, 0xFF];
    static PPB: int[] = [2, 4, 2, 1];
    static PPL: int[] = [256, 512, 512, 256];

    //  SprOn SprOn SprOf SprOf
    //  ScrOf ScrOn ScrOf ScrOn
    static srch_timing = [
        818, 1025, 818, 830, // ntsc
        696, 854, 696, 684  // pal
    ];
    static line_timing = [
        1063, 1259, 1063, 1161,
        904, 1026, 904, 953
    ];
    static hmmv_timing = [
        439, 549, 439, 531,
        366, 439, 366, 427
    ];
    static lmmv_timing = [
        873, 1135, 873, 1056,
        732, 909, 732, 854
    ];
    static ymmm_timing = [
        586, 952, 586, 610,
        488, 720, 488, 500
    ];
    static hmmm_timing = [
        818, 1111, 818, 854,
        684, 879, 684, 708
    ];
    static lmmm_timing = [
        1160, 1599, 1160, 1172,
        964, 1257, 964, 977
    ];

    /** VDPVRMP() **********************************************/
    /** Calculate addr of a pixel in vram                       **/

    /*************************************************************/
    VDPVRMP(M: uint8_t, MX: int, X: int, Y: int): int {
        switch (M) {
            case 0:
                return this.VDP_VRMP5(MX, X, Y);
            case 1:
                return this.VDP_VRMP6(MX, X, Y);
            case 2:
                return this.VDP_VRMP7(MX, X, Y);
            case 3:
                return this.VDP_VRMP8(MX, X, Y);
        }

        return 0;
    }

    /** VDPpoint5() ***********************************************/
    /** Get a pixel on screen 5                                 **/

    /*************************************************************/
    VDPpoint5(MXS: int, SX: int, SY: int): int {
        return (this.vram_space[this.VDP_VRMP5(MXS, SX, SY)] >> (((~SX) & 1) << 2)) & 15;
    }

    /** VDPpoint6() ***********************************************/
    /** Get a pixel on screen 6                                 **/

    /*************************************************************/
    VDPpoint6(MXS: int, SX: int, SY: int): int {
        return (this.vram_space[this.VDP_VRMP6(MXS, SX, SY)] >> (((~SX) & 3) << 1)) & 3;
    }

    /** VDPpoint7() ***********************************************/
    /** Get a pixel on screen 7                                 **/

    /*************************************************************/
    VDPpoint7(MXS: int, SX: int, SY: int): int {
        return (this.vram_space[this.VDP_VRMP7(MXS, SX, SY)] >> (((~SX) & 1) << 2)) & 15;
    }

    /** VDPpoint8() ***********************************************/
    /** Get a pixel on screen 8                                 **/

    /*************************************************************/
    VDPpoint8(MXS: int, SX: int, SY: int): int {
        return this.vram_space[this.VDP_VRMP8(MXS, SX, SY)];
    }

    /** VDPpoint() ************************************************/
    /** Get a pixel on a screen                                 **/

    /*************************************************************/
    VDPpoint(SM: uint8_t, MXS: int, SX: int, SY: int): int {
        switch (SM) {
            case 0:
                return this.VDPpoint5(MXS, SX, SY);
            case 1:
                return this.VDPpoint6(MXS, SX, SY);
            case 2:
                return this.VDPpoint7(MXS, SX, SY);
            case 3:
                return this.VDPpoint8(MXS, SX, SY);
        }

        return (0);
    }

    /** VDPpsetlowlevel() ****************************************/
    /** Low level function to set a pixel on a screen           **/
    /** Make it to make it fast                          **/

    /*************************************************************/
    VDPpsetlowlevel(addr: int, CL: uint8_t, M: uint8_t, OP: uint8_t) {
        // If this turns out to be too slow, get a pointer to the address space
        // and work directly on it.
        let val: uint8_t = this.vram_space[addr];
        switch (OP) {
            case 0:
                val = (val & M) | CL;
                break;
            case 1:
                val = val & (CL | M);
                break;
            case 2:
                val |= CL;
                break;
            case 3:
                val ^= CL;
                break;
            case 4:
                val = (val & M) | ~(CL | M);
                break;
            case 8:
                if (CL) {
                    val = (val & M) | CL;
                }
                break;
            case 9:
                if (CL) {
                    val = val & (CL | M);
                }
                break;
            case 10:
                if (CL) {
                    val |= CL;
                }
                break;
            case 11:
                if (CL) {
                    val ^= CL;
                }
                break;
            case 12:
                if (CL) {
                    val = (val & M) | ~(CL | M);
                }
                break;
            default:
                V9938.LOGMASKED(V9938.LOG_WARN, "Invalid operation %d in pset\n", OP);
        }

        this.vram_space[addr] = val;
    }

    /** VDPpset5() ***********************************************/
    /** Set a pixel on screen 5                                 **/

    /*************************************************************/
    VDPpset5(MXD: int, DX: int, DY: int, CL: uint8_t, OP: uint8_t) {
        const SH: uint8_t = ((~DX) & 1) << 2;
        this.VDPpsetlowlevel(this.VDP_VRMP5(MXD, DX, DY), (CL << SH), ~(15 << SH), OP);
    }

    /** VDPpset6() ***********************************************/
    /** Set a pixel on screen 6                                 **/

    /*************************************************************/
    VDPpset6(MXD: int, DX: int, DY: int, CL: uint8_t, OP: uint8_t) {
        const SH: uint8_t = ((~DX) & 3) << 1;
        this.VDPpsetlowlevel(this.VDP_VRMP6(MXD, DX, DY), (CL << SH), ~(3 << SH), OP);
    }

    /** VDPpset7() ***********************************************/
    /** Set a pixel on screen 7                                 **/

    /*************************************************************/
    VDPpset7(MXD: int, DX: int, DY: int, CL: uint8_t, OP: uint8_t) {
        const SH: uint8_t = ((~DX) & 1) << 2;
        this.VDPpsetlowlevel(this.VDP_VRMP7(MXD, DX, DY), (CL << SH), ~(15 << SH), OP);
    }

    /** VDPpset8() ***********************************************/
    /** Set a pixel on screen 8                                 **/

    /*************************************************************/
    VDPpset8(MXD: int, DX: int, DY: int, CL: uint8_t, OP: uint8_t) {
        this.VDPpsetlowlevel(this.VDP_VRMP8(MXD, DX, DY), CL, 0, OP);
    }

    /** VDPpset() ************************************************/
    /** Set a pixel on a screen                                 **/

    /*************************************************************/
    VDPpset(SM: uint8_t, MXD: int, DX: int, DY: int, CL: uint8_t, OP: uint8_t) {
        switch (SM) {
            case 0:
                this.VDPpset5(MXD, DX, DY, CL, OP);
                break;
            case 1:
                this.VDPpset6(MXD, DX, DY, CL, OP);
                break;
            case 2:
                this.VDPpset7(MXD, DX, DY, CL, OP);
                break;
            case 3:
                this.VDPpset8(MXD, DX, DY, CL, OP);
                break;
        }
    }

    /** get_vdp_timing_value() **************************************/
    /** Get timing value for a certain VDP command              **/

    /*************************************************************/
    get_vdp_timing_value(timing_values: int[]): int {
        return (timing_values[((this.cont_reg[1] >> 6) & 1) | (this.cont_reg[8] & 2) | ((this.cont_reg[9] << 1) & 4)]);
    }

    /** SrchEgine()** ********************************************/
    /** Search a dot                                            **/

    /*************************************************************/
    srch_engine() {
        let SX = this.mmc.SX;
        const SY = this.mmc.SY;
        const TX = this.mmc.TX;
        const ANX = this.mmc.ANX;
        const CL = this.mmc.CL;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.srch_timing);
        cnt = this.vdp_ops_count;

        // #define post_srch(MX) \
        // { this.stat_reg[2]|=0x10; /* Border detected */ break; } \
        // if ((SX+=TX) & MX) { this.stat_reg[2] &= 0xEF; /* Border not detected */ break; }

        const srch_loop = (vdpPoint: (MXS: int, SX: int, SY: int) => int, MX: int) => {
            while ((cnt -= delta) > 0) {
                if ((vdpPoint(MXD, SX, SY) === CL ? 1 : 0) ^ ANX) {
                    this.stat_reg[2] |= 0x10; /* Border detected */
                    break;
                }
                if ((SX += TX) & MX) {
                    this.stat_reg[2] &= 0xEF; /* Border not detected */
                    break;
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; if ((this.VDPpoint5(MXD, SX, SY)==CL ? 1 : 0) ^ANX)  post_srch(256) post_loop
                srch_loop(this.VDPpoint5.bind(this), 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; if ((this.VDPpoint6(MXD, SX, SY)==CL ? 1 : 0) ^ANX)  post_srch(512) post_loop
                srch_loop(this.VDPpoint6.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; if ((this.VDPpoint7(MXD, SX, SY)==CL ? 1 : 0) ^ANX)  post_srch(512) post_loop
                srch_loop(this.VDPpoint7.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; if ((this.VDPpoint8(MXD, SX, SY)==CL ? 1 : 0) ^ANX)  post_srch(256) post_loop
                srch_loop(this.VDPpoint8.bind(this), 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            // Update SX in VDP registers
            this.stat_reg[8] = SX & 0xFF;
            this.stat_reg[9] = (SX >> 8) | 0xFE;
        } else {
            this.mmc.SX = SX;
        }
    }

    /** LineEgine()** ********************************************/
    /** Draw a line                                             **/

    /*************************************************************/
    line_engine() {
        let DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        const NX = this.mmc.NX;
        const NY = this.mmc.NY;
        let ASX = this.mmc.ASX;
        let ADX = this.mmc.ADX;
        const CL = this.mmc.CL;
        const LO = this.mmc.LO;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.line_timing);
        cnt = this.vdp_ops_count;

        // #define post_linexmaj(MX) \
        // DX+=TX; \
        // if ((ASX-=NY)<0) { \
        //     ASX+=NX; \
        //     DY+=TY; \
        // } \
        // ASX&=1023; /* Mask to 10 bits range */\
        // if (ADX++==NX || (DX&MX)) \
        // break; \
        // post_loop

        const line_xmaj_loop = (vdpSet: (MXD: int, DX: int, DY: int, CL: int, LO: int) => void, MX: int) => {
            while ((cnt -= delta) > 0) {
                vdpSet(MXD, DX, DY, CL, LO);
                DX += TX;
                if ((ASX -= NY) < 0) {
                    ASX += NX;
                    DY += TY;
                }
                ASX &= 1023; // Mask to 10 bits range
                if (ADX++ === NX || (DX & MX)) {
                    break;
                }
            }
        };

        // #define post_lineymaj(MX) \
        // DY+=TY; \
        // if ((ASX-=NY)<0) { \
        //     ASX+=NX; \
        //     DX+=TX; \
        // } \
        // ASX&=1023; /* Mask to 10 bits range */\
        // if (ADX++==NX || (DX&MX)) \
        // break; \
        // post_loop

        const line_ymaj_loop = (vdpSet: (MXD: int, DX: int, DY: int, CL: int, LO: int) => void, MX: int) => {
            while ((cnt -= delta) > 0) {
                vdpSet(MXD, DX, DY, CL, LO);
                DX += TX;
                if ((ASX -= NY) < 0) {
                    ASX += NX;
                    DX += TX;
                }
                ASX &= 1023; // Mask to 10 bits range
                if (ADX++ === NX || (DX & MX)) {
                    break;
                }
            }
        };

        if ((this.cont_reg[45] & 0x01) === 0) {
            // X-Axis is major direction
            switch (this.mode) {
                default:
                case V9938.MODE_GRAPHIC4: // pre_loop; this.VDPpset5(MXD, DX, DY, CL, LO); post_linexmaj(256)
                    line_xmaj_loop(this.VDPpset5.bind(this), 256);
                    break;
                case V9938.MODE_GRAPHIC5: // pre_loop; this.VDPpset6(MXD, DX, DY, CL, LO); post_linexmaj(512)
                    line_xmaj_loop(this.VDPpset6.bind(this), 512);
                    break;
                case V9938.MODE_GRAPHIC6: // pre_loop; this.VDPpset7(MXD, DX, DY, CL, LO); post_linexmaj(512)
                    line_xmaj_loop(this.VDPpset7.bind(this), 512);
                    break;
                case V9938.MODE_GRAPHIC7: // pre_loop; this.VDPpset8(MXD, DX, DY, CL, LO); post_linexmaj(256)
                    line_xmaj_loop(this.VDPpset8.bind(this), 256);
                    break;
            }
        } else {
            // Y-Axis is major direction
            switch (this.mode) {
                default:
                case V9938.MODE_GRAPHIC4: // pre_loop; this.VDPpset5(MXD, DX, DY, CL, LO); post_lineymaj(256)
                    line_ymaj_loop(this.VDPpset5.bind(this), 256);
                    break;
                case V9938.MODE_GRAPHIC5: // pre_loop; this.VDPpset6(MXD, DX, DY, CL, LO); post_lineymaj(512)
                    line_ymaj_loop(this.VDPpset6.bind(this), 512);
                    break;
                case V9938.MODE_GRAPHIC6: // pre_loop; this.VDPpset7(MXD, DX, DY, CL, LO); post_lineymaj(512)
                    line_ymaj_loop(this.VDPpset7.bind(this), 512);
                    break;
                case V9938.MODE_GRAPHIC7: // pre_loop; this.VDPpset8(MXD, DX, DY, CL, LO); post_lineymaj(256)
                    line_ymaj_loop(this.VDPpset8.bind(this), 256);
                    break;
            }
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
        } else {
            this.mmc.DX = DX;
            this.mmc.DY = DY;
            this.mmc.ASX = ASX;
            this.mmc.ADX = ADX;
        }
    }

    /** lmmv_engine() *********************************************/
    /** VDP -> Vram                                             **/

    /*************************************************************/
    lmmv_engine() {
        const DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        const NX = this.mmc.NX;
        let NY = this.mmc.NY;
        let ADX = this.mmc.ADX;
        let ANX = this.mmc.ANX;
        const CL = this.mmc.CL;
        const LO = this.mmc.LO;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.lmmv_timing);
        cnt = this.vdp_ops_count;

        const lmmv_loop = (vdpPset: (MXD: int, ADX: int, DY: int, CL: int, LO: int) => void, MX: int) => {
            while ((cnt -= delta) > 0) {
                vdpPset(MXD, ADX, DY, CL, LO);
                if (!--ANX || ((ADX += TX) & MX)) {
                    if (!(--NY & 1023) || (DY += TY) === -1) {
                        break;
                    } else {
                        ADX = DX;
                        ANX = NX;
                    }
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; this.VDPpset5(MXD, ADX, DY, CL, LO); post__x_y(256)
                lmmv_loop(this.VDPpset5.bind(this), 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; this.VDPpset6(MXD, ADX, DY, CL, LO); post__x_y(512)
                lmmv_loop(this.VDPpset6.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; this.VDPpset7(MXD, ADX, DY, CL, LO); post__x_y(512)
                lmmv_loop(this.VDPpset7.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; this.VDPpset8(MXD, ADX, DY, CL, LO); post__x_y(256)
                lmmv_loop(this.VDPpset8.bind(this), 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            if (!NY) {
                DY += TY;
            }
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
            this.cont_reg[42] = NY & 0xFF;
            this.cont_reg[43] = (NY >> 8) & 0x03;
        } else {
            this.mmc.DY = DY;
            this.mmc.NY = NY;
            this.mmc.ANX = ANX;
            this.mmc.ADX = ADX;
        }
    }

    /** lmmm_engine() *********************************************/
    /** Vram -> Vram                                            **/

    /*************************************************************/
    lmmm_engine() {
        const SX = this.mmc.SX;
        let SY = this.mmc.SY;
        const DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        const NX = this.mmc.NX;
        let NY = this.mmc.NY;
        let ASX = this.mmc.ASX;
        let ADX = this.mmc.ADX;
        let ANX = this.mmc.ANX;
        const LO = this.mmc.LO;
        const MXS = this.mmc.MXS;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.lmmm_timing);
        cnt = this.vdp_ops_count;

        const lmmm_loop = (vdpPset: (MXD: int, ADX: int, DY: int, CL: int, LO: int) => void, vdpPoint: (MXS: int, ASX: int, SY: int) => int, MX: int) => {
            while ((cnt -= delta) > 0) {
                vdpPset(MXD, ADX, DY, vdpPoint(MXS, ASX, SY), LO);
                if (!--ANX || ((ASX += TX) & MX) || ((ADX += TX) & MX)) {
                    if (!(--NY & 1023) || (SY += TY) === -1 || (DY += TY) === -1) {
                        break;
                    } else {
                        ASX = SX;
                        ADX = DX;
                        ANX = NX;
                    }
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; this.VDPpset5(MXD, ADX, DY, this.VDPpoint5(MXS, ASX, SY), LO); post_xxyy(256)
                lmmm_loop(this.VDPpset5.bind(this), this.VDPpoint5, 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; this.VDPpset6(MXD, ADX, DY, this.VDPpoint6(MXS, ASX, SY), LO); post_xxyy(512)
                lmmm_loop(this.VDPpset6.bind(this), this.VDPpoint6, 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; this.VDPpset7(MXD, ADX, DY, this.VDPpoint7(MXS, ASX, SY), LO); post_xxyy(512)
                lmmm_loop(this.VDPpset7.bind(this), this.VDPpoint7, 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; this.VDPpset8(MXD, ADX, DY, this.VDPpoint8(MXS, ASX, SY), LO); post_xxyy(256)
                lmmm_loop(this.VDPpset8.bind(this), this.VDPpoint8, 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            if (!NY) {
                SY += TY;
                DY += TY;
            } else if (SY === -1) {
                DY += TY;
            }
            this.cont_reg[42] = NY & 0xFF;
            this.cont_reg[43] = (NY >> 8) & 0x03;
            this.cont_reg[34] = SY & 0xFF;
            this.cont_reg[35] = (SY >> 8) & 0x03;
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
        } else {
            this.mmc.SY = SY;
            this.mmc.DY = DY;
            this.mmc.NY = NY;
            this.mmc.ANX = ANX;
            this.mmc.ASX = ASX;
            this.mmc.ADX = ADX;
        }
    }

    /** lmcm_engine() *********************************************/
    /** Vram -> CPU                                             **/

    /*************************************************************/
    lmcm_engine() {
        if ((this.stat_reg[2] & 0x80) !== 0x80) {
            this.stat_reg[7] = this.cont_reg[44] = this.VDP_POINT(((this.mode >= 5) && (this.mode <= 8)) ? (this.mode - 5) : 0, this.mmc.MXS, this.mmc.ASX, this.mmc.SY);
            this.vdp_ops_count -= this.get_vdp_timing_value(V9938.lmmv_timing);
            this.stat_reg[2] |= 0x80;

            if (!--this.mmc.ANX || ((this.mmc.ASX += this.mmc.TX) & this.mmc.MX)) {
                if (!(--this.mmc.NY & 1023) || (this.mmc.SY += this.mmc.TY) === -1) {
                    this.stat_reg[2] &= 0xFE;
                    this.vdp_engine = undefined;
                    if (!this.mmc.NY) {
                        this.mmc.DY += this.mmc.TY;
                    }
                    this.cont_reg[42] = this.mmc.NY & 0xFF;
                    this.cont_reg[43] = (this.mmc.NY >> 8) & 0x03;
                    this.cont_reg[34] = this.mmc.SY & 0xFF;
                    this.cont_reg[35] = (this.mmc.SY >> 8) & 0x03;
                } else {
                    this.mmc.ASX = this.mmc.SX;
                    this.mmc.ANX = this.mmc.NX;
                }
            }
        }
    }

    /** lmmc_engine() *********************************************/
    /** CPU -> Vram                                             **/

    /*************************************************************/
    lmmc_engine() {
        if ((this.stat_reg[2] & 0x80) !== 0x80) {
            const SM: uint8_t = ((this.mode >= 5) && (this.mode <= 8)) ? (this.mode - 5) : 0;

            this.stat_reg[7] = this.cont_reg[44] &= V9938.Mask[SM];
            this.VDP_PSET(SM, this.mmc.MXD, this.mmc.ADX, this.mmc.DY, this.cont_reg[44], this.mmc.LO);
            this.vdp_ops_count -= this.get_vdp_timing_value(V9938.lmmv_timing);
            this.stat_reg[2] |= 0x80;

            if (!--this.mmc.ANX || ((this.mmc.ADX += this.mmc.TX) & this.mmc.MX)) {
                if (!(--this.mmc.NY & 1023) || (this.mmc.DY += this.mmc.TY) === -1) {
                    this.stat_reg[2] &= 0xFE;
                    this.vdp_engine = undefined;
                    if (!this.mmc.NY) {
                        this.mmc.DY += this.mmc.TY;
                    }
                    this.cont_reg[42] = this.mmc.NY & 0xFF;
                    this.cont_reg[43] = (this.mmc.NY >> 8) & 0x03;
                    this.cont_reg[38] = this.mmc.DY & 0xFF;
                    this.cont_reg[39] = (this.mmc.DY >> 8) & 0x03;
                } else {
                    this.mmc.ADX = this.mmc.DX;
                    this.mmc.ANX = this.mmc.NX;
                }
            }
        }
    }

    /** hmmv_engine() *********************************************/
    /** VDP --> Vram                                            **/

    /*************************************************************/
    hmmv_engine() {
        const DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        const NX = this.mmc.NX;
        let NY = this.mmc.NY;
        let ADX = this.mmc.ADX;
        let ANX = this.mmc.ANX;
        const CL = this.mmc.CL;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.hmmv_timing);
        cnt = this.vdp_ops_count;

        const hmmv_loop = (vdpVrmb: (MXD: int, ADX: int, DY: int) => int, MX: int) => {
            while ((cnt -= delta) > 0) {
                this.vram_space[vdpVrmb(MXD, ADX, DY)] = CL;
                if (!--ANX || ((ADX += TX) & MX)) {
                    if (!(--NY & 1023) || (DY += TY) === -1) {
                        break;
                    } else {
                        ADX = DX;
                        ANX = NX;
                    }
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; this.vram_space[this.VDP_VRMP5(MXD, ADX, DY)] = CL; post__x_y(256)
                hmmv_loop(this.VDP_VRMP5.bind(this), 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; this.vram_space[this.VDP_VRMP6(MXD, ADX, DY)] = CL; post__x_y(512)
                hmmv_loop(this.VDP_VRMP6.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; this.vram_space[this.VDP_VRMP7(MXD, ADX, DY)] = CL; post__x_y(512)
                hmmv_loop(this.VDP_VRMP7.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; this.vram_space[this.VDP_VRMP8(MXD, ADX, DY)] = CL; post__x_y(256)
                hmmv_loop(this.VDP_VRMP8.bind(this), 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            if (!NY) {
                DY += TY;
            }
            this.cont_reg[42] = NY & 0xFF;
            this.cont_reg[43] = (NY >> 8) & 0x03;
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
        } else {
            this.mmc.DY = DY;
            this.mmc.NY = NY;
            this.mmc.ANX = ANX;
            this.mmc.ADX = ADX;
        }
    }

    /** hmmm_engine() *********************************************/
    /** Vram -> Vram                                            **/

    /*************************************************************/
    hmmm_engine() {
        const SX = this.mmc.SX;
        let SY = this.mmc.SY;
        const DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        const NX = this.mmc.NX;
        let NY = this.mmc.NY;
        let ASX = this.mmc.ASX;
        let ADX = this.mmc.ADX;
        let ANX = this.mmc.ANX;
        const MXS = this.mmc.MXS;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.hmmm_timing);
        cnt = this.vdp_ops_count;

        const hmmm_loop = (vdpVrmp: (MXD: int, ADX: int, DY: int) => int, MX: int) => {
            while ((cnt -= delta) > 0) {
                this.vram_space[vdpVrmp(MXD, ADX, DY)] = this.vram_space[vdpVrmp(MXS, ASX, SY)];
                if (!--ANX || ((ASX += TX) & MX) || ((ADX += TX) & MX)) {
                    if (!(--NY & 1023) || (SY += TY) === -1 || (DY += TY) === -1) {
                        break;
                    } else {
                        ASX = SX;
                        ADX = DX;
                        ANX = NX;
                    }
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; this.vram_space[this.VDP_VRMP5(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP5(MXS, ASX, SY)]; post_xxyy(256)
                hmmm_loop(this.VDP_VRMP5.bind(this), 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; this.vram_space[this.VDP_VRMP6(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP6(MXS, ASX, SY)]; post_xxyy(512)
                hmmm_loop(this.VDP_VRMP6.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; this.vram_space[this.VDP_VRMP7(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP7(MXS, ASX, SY)]; post_xxyy(512)
                hmmm_loop(this.VDP_VRMP7.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; this.vram_space[this.VDP_VRMP8(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP8(MXS, ASX, SY)]; post_xxyy(256)
                hmmm_loop(this.VDP_VRMP8.bind(this), 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            if (!NY) {
                SY += TY;
                DY += TY;
            } else if (SY === -1) {
                DY += TY;
            }
            this.cont_reg[42] = NY & 0xFF;
            this.cont_reg[43] = (NY >> 8) & 0x03;
            this.cont_reg[34] = SY & 0xFF;
            this.cont_reg[35] = (SY >> 8) & 0x03;
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
        } else {
            this.mmc.SY = SY;
            this.mmc.DY = DY;
            this.mmc.NY = NY;
            this.mmc.ANX = ANX;
            this.mmc.ASX = ASX;
            this.mmc.ADX = ADX;
        }
    }

    /** ymmm_engine() *********************************************/
    /** Vram -> Vram                                            **/

    /*************************************************************/

    ymmm_engine() {
        let SY = this.mmc.SY;
        const DX = this.mmc.DX;
        let DY = this.mmc.DY;
        const TX = this.mmc.TX;
        const TY = this.mmc.TY;
        let NY = this.mmc.NY;
        let ADX = this.mmc.ADX;
        const MXD = this.mmc.MXD;
        let cnt: int;
        let delta: int;

        delta = this.get_vdp_timing_value(V9938.ymmm_timing);
        cnt = this.vdp_ops_count;

        const ymmm_loop = (vdpVrmp: (MXD: int, ADX: int, DY: int) => int, MX: int) => {
            while ((cnt -= delta) > 0) {
                this.vram_space[vdpVrmp(MXD, ADX, DY)] = this.vram_space[vdpVrmp(MXD, ADX, SY)];
                if ((ADX += TX) & MX) {
                    if (!(--NY & 1023) || (SY += TY) === -1 || (DY += TY) === -1) {
                        break;
                    } else {
                        ADX = DX;
                    }
                }
            }
        };

        switch (this.mode) {
            default:
            case V9938.MODE_GRAPHIC4: // pre_loop; this.vram_space[this.VDP_VRMP5(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP5(MXD, ADX, SY)]; post__xyy(256)
                ymmm_loop(this.VDP_VRMP5.bind(this), 256);
                break;
            case V9938.MODE_GRAPHIC5: // pre_loop; this.vram_space[this.VDP_VRMP6(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP6(MXD, ADX, SY)]; post__xyy(512)
                ymmm_loop(this.VDP_VRMP6.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC6: // pre_loop; this.vram_space[this.VDP_VRMP7(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP7(MXD, ADX, SY)]; post__xyy(512)
                ymmm_loop(this.VDP_VRMP7.bind(this), 512);
                break;
            case V9938.MODE_GRAPHIC7: // pre_loop; this.vram_space[this.VDP_VRMP8(MXD, ADX, DY)] = this.vram_space[this.VDP_VRMP8(MXD, ADX, SY)]; post__xyy(256)
                ymmm_loop(this.VDP_VRMP8.bind(this), 256);
                break;
        }

        if ((this.vdp_ops_count = cnt) > 0) {
            // Command execution done
            this.stat_reg[2] &= 0xFE;
            this.vdp_engine = undefined;
            if (!NY) {
                SY += TY;
                DY += TY;
            } else if (SY === -1) {
                DY += TY;
            }
            this.cont_reg[42] = NY & 0xFF;
            this.cont_reg[43] = (NY >> 8) & 0x03;
            this.cont_reg[34] = SY & 0xFF;
            this.cont_reg[35] = (SY >> 8) & 0x03;
            this.cont_reg[38] = DY & 0xFF;
            this.cont_reg[39] = (DY >> 8) & 0x03;
        } else {
            this.mmc.SY = SY;
            this.mmc.DY = DY;
            this.mmc.NY = NY;
            this.mmc.ADX = ADX;
        }
    }

    /** hmmc_engine() *********************************************/
    /** CPU -> Vram                                             **/

    /*************************************************************/
    hmmc_engine() {
        if ((this.stat_reg[2] & 0x80) !== 0x80) {
            this.vram_space[this.VDP_VRMP(((this.mode >= 5) && (this.mode <= 8)) ? (this.mode - 5) : 0, this.mmc.MXD, this.mmc.ADX, this.mmc.DY)] = this.cont_reg[44];
            this.vdp_ops_count -= this.get_vdp_timing_value(V9938.hmmv_timing);
            this.stat_reg[2] |= 0x80;

            if (!--this.mmc.ANX || ((this.mmc.ADX += this.mmc.TX) & this.mmc.MX)) {
                if (!(--this.mmc.NY & 1023) || (this.mmc.DY += this.mmc.TY) === -1) {
                    this.stat_reg[2] &= 0xFE;
                    this.vdp_engine = undefined;
                    if (!this.mmc.NY) {
                        this.mmc.DY += this.mmc.TY;
                    }
                    this.cont_reg[42] = this.mmc.NY & 0xFF;
                    this.cont_reg[43] = (this.mmc.NY >> 8) & 0x03;
                    this.cont_reg[38] = this.mmc.DY & 0xFF;
                    this.cont_reg[39] = (this.mmc.DY >> 8) & 0x03;
                } else {
                    this.mmc.ADX = this.mmc.DX;
                    this.mmc.ANX = this.mmc.NX;
                }
            }
        }
    }

    /** VDPWrite() ***********************************************/
    /** Use this function to transfer pixel(s) from CPU to m_ **/

    /*************************************************************/
    cpu_to_vdp(V: uint8_t) {
        this.stat_reg[2] &= 0x7F;
        this.stat_reg[7] = this.cont_reg[44] = V;
        if (this.vdp_engine && this.vdp_ops_count > 0) {
            this.vdp_engine();
        }
    }

    /** VDPRead() ************************************************/
    /** Use this function to transfer pixel(s) from VDP to CPU. **/

    /*************************************************************/
    vdp_to_cpu(): uint8_t {
        this.stat_reg[2] &= 0x7F;
        if (this.vdp_engine && (this.vdp_ops_count > 0)) {
            this.vdp_engine();
        }
        return (this.cont_reg[44]);
    }

    /** report_vdp_command() ***************************************/
    /** Report VDP Command to be executed                       **/

    /*************************************************************/
    report_vdp_command(Op: uint8_t) {

        const Ops = [
            "SET ", "AND ", "OR  ", "XOR ", "NOT ", "NOP ", "NOP ", "NOP ",
            "TSET", "TAND", "TOR ", "TXOR", "TNOT", "NOP ", "NOP ", "NOP "
        ];
        const Commands = [
            " ABRT", " ????", " ????", " ????", "POINT", " PSET", " SRCH", " LINE",
            " LMMV", " LMMM", " LMCM", " LMMC", " HMMV", " HMMM", " YMMM", " HMMC"
        ];

        let CL: uint8_t;
        let CM: uint8_t;
        let LO: uint8_t;
        let SX: int;
        let SY: int;
        let DX: int;
        let DY: int;
        let NX: int;
        let NY: int;

        // Fetch arguments
        CL = this.cont_reg[44];
        SX = (this.cont_reg[32] + (this.cont_reg[33] << 8)) & 511;
        SY = (this.cont_reg[34] + (this.cont_reg[35] << 8)) & 1023;
        DX = (this.cont_reg[36] + (this.cont_reg[37] << 8)) & 511;
        DY = (this.cont_reg[38] + (this.cont_reg[39] << 8)) & 1023;
        NX = (this.cont_reg[40] + (this.cont_reg[41] << 8)) & 1023;
        NY = (this.cont_reg[42] + (this.cont_reg[43] << 8)) & 1023;
        CM = Op >> 4;
        LO = Op & 0x0F;

        V9938.LOGMASKED(V9938.LOG_COMMAND, "Opcode %02x %s-%s s=(%d,%d), d=(%d,%d), c=%02x, wh=[%d,%d]%s\n",
            Op, Commands[CM], Ops[LO],
            SX, SY, DX, DY, CL & 0xff, this.cont_reg[45] & 0x04 ? -NX : NX,
            this.cont_reg[45] & 0x08 ? -NY : NY,
            this.cont_reg[45] & 0x70 ? " on ExtVRAM" : ""
        );
    }

    /** VDPDraw() ************************************************/
    /** Perform a given V9938 operation Op.                     **/

    /*************************************************************/
    command_unit_w(Op: uint8_t): uint8_t {
        // V9938 ops only work in SCREENs 5-8
        if (this.mode < 5 || this.mode > 8) {
            return (0);
        }

        const SM: int = this.mode - 5;         // Screen mode index 0..3

        this.mmc.CM = Op >> 4;
        if ((this.mmc.CM & 0x0C) !== 0x0C && this.mmc.CM !== 0) {
            // Dot operation: use only relevant bits of color
            this.stat_reg[7] = (this.cont_reg[44] &= V9938.Mask[SM]);
        }

        //  if(Verbose&0x02)
        this.report_vdp_command(Op);

        if ((this.vdp_engine !== undefined) && (this.mmc.CM !== V9938.CM_ABRT)) {
            V9938.LOGMASKED(V9938.LOG_WARN, "Command overrun; previous command not completed\n");
        }

        switch (Op >> 4) {
            case V9938.CM_ABRT:
                this.stat_reg[2] &= 0xFE;
                this.vdp_engine = undefined;
                return 1;
            case V9938.CM_POINT:
                this.stat_reg[2] &= 0xFE;
                this.vdp_engine = undefined;
                this.stat_reg[7] = this.cont_reg[44] =
                    this.VDP_POINT(SM, (this.cont_reg[45] & 0x10) !== 0 ? 1 : 0,
                        this.cont_reg[32] + (this.cont_reg[33] << 8),
                        this.cont_reg[34] + (this.cont_reg[35] << 8));
                return 1;
            case V9938.CM_PSET:
                this.stat_reg[2] &= 0xFE;
                this.vdp_engine = undefined;
                this.VDP_PSET(SM, (this.cont_reg[45] & 0x20) !== 0 ? 1 : 0,
                    this.cont_reg[36] + (this.cont_reg[37] << 8),
                    this.cont_reg[38] + (this.cont_reg[39] << 8),
                    this.cont_reg[44],
                    Op & 0x0F);
                return 1;
            case V9938.CM_SRCH:
                this.vdp_engine = this.srch_engine;
                break;
            case V9938.CM_LINE:
                this.vdp_engine = this.line_engine;
                break;
            case V9938.CM_LMMV:
                this.vdp_engine = this.lmmv_engine;
                break;
            case V9938.CM_LMMM:
                this.vdp_engine = this.lmmm_engine;
                break;
            case V9938.CM_LMCM:
                this.vdp_engine = this.lmcm_engine;
                break;
            case V9938.CM_LMMC:
                this.vdp_engine = this.lmmc_engine;
                break;
            case V9938.CM_HMMV:
                this.vdp_engine = this.hmmv_engine;
                break;
            case V9938.CM_HMMM:
                this.vdp_engine = this.hmmm_engine;
                break;
            case V9938.CM_YMMM:
                this.vdp_engine = this.ymmm_engine;
                break;
            case V9938.CM_HMMC:
                this.vdp_engine = this.hmmc_engine;
                break;
            default:
                V9938.LOGMASKED(V9938.LOG_WARN, "Unrecognized opcode %02Xh\n", Op);
                return (0);
        }

        // Fetch unconditional arguments
        this.mmc.SX = (this.cont_reg[32] + (this.cont_reg[33] << 8)) & 511;
        this.mmc.SY = (this.cont_reg[34] + (this.cont_reg[35] << 8)) & 1023;
        this.mmc.DX = (this.cont_reg[36] + (this.cont_reg[37] << 8)) & 511;
        this.mmc.DY = (this.cont_reg[38] + (this.cont_reg[39] << 8)) & 1023;
        this.mmc.NY = (this.cont_reg[42] + (this.cont_reg[43] << 8)) & 1023;
        this.mmc.TY = this.cont_reg[45] & 0x08 ? -1 : 1;
        this.mmc.MX = V9938.PPL[SM];
        this.mmc.CL = this.cont_reg[44];
        this.mmc.LO = Op & 0x0F;
        this.mmc.MXS = (this.cont_reg[45] & 0x10) !== 0 ? 1 : 0;
        this.mmc.MXD = (this.cont_reg[45] & 0x20) !== 0 ? 1 : 0;

        // Argument depends on uint8_t or dot operation
        if ((this.mmc.CM & 0x0C) === 0x0C) {
            this.mmc.TX = this.cont_reg[45] & 0x04 ? -V9938.PPB[SM] : V9938.PPB[SM];
            this.mmc.NX = ((this.cont_reg[40] + (this.cont_reg[41] << 8)) & 1023) / V9938.PPB[SM];
        } else {
            this.mmc.TX = this.cont_reg[45] & 0x04 ? -1 : 1;
            this.mmc.NX = (this.cont_reg[40] + (this.cont_reg[41] << 8)) & 1023;
        }

        // X loop variables are treated specially for LINE command
        if (this.mmc.CM === V9938.CM_LINE) {
            this.mmc.ASX = ((this.mmc.NX - 1) >> 1);
            this.mmc.ADX = 0;
        } else {
            this.mmc.ASX = this.mmc.SX;
            this.mmc.ADX = this.mmc.DX;
        }

        // NX loop variable is treated specially for SRCH command
        if (this.mmc.CM === V9938.CM_SRCH) {
            this.mmc.ANX = (this.cont_reg[45] & 0x02) !==  0 ? 1 : 0; // Do we look for "===" or "!="?
        } else {
            this.mmc.ANX = this.mmc.NX;
        }

        // Command execution started
        this.stat_reg[2] |= 0x01;

        // Start execution if we still have time slices
        if (this.vdp_engine && this.vdp_ops_count > 0) {
            this.vdp_engine();
        }

        // Operation successfully initiated
        return (1);
    }

    /** LoopVDP() ************************************************
     Run X steps of active VDP command
     *************************************************************/
    update_command() {
        if (this.vdp_ops_count <= 0) {
            this.vdp_ops_count += 13662;
            if (this.vdp_engine && this.vdp_ops_count > 0) {
                this.vdp_engine();
            }
        } else {
            this.vdp_ops_count = 13662;
            if (this.vdp_engine) {
                this.vdp_engine();
            }
        }
    }

    device_post_load() { // TODO: is there a better way to restore this?
        switch (this.mmc.CM) {
            case V9938.CM_ABRT:
            case V9938.CM_POINT:
            case V9938.CM_PSET:
                this.vdp_engine = undefined;
                break;
            case V9938.CM_SRCH:
                this.vdp_engine = this.srch_engine;
                break;
            case V9938.CM_LINE:
                this.vdp_engine = this.line_engine;
                break;
            case V9938.CM_LMMV:
                this.vdp_engine = this.lmmv_engine;
                break;
            case V9938.CM_LMMM:
                this.vdp_engine = this.lmmm_engine;
                break;
            case V9938.CM_LMCM:
                this.vdp_engine = this.lmcm_engine;
                break;
            case V9938.CM_LMMC:
                this.vdp_engine = this.lmmc_engine;
                break;
            case V9938.CM_HMMV:
                this.vdp_engine = this.hmmv_engine;
                break;
            case V9938.CM_HMMM:
                this.vdp_engine = this.hmmm_engine;
                break;
            case V9938.CM_YMMM:
                this.vdp_engine = this.ymmm_engine;
                break;
            case V9938.CM_HMMC:
                this.vdp_engine = this.hmmc_engine;
                break;
        }
    }
}
