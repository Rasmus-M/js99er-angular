import {CPU} from '../interfaces/cpu';
import {Log} from '../../classes/log';
import {Speech} from '../interfaces/speech';
import {System} from './system';
import {Util} from '../../classes/util';
import {Settings} from '../../classes/settings';
import {TI994A} from './ti994a';

/**********************************************************************************************

     TMS5200/5220 simulator

     @version 12th February 2015
     @author Converted to JavaScript by Rasmus Moustgaard (rasmus.moustgard@gmail.com)

     Written for MAME by Frank Palazzolo
     With help from Neill Corlett
     Additional tweaking by Aaron Giles
     TMS6100 Speech Rom support added by Raphael Nabet
     PRNG code by Jarek Burczynski backported from tms5110.c by Lord Nightmare
     Chirp/excitation table fixes by Lord Nightmare
     Various fixes by Lord Nightmare
     Modularization by Lord Nightmare
     Sub-interpolation-cycle parameter updating added by Lord Nightmare
     Preliminary MASSIVE merge of tms5110 and tms5220 cores by Lord Nightmare
     Lattice Filter, Multiplier, and clipping redone by Lord Nightmare
     TMS5220C multi-rate feature added by Lord Nightmare
     Massive rewrite and reorganization by Lord Nightmare
     Additional IP, PC, subcycle timing rewrite by Lord Nightmare
     Updated based on the chip decaps done by digshadow

     Much information regarding the lpc encoding used here comes from US patent 4,209,844
     US patent 4,331,836 describes the complete 51xx chip
     US patent 4,335,277 describes the complete 52xx chip
     Special Thanks to Larry Brantingham for answering questions regarding the chip details

   TMS5200/TMS5220/TMS5220C/CD2501E/CD2501ECD:

                 +-----------------+
        D7(d0)   |  1           28 |  /RS
        ADD1     |  2           27 |  /WS
        ROMCLK   |  3           26 |  D6(d1)
        VDD(-5)  |  4           25 |  ADD2
        VSS(+5)  |  5           24 |  D5(d2)
        OSC      |  6           23 |  ADD4
        T11      |  7           22 |  D4(d3)
        SPKR     |  8           21 |  ADD8/DATA
        I/O      |  9           20 |  TEST
        PROMOUT  | 10           19 |  D3(d4)
        VREF(GND)| 11           18 |  /READY
        D2(d5)   | 12           17 |  /INT
        D1(d6)   | 13           16 |  M1
        D0(d7)   | 14           15 |  M0
                 +-----------------+
Note the standard naming for d* data bits with 7 as MSB and 0 as LSB is in lowercase.
TI's naming has D7 as LSB and D0 as MSB and is in uppercase

TO-DO:
    * Ever since the big rewrite, there are glitches on certain frame transitions
      for example in the word 'robots' during the eprom attract mode,
      I (LN) am not entirely sure why the real chip doesn't have these as well.
      Needs more real hardware testing/dumps for comparison.
    * Ever since the timing rewrite, the above problem is slightly worse. This
      time, however, it is probably a 'real' bug, which I (LN) am in the process
      of tracking down.
      i.e. the word 'congratulations' in victory when you get a high score.
    * Implement a ready callback for pc interfaces
    - this will be quite a challenge since for it to be really accurate
      the whole emulation has to run in sync (lots of timers) with the
      cpu cores.
    * If a command is still executing, /READY will be kept high until the command has
      finished if the next command is written.
    * tomcat has a 5220 which is not hooked up at all
    * Is the TS=0 forcing energy to 0 for next frame in the interpolator actually correct? I'm (LN) guessing no. The patent schematics state that TS=0 shuts off the output dac completely, though doesn't affect the I/O pin.

Pedantic detail from observation of real chip:
The 5200 and 5220 chips outputs the following coefficients over PROMOUT while
'idle' and not speaking, in this order:
e[0 or f] p[0] k1[0] k2[0] k3[0] k4[0] k5[f] k6[f] k7[f] k8[7] k9[7] k10[7]

Patent notes (important timing info for interpolation):
* TCycle ranges from 1 to 20, is clocked based on the clock input or RC clock
  to the chip / 4. This emulation core completely ignores TCycle, as it isn't
  very relevant.
    Every full TCycle count (i.e. overflow from 20 to 1), Subcycle is
    incremented.
* Subcycle ranges from 0 to 2, reload is 0 in SPKSLOW mode, 1 normally, and
  corresponds to whether an interpolation value is being calculated (0 or 1)
  or being written to ram (2). 0 and 1 correspond to 'A' cycles on the
  patent, while 2 corresponds to 'B' cycles.
    Every Subcycle full count (i.e. overflow from 2 to (0 or 1)), PC is
    incremented. (NOTE: if PC=12, overflow happens on the 1->2 transition,
    not 2->0; PC=12 has no B cycle.)
* PC ranges from 0 to 12, and corresponds to the parameter being interpolated
  or otherwise read from rom using PROMOUT.
  The order is:
  0 = Energy
  1 = Pitch
  2 = K1
  3 = K2
  ...
  11 = K10
  12 = nothing
    Every PC full count (i.e. overflow from 12 to 0), IP (aka "Interpolation Period")
    is incremented.
* IP (aka "Interpolation Period") ranges from 0 to 7, and corresponds with the amount
  of rightshift that the difference between current and target for a given
  parameter will have applied to it, before being added to the current
  parameter. Note that when interpolation is inhibited, only IP=0 will
  cause any change to the current values of the coefficients.
  The order is, after new frame parse (last ip was 0 before parse):
  1 = >>3 (/8)
  2 = >>3 (/8)
  3 = >>3 (/8)
  4 = >>2 (/4)
  5 = >>2 (/4)
  6 = >>1 (/2) (NOTE: the patent has an error regarding this value on one table implying it should be /4, but circuit simulation of parts of the patent shows that the /2 value is correct.)
  7 = >>1 (/2)
  0 = >>0 (/1, forcing current values to equal target values)
    Every IP full count, a new frame is parsed, but ONLY on the 0->*
    transition.
    NOTE: on TMS5220C ONLY, the datasheet IMPLIES the following:
    Upon new frame parse (end of IP=0), the IP is forced to a value depending
    on the TMS5220C-specific rate setting. For rate settings 0, 1, 2, 3, it
    will be forced to 1, 3, 5 or 7 respectively. On non-TMS5220 chips, it
    counts as expected (IP=1 follows IP=0) always.
    This means, the tms5220c with rates set to n counts IP as follows:
    (new frame parse is indicated with a #)
    Rate    IP Count
    00      7 0#1 2 3 4 5 6 7 0#1 2 3 4 5 6 7    <- non-tms5220c chips always follow this pattern
    01      7 0#3 4 5 6 7 0#3 4 5 6 7 0#3 4 5
    10      7 0#5 6 7 0#5 6 7 0#5 6 7 0#5 6 7
    11      7 0#7 0#7 0#7 0#7 0#7 0#7 0#7 0#7
    Based on the behavior tested on the CD2501ECD this is assumed to be the same for that chip as well.

Most of the following is based on figure 8c of 4,331,836, which is the
  TMS5100/TMC0280 patent, but the same information applies to the TMS52xx
  as well.

OLDP is a status flag which controls whether unvoiced or voiced excitation is
  being generated. It is latched from "P=0" at IP=7 PC=12 T=16.
  (This means that, during normal operation, between IP=7 PC=12 T16 and
  IP=0 PC=1 T17, OLDP and P=0 are the same)
"P=0" is a status flag which is set if the index value for pitch for the new
  frame being parsed (which will become the new target frame) is zero.
  It is used for determining whether interpolation of the next frame is
  inhibited or not. It is updated at IP=0 PC=1 T17. See next section.
OLDE is a status flag which is only used for determining whether
  interpolation is inhibited or not.
  It is latched from "E=0" at IP=7 PC=12 T=16.
  (This means that, during normal operation, between IP=7 PC=12 T16 and
  IP=0 PC=0 T17, OLDE and E=0 are the same)
"E=0" is a status flag which is set if the index value for energy for the new
  frame being parsed (which will become the new target frame) is zero.
  It is used for determining whether interpolation of the next frame is
  inhibited or not. It is updated at IP=0 PC=0 T17. See next section.

Interpolation is inhibited (i.e. interpolation at IP frames will not happen
  except for IP=0) under the following circumstances:
  "P=0" != "OLDP" ("P=0" = 1, and OLDP = 0; OR "P=0" = 0, and OLDP = 1)
    This means the new frame is unvoiced and the old one was voiced, or vice
    versa.
* TO-DO the 5100 and 5200 patents are inconsistent about the above. Trace the decaps!
  "OLDE" = 1 and "E=0" = 0
    This means the new frame is not silent, and the old frame was silent.

****Documentation of chip commands:***
    x0x0xbcc : on 5200/5220: NOP (does nothing); on 5220C and CD2501ECD: Select frame length by cc,
    and b selects whether every frame is preceded by 2 bits to select the frame length (instead of using the value set by cc);
    the default (and after a reset command) is as if '0x00' was written, i.e.
    for frame length (200 samples) and 0 for whether the preceding 2 bits are enabled (off)

    x001xxxx: READ BYTE (RDBY) Sends eight read bit commands (M0 high M1 low) to VSM and reads the resulting bits serially into a temporary register,
    which becomes readable as the next byte read from the tms52xx once ready goes active.
    Note the bit order of the byte read from the TMS52xx is BACKWARDS as compared to the actual data order as in the rom on the VSM chips;
    the read byte command of the tms5100 reads the bits in the 'correct' order. This was IMHO a rather silly design decision of TI.
    (I (LN) asked Larry Brantingham about this but he wasn't involved with the TMS52xx chips, just the 5100);
    There's ASCII data in the TI 99/4 speech module VSMs which has the bit order reversed on purpose because of this!
    TALK STATUS must be CLEAR for this command to work; otherwise it is treated as a NOP.

    x011xxxx: READ AND BRANCH (RB) Sends a read and branch command (M0 high, M1 high) to force VSM to set its data pointer to whatever the data is at its current pointer location is)
    TALK STATUS must be CLEAR for this command to work; otherwise it is treated as a NOP.

    x100aaaa: LOAD ADDRESS (LA) Send a load address command (M0 low M1 high) to VSM with the 4 'a' bits; Note you need to send four or five of these in sequence to actually specify an address to the vsm.
    TALK STATUS must be CLEAR for this command to work; otherwise it is treated as a NOP.

    x101xxxx: SPEAK (SPK) Begins speaking, pulling spech data from the current address pointer location of the VSM modules.

    x110xxxx: SPEAK EXTERNAL (SPKEXT) Clears the FIFO using SPKEE line, then sets TALKD (TALKST remains zero) until 8 bytes have been written to the FIFO, at which point it begins speaking, pulling data from the 16 byte fifo.
    The patent implies TALK STATUS must be CLEAR for this command to work; otherwise it is treated as a NOP, but the decap shows that this is not true, and is an error on the patent diagram.

    x111xxxx: RESET (RST) Resets the speech synthesis core immediately, and clears the FIFO.


    Other chip differences:
    The 5220C (and CD2501ECD maybe?) are quieter due to a better dac arrangement on die which allows less crossover between bits, based on the decap differences.


***MAME Driver specific notes:***

    Victory's initial audio selftest is pretty brutal to the FIFO: it sends a
    sequence of bytes to the FIFO and checks the status bits after each one; if
    even one bit is in the wrong state (i.e. speech starts one byte too early or
    late), the test fails!
    The sample in Victory 'Shields up!' after you activate shields, the 'up' part
    of the sample is missing the STOP frame at the end of it; this causes the
    speech core to run out of bits to parse from the FIFO, cutting the sample off
    by one frame. This appears to be an original game code bug.

Progress list for drivers using old vs new interface:
starwars: uses new interface (couriersud)
gauntlet: uses new interface (couriersud)
atarisy1: uses new interface (Lord Nightmare)
atarisy2: uses new interface (Lord Nightmare)
atarijsa: uses new interface (Lord Nightmare)
firefox: uses new interface (couriersud)
mhavoc: uses old interface, and is in the machine file instead of the driver.
monymony/jackrabt(zaccaria.c): uses new interface (couriersud)
victory(audio/exidy.c): uses new interface (couriersud)
looping: uses old interface
portraits: uses *NO* interface; the i/o cpu hasn't been hooked to anything!
dotron and midwayfb(mcr.c): uses old interface


As for which games used which chips:

TMS5200 AKA TMC0285 AKA CD2501E: (1980 to 1983)
    Arcade: Zaccaria's 'money money' and 'jack rabbit'; Bally/Midway's
'Discs of Tron' (all environmental cabs and a few upright cabs; the code
exists on all versions for the speech though, and upright cabs can be
upgraded to add it by hacking on a 'Squawk & Talk' pinball speech board
(which is also TMS5200 based) with a few modded components)
    Pinball: All Bally/Midway machines which uses the 'Squawk & Talk' board.
    Home computer: TI 99/4 PHP1500 Speech module (along with two VSM
serial chips); Street Electronics Corp.'s Apple II 'Echo 2' Speech
synthesizer (early cards only)

CD2501ECD: (1983)
    Home computer: TI 99/8 (prototypes only)

TMS5220: (mostly on things made between 1981 and 1984-1985)
    Arcade: Bally/Midway's 'NFL Football'; Atari's 'Star Wars',
'Firefox', 'Return of the Jedi', 'Road Runner', 'The Empire Strikes
Back' (all verified with schematics); Venture Line's 'Looping' and 'Sky
Bumper' (need verify for both); Olympia's 'Portraits' (need verify);
Exidy's 'Victory' and 'Victor Banana' (need verify for both)
    Pinball: Several (don't know names offhand, have not checked schematics; likely Zaccaria's 'Farfalla')
    Home computer: Street Electronics Corp.'s Apple II 'Echo 2' Speech
synthesizer (later cards only); Texas Instruments' 'Speak and Learn'
scanner wand unit.

TMS5220C AKA TSP5220C: (on stuff made from 1984 to 1992 or so)
    Arcade: Atari's 'Indiana Jones and the Temple of Doom', '720',
'Gauntlet', 'Gauntlet II', 'A.P.B.', 'Paperboy', 'RoadBlasters',
'Vindicators Pt II'(verify?), and 'Escape from the Planet of the Robot
Monsters' (all verified except for vindicators pt 2)
    Pinball: Several (less common than the tms5220? (not sure about
this), mostly on later pinballs with LPC speech)
    Home computer: Street Electronics Corp.'s 'ECHO' parallel/hobbyist
module (6511 based), IBM PS/2 Speech adapter (parallel port connection
device), PES Speech adapter (serial port connection)

Street electronics had a later 1989-era ECHO appleII card which is TSP50c0x/1x
MCU based speech and not tms5xxx based (though it is likely emulating the tms5220
in MCU code). Look for a 16-pin chip at U6 labeled "ECHO-3 SN".

***********************************************************************************************/

export class TMS5200 implements Speech {

    static ROM = System.SPEECH_ROM;
    static ROM_LENGTH = 0x8000;

    /* HACK?: if defined, outputs the low 4 bits of the lattice filter to the i/o
     * or clip logic, even though the real hardware doesn't do this, partially verified by decap */
    static ALLOW_4_LSB = false;

    /* *****configuration of chip connection stuff***** */
    /* must be defined; if 0, output the waveform as if it was tapped on the speaker pin as usual, if 1, output the waveform as if it was tapped on the i/o pin (volume is much lower in the latter case) */
    static FORCE_DIGITAL = false;

    /* must be defined; if 1, normal speech (one A cycle, one B cycle per interpolation step); if 0; speak as if SPKSLOW was used (two A cycles, one B cycle per interpolation step) */
    static FORCE_SUBC_RELOAD = 1;

    static FIFO_SIZE = 32; // RM: Changed from 16 to prevent running out of bits in the FIFO

    static HAS_RATE_CONTROL = false;

    static USE_JAVASCRIPT_RNG = true;

    static SAMPLE_RATE = 8000;

    // Sample count reload for 5220c and cd2501ecd only; 5200 and 5220 always reload with 0;
    // keep in mind this is loaded on IP=0 PC=12 subcycle=1 so it immediately will increment after one sample,
    // effectively being 1,3,5,7 as in the comments above.
    static reload_table = [0, 2, 4, 6];

    /*
     The TMS5200CNL was decapped and imaged by digshadow in March, 2013.
     It is equivalent to the CD2501E (internally: "TMC0285") chip used
     on the TI 99/4(A) speech module.
     The LPC table is verified to match the decap.
     (It was previously dumped with PROMOUT which matches as well)
     The chirp table is verified to match the decap. (sum = 0x3da)
     Note that the K coefficients are VERY different from the coefficients given
     in the US 4,335,277 patent, which may have been for some sort of prototype or
     otherwise intentionally scrambled. The energy and pitch tables, however, are
     identical to that patent.
     Also note, that the K coefficients are ALMOST identical to the coefficients from the CD2802.
     The interpolation coefficients still come from the patents pending verification
     of the interpolation counter circuit from the chip decap image.
     NOTE FROM DECAP: immediately to the left of each of the K1,2,3,4,5,and 6
     coefficients in the LPC rom are extra columns containing the constants
     -510, -502, 313, 318, or in hex 0x202, 0x20A, 0x139, 0x13E.
     Those EXACT constants DO appear (rather nonsensically) on the lpc table in US
     patent 4,335,277. They don't seem to do anything except take up space and may
     be a leftover from an older design predating even the patent.
     */

    static coeff = {
        subtype: 8,
        num_k: 10,
        energy_bits: 4,
        pitch_bits: 6,
        kbits: [5, 5, 4, 4, 4, 4, 4, 3, 3, 3],
        /* E */
        energytable: [0, 1, 2, 3, 4, 6, 8, 11, 16, 23, 33, 47, 63, 85, 114, 0],
        /* P */
        pitchtable: [0, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28,
            29, 30, 31, 32, 34, 36, 38, 40,
            41, 43, 45, 48, 49, 51, 54, 55,
            57, 60, 62, 64, 68, 72, 74, 76,
            81, 85, 87, 90, 96, 99, 103, 107,
            112, 117, 122, 127, 133, 139, 145, 151,
            157, 164, 171, 178, 186, 194, 202, 211],
        ktable: [
            /* K1 */
            [-501, -498, -495, -490, -485, -478, -469, -459,
                -446, -431, -412, -389, -362, -331, -295, -253,
                -207, -156, -102, -45, 13, 70, 126, 179,
                228, 272, 311, 345, 374, 399, 420, 437],
            /* K2 */
            [-376, -357, -335, -312, -286, -258, -227, -195,
                -161, -124, -87, -49, -10, 29, 68, 106,
                143, 178, 212, 243, 272, 299, 324, 346,
                366, 384, 400, 414, 427, 438, 448, 506],
            /* K3 */
            [-407, -381, -349, -311, -268, -218, -162, -102,
                -39, 25, 89, 149, 206, 257, 302, 341],
            /* K4 */
            [-290, -252, -209, -163, -114, -62, -9, 44,
                97, 147, 194, 238, 278, 313, 344, 371],
            /* K5 */
            [-318, -283, -245, -202, -156, -107, -56, -3,
                49, 101, 150, 196, 239, 278, 313, 344],
            /* K6 */
            [-193, -152, -109, -65, -20, 26, 71, 115,
                158, 198, 235, 270, 301, 330, 355, 377],
            /* K7 */
            [-254, -218, -180, -140, -97, -53, -8, 36,
                81, 124, 165, 204, 240, 274, 304, 332],
            /* K8 */
            [-205, -112, -10, 92, 187, 269, 336, 387],
            /* K9 */
            [-249, -183, -110, -32, 48, 126, 198, 261], // verified from decap; on the cd2802 patent the 4th entry is -19 (patent typo?)
            /* K10 */
            [-190, -133, -73, -10, 53, 115, 173, 227]
        ],
        /* Chirp table */
        chirptable: [0x00, 0x03, 0x0F, 0x28, 0x4C, 0x6C, 0x71, 0x50,
            0x25, 0x26, 0x4C, 0x44, 0x1A, 0x32, 0x3B, 0x13,
            0x37, 0x1A, 0x25, 0x1F, 0x1D, 0x00, 0x00, 0x00,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0 ],
        /* interpolation coefficients */
        interp_coeff: [ 0, 3, 3, 3, 2, 2, 1, 1 ]
    };

    private console: TI994A;
    private cpu: CPU;
    private enabled: boolean;

    private m_coeff: any = TMS5200.coeff;
    private m_speak_external: boolean;
    private m_talk_status: boolean;
    private m_speaking_now: boolean;
    private m_buffer_low: boolean;
    private m_buffer_empty: boolean;
    private m_schedule_dummy_read: boolean;
    private m_fifo_count: number;
    private m_fifo_tail: number;
    private m_fifo: Uint8Array;
    private m_subcycle: number;
    private m_subc_reload: number;
    private m_c_letiant_rate: number;
    private m_PC: number;
    private m_IP: number;
    private m_new_frame_energy_idx: number;
    private m_new_frame_pitch_idx: number;
    private m_new_frame_k_idx: Uint8Array;
    private m_RDB_flag: boolean;
    private m_data_register: number;
    private m_OLDE: boolean;
    private m_OLDP: boolean;
    private m_inhibit: boolean;
    private m_target_energy: number;
    private m_target_pitch: number;
    private m_target_k: Int16Array;
    private m_current_k: Int16Array;
    private m_RNG: number;
    private m_excitation_data: number;
    private m_u: Int32Array;
    private m_x: Int32Array;
    private m_digital_select: boolean;
    private m_speechROMaddr: number;
    private m_load_pointer: number;
    private m_ROM_bits_count: number;
    private m_irq_pin: number;
    private m_io_ready: boolean;
    private m_irq_handler: (object) => void;
    private m_readyq_handler: (object) => void;
    private m_fifo_bits_taken: number;
    private m_fifo_head: number;
    private m_pitch_count: number;
    private m_current_pitch: number;
    private m_previous_energy: number;
    private m_current_energy: number;
    private m_ready_pin: boolean;

    private log: Log = Log.getLog();

    constructor(console: TI994A, settings: Settings) {
        this.console = console;
        this.enabled = settings.isSpeechEnabled();
    }

    /**********************************************************************************************

     JS99'er interface

    ***********************************************************************************************/

    setCPU(cpu: CPU) {
        this.cpu = cpu;
    }

    reset() {
        this.cpu = this.console.getCPU();
        this.m_coeff = TMS5200.coeff;
        // this.m_speak_external = false;
        // this.m_talk_status = false;
        // this.m_speaking_now = false;
        // this.m_buffer_low = true;
        // this.m_buffer_empty = true;
        // this.m_schedule_dummy_read = false;
        // this.m_fifo_count = 0;
        // this.m_fifo_tail = 0;
        // this.m_fifo = new Uint8Array(TMS5220.FIFO_SIZE);
        // this.m_subcycle = 0;
        // this.m_subc_reload = 0;
        // this.m_c_letiant_rate = 0;
        // this.m_PC = 0;
        // this.m_IP = 0;
        // this.m_new_frame_energy_idx = 0;
        // this.m_new_frame_pitch_idx = 0;
        // this.m_new_frame_k_idx = new Uint8Array(10);
        // this.m_RDB_flag = false;
        // this.m_data_register = 0;
        // this.m_OLDE = false;
        // this.m_OLDP = false;
        // this.m_inhibit = false;
        // this.m_target_energy = 0;
        // this.m_target_pitch = 0;
        // this.m_target_k = new Int16Array(10);
        // this.m_current_k = new Int16Array(10);
        // this.m_RNG = 0;
        // this.m_excitation_data = 0;
        // this.m_u = new Int32Array(11);
        // this.m_x = new Int32Array(10);
        // this.m_digital_select = false;
        // this.m_speechROMaddr = 0;
        // this.m_load_pointer = 0;
        // this.m_ROM_bits_count = 0;
        // this.m_irq_pin = 0;
        // this.m_io_ready = true;
        // this.m_irq_handler = null;
        // this.m_readyq_handler = null;
        this.device_reset();
    }

    writeSpeechData(b: number) {
        if (this.enabled) {
            this.data_write(b);
        }
    }

    readSpeechData(): number {
        return this.enabled ? this.status_read() : 0;
    }

    setSpeechEnabled(enabled) {
        this.enabled = enabled;
    }

    update(buffer: Int16Array, length: number) {
        this.process(buffer, length);
    }

    /**********************************************************************************************

     tms5220_data_write -- handle a write to the TMS5220

    ***********************************************************************************************/

    private data_write(data: number) {
        if (this.m_speak_external) { // If we're in speak external mode
            this.log.debug("External speech: " + Util.toHexByte(data));
            // add this byte to the FIFO
            if (this.m_fifo_count < TMS5200.FIFO_SIZE) {
                this.m_fifo[this.m_fifo_tail] = data;
                this.m_fifo_tail = (this.m_fifo_tail + 1) % TMS5200.FIFO_SIZE;
                this.m_fifo_count++;

                this.update_status_and_ints();

                if (!this.m_talk_status && !this.m_buffer_low) { // we just unset buffer low with that last write, and talk status *was* zero...
                    this.log.info("Begin talking");
                    let i;
                    // ...then we now have enough bytes to start talking; clear out the new frame parameters (it will become old frame just before the first call to parse_frame() )
                    this.m_subcycle = this.m_subc_reload;
                    this.m_PC = 0;
                    this.m_IP = TMS5200.reload_table[this.m_c_letiant_rate & 0x3]; // is this correct? should this be always 7 instead, so that the new frame is loaded quickly?
                    this.m_new_frame_energy_idx = 0;
                    this.m_new_frame_pitch_idx = 0;
                    for (i = 0; i < 4; i++) {
                        this.m_new_frame_k_idx[i] = 0;
                    }
                    for (i = 4; i < 7; i++) {
                        this.m_new_frame_k_idx[i] = 0xF;
                    }
                    for (i = 7; i < this.m_coeff.num_k; i++) {
                        this.m_new_frame_k_idx[i] = 0x7;
                    }
                    this.m_talk_status = this.m_speaking_now = true;
                }
            } else {
                this.log.warn("data_write: Ran out of room in the tms52xx FIFO! this should never happen!");
                // at this point, /READY should remain HIGH/inactive until the fifo has at least one byte open in it.
            }
        } else { // (! m_speak_external)
            // R Nabet : we parse commands at once.  It is necessary for such commands as read.
            this.process_command(data);
        }
    }

    /**********************************************************************************************

     update_status_and_ints -- check to see if the letious flags should be on or off
     Description of flags, and their position in the status register:
     From the data sheet:
     bit D0(bit 7) = TS - Talk Status is active (high) when the VSP is processing speech data.
     Talk Status goes active at the initiation of a Speak command or after nine
     bytes of data are loaded into the FIFO following a Speak External command. It
     goes inactive (low) when the stop code (Energy=1111) is processed, or
     immediately by a buffer empty condition or a reset command.
     bit D1(bit 6) = BL - Buffer Low is active (high) when the FIFO buffer is more than half empty.
     Buffer Low is set when the "Last-In" byte is shifted down past the half-full
     boundary of the stack. Buffer Low is cleared when data is loaded to the stack
     so that the "Last-In" byte lies above the half-full boundary and becomes the
     eighth data byte of the stack.
     bit D2(bit 5) = BE - Buffer Empty is active (high) when the FIFO buffer has run out of data
     while executing a Speak External command. Buffer Empty is set when the last bit
     of the "Last-In" byte is shifted out to the Synthesis Section. This causes
     Talk Status to be cleared. Speech is terminated at some abnormal point and the
     Speak External command execution is terminated.

     ***********************************************************************************************/

    private update_status_and_ints() {

        /* update flags and set ints if needed */

        this.update_ready_state();

        /* BL is set if neither byte 9 nor 8 of the fifo are in use; this
         translates to having fifo_count (which ranges from 0 bytes in use to 16
         bytes used) being less than or equal to 8. Victory/Victorba depends on this. */
        if (this.m_fifo_count <= 8) { // RM: Using TMS5220.FIFO_SIZE / 2 doesn't work with XB CALL SAY(,A$)
            // generate an interrupt if necessary; if /BL was inactive and is now active, set int.
            if (!this.m_buffer_low) {
                this.set_interrupt_state(1);
            }
            this.m_buffer_low = true;
        } else {
            this.m_buffer_low = false;
        }

        /* BE is set if neither byte 15 nor 14 of the fifo are in use; this
         translates to having fifo_count equal to exactly 0 */
        if (this.m_fifo_count === 0) {
            // generate an interrupt if necessary; if /BE was inactive and is now active, set int.
            if (!this.m_buffer_empty) {
                this.set_interrupt_state(1);
            }
            this.m_buffer_empty = true;
        } else {
            this.m_buffer_empty = false;
        }

        /* TS is talk status and is set elsewhere in the fifo parser and in
         the SPEAK command handler; however, if /BE is true during speak external
         mode, it is immediately unset here. */
        if (this.m_speak_external && this.m_buffer_empty) {
            // generate an interrupt: /TS was active, and is now inactive.
            if (this.m_talk_status) {
                this.m_talk_status = this.m_speak_external = false;
                this.set_interrupt_state(1);
            }
        }
        /* Note that TS being unset will also generate an interrupt when a STOP
         frame is encountered; this is handled in the sample generator code and not here */
    }

    /**********************************************************************************************

     extract_bits -- extract a specific number of bits from the current input stream (FIFO or VSM)

     ***********************************************************************************************/

    private extract_bits(count: number): number {
        let val = 0;

        if (this.m_speak_external) {
            // extract from FIFO
            while (count-- > 0) {
                val = (val << 1) | ((this.m_fifo[this.m_fifo_head] >> this.m_fifo_bits_taken) & 1);
                this.m_fifo_bits_taken++;
                if (this.m_fifo_bits_taken >= 8) {
                    this.m_fifo_count--;
                    this.m_fifo[this.m_fifo_head] = 0; // zero the newly depleted fifo head byte
                    this.m_fifo_head = (this.m_fifo_head + 1) % TMS5200.FIFO_SIZE;
                    this.m_fifo_bits_taken = 0;
                    this.update_status_and_ints();
                }
            }
        } else {
            // extract from VSM (speech ROM)
            val = this.rom_read(count);
        }

        return val;
    }

    /**********************************************************************************************

     tms5220_status_read -- read status or data from the TMS5220

     ***********************************************************************************************/

    private status_read(): number {
        if (this.m_RDB_flag) {
            /* if last command was read, return data register */
            this.m_RDB_flag = false;
            this.log.info("Read speech data at " + Util.toHexWord(this.m_speechROMaddr - 1) + ": " + Util.toHexByte(this.m_data_register));
            return this.m_data_register;
        } else {   /* read status */
            /* clear the interrupt pin on status read */
            this.set_interrupt_state(0);
            const status = ((this.m_talk_status ? 1 : 0) << 7) | ((this.m_buffer_low ? 1 : 0) << 6) | ((this.m_buffer_empty ? 1 : 0) << 5);
            this.log.debug("Speech: read status " + Util.toHexByte(status));
            return ((this.m_talk_status ? 1 : 0) << 7) | ((this.m_buffer_low ? 1 : 0) << 6) | ((this.m_buffer_empty ? 1 : 0) << 5);
        }
    }

    /**********************************************************************************************

     tms5220_ready_read -- returns the ready state of the TMS5220

     ***********************************************************************************************/

    private ready_read(): boolean {
        return ((this.m_fifo_count < TMS5200.FIFO_SIZE) || (!this.m_speak_external)) && this.m_io_ready;
    }

    /**********************************************************************************************

     tms5220_cycles_to_ready -- returns the number of cycles until ready is asserted
     NOTE: this function is deprecated and is known to be VERY inaccurate.
     Use at your own peril!

     ***********************************************************************************************/

    private cycles_to_ready(): number {
        let answer;


        if (this.ready_read()) {
            answer = 0;
        } else {
            let val;
            const samples_per_frame = this.m_subc_reload ? 200 : 304; // either (13 A cycles + 12 B cycles) * 8 interps for normal SPEAK/SPKEXT, or (13*2 A cycles + 12 B cycles) * 8 interps for SPKSLOW
            const current_sample = ((this.m_PC * (3 - this.m_subc_reload)) + ((this.m_subc_reload ? 38 : 25) * this.m_IP));
            answer = samples_per_frame - current_sample + 8;

            // total number of bits available in current byte is (8 - m_fifo_bits_taken)
            // if more than 4 are available, we need to check the energy
            if (this.m_fifo_bits_taken < 4) {
                // read energy
                val = (this.m_fifo[this.m_fifo_head] >> this.m_fifo_bits_taken) & 0xf;
                if (val === 0) {
                    /* 0 -> silence frame: we will only read 4 bits, and we will
                     * therefore need to read another frame before the FIFO is not
                     * full any more */
                    answer += this.m_subc_reload ? 200 : 304;
                    /* 15 -> stop frame, we will only read 4 bits, but the FIFO will
                     * we cleared; otherwise, we need to parse the repeat flag (1 bit)
                     * and the pitch (6 bits), so everything will be OK. */
                }
            }
        }

        return answer;
    }

    /**********************************************************************************************

     tms5220_int_read -- returns the interrupt state of the TMS5220

     ***********************************************************************************************/

    int_read(): number {
        return this.m_irq_pin;
    }

    /**********************************************************************************************

     tms5220_process -- fill the buffer with a specific number of samples

     ***********************************************************************************************/

    private process(buffer: Int16Array, size: number) {
        let buf_count = 0;
        let i, bitout, zpar;
        let this_sample;

        /* the following gotos are probably safe to remove */
        /* if we're empty and still not speaking, fill with nothingness */
        // if (!this.m_speaking_now) {
        //     goto empty;
        // }

        /* if speak external is set, but talk status is not (yet) set, wait for buffer low to clear */
        // if (!this.m_talk_status && this.m_speak_external && this.m_buffer_low) {
        //     goto empty;
        // }

        if (this.m_speaking_now && !(!this.m_talk_status && this.m_speak_external && this.m_buffer_low)) {

            /* loop until the buffer is full or we've stopped speaking */
            while ((size > 0) && this.m_speaking_now) {
                /* if it is the appropriate time to update the old energy/pitch idxes,
                 * i.e. when IP=7, PC=12, T=17, subcycle=2, do so. Since IP=7 PC=12 T=17
                 * is JUST BEFORE the transition to IP=0 PC=0 T=0 sybcycle=(0 or 1),
                 * which happens 4 T-cycles later), we change on the latter.*/
                if ((this.m_IP === 0) && (this.m_PC === 0) && (this.m_subcycle < 2)) {
                    this.m_OLDE = (this.m_new_frame_energy_idx === 0);
                    this.m_OLDP = (this.m_new_frame_pitch_idx === 0);
                }

                /* if we're ready for a new frame to be applied, i.e. when IP=0, PC=12, Sub=1
                 * (In reality, the frame was really loaded incrementally during the entire IP=0
                 * PC=x time period, but it doesn't affect anything until IP=0 PC=12 happens)
                 */
                if ((this.m_IP === 0) && (this.m_PC === 12) && (this.m_subcycle === 1)) {
                    /* appropriately override the interp count if needed; this will be incremented after the frame parse! */
                    this.m_IP = TMS5200.reload_table[this.m_c_letiant_rate & 0x3];

                    /* if the talk status was clear last frame, halt speech now. */
                    if (!this.m_talk_status) {
                        this.m_speaking_now = false; // finally halt speech
                        // goto empty;
                        break;
                    }

                    /* Parse a new frame into the new_target_energy, new_target_pitch and new_target_k[] */
                    this.parse_frame();

                    /* if the new frame is a stop frame, set an interrupt and set talk status to 0 */
                    const NEW_FRAME_STOP_FLAG = (this.m_new_frame_energy_idx === 0xF);     // 1 if this is a stop (Energy = 0xF) frame
                    if (NEW_FRAME_STOP_FLAG) {
                        this.m_talk_status = this.m_speak_external = false;
                        this.set_interrupt_state(1);
                        this.update_status_and_ints();
                    }

                    /* in all cases where interpolation would be inhibited, set the inhibit flag; otherwise clear it.
                     Interpolation inhibit cases:
                     * Old frame was voiced, new is unvoiced
                     * Old frame was silence/zero energy, new has nonzero energy
                     * Old frame was unvoiced, new is voiced (note this is the case on the patent but may not be correct on the real final chip)
                     */
                    const OLD_FRAME_SILENCE_FLAG = this.m_OLDE;   // 1 if E=0, 0 otherwise.
                    const OLD_FRAME_UNVOICED_FLAG = this.m_OLDP;  // 1 if P=0 (unvoiced), 0 if voiced
                    const NEW_FRAME_SILENCE_FLAG = (this.m_new_frame_energy_idx === 0);    // ditto as above
                    const NEW_FRAME_UNVOICED_FLAG = (this.m_new_frame_pitch_idx === 0);    // ditto as above
                    if (
                        (!OLD_FRAME_UNVOICED_FLAG && NEW_FRAME_UNVOICED_FLAG)
                        || (OLD_FRAME_UNVOICED_FLAG && !NEW_FRAME_UNVOICED_FLAG) /* this line needs further investigation, starwars tie fighters may sound better without it */
                        || (OLD_FRAME_SILENCE_FLAG && !NEW_FRAME_SILENCE_FLAG)
                    ) {
                        this.m_inhibit = true;
                    } else { // normal frame, normal interpolation
                        this.m_inhibit = false;
                    }

                    /* load new frame targets from tables, using parsed indices */
                    this.m_target_energy = this.m_coeff.energytable[this.m_new_frame_energy_idx];
                    this.m_target_pitch = this.m_coeff.pitchtable[this.m_new_frame_pitch_idx];
                    zpar = NEW_FRAME_UNVOICED_FLAG ? 1 : 0; // find out if parameters k5-k10 should be zeroed
                    for (i = 0; i < 4; i++) {
                        this.m_target_k[i] = this.m_coeff.ktable[i][this.m_new_frame_k_idx[i]];
                    }
                    for (i = 4; i < this.m_coeff.num_k; i++) {
                        this.m_target_k[i] = (this.m_coeff.ktable[i][this.m_new_frame_k_idx[i]] * (1 - zpar));
                    }

                    /* if TS is now 0, ramp the energy down to 0. Is this really correct to hardware? */
                    if (!this.m_talk_status) {
                        this.m_target_energy = 0;
                    }
                } else { // Not a new frame, just interpolate the existing frame.
                    const inhibit_state = this.m_inhibit && (this.m_IP !== 0) ? 1 : 0; // disable inhibit when reaching the last interp period, but don't overwrite the m_inhibit value
                    // Updates to parameters only happen on subcycle '2' (B cycle) of PCs.
                    if (this.m_subcycle === 2) {
                        switch (this.m_PC) {
                            case 0: /* PC = 0, B cycle, write updated energy */
                                this.m_current_energy += (((this.m_target_energy - this.m_current_energy) * (1 - inhibit_state)) >> this.m_coeff.interp_coeff[this.m_IP]);
                                break;
                            case 1: /* PC = 1, B cycle, write updated pitch */
                                this.m_current_pitch += (((this.m_target_pitch - this.m_current_pitch) * (1 - inhibit_state)) >> this.m_coeff.interp_coeff[this.m_IP]);
                                break;
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                            case 10:
                            case 11:
                                /* PC = 2 through 11, B cycle, write updated K1 through K10 */
                                this.m_current_k[this.m_PC - 2] += (((this.m_target_k[this.m_PC - 2] - this.m_current_k[this.m_PC - 2]) * (1 - inhibit_state)) >> this.m_coeff.interp_coeff[this.m_IP]);
                                break;
                            case 12: /* PC = 12, do nothing */
                                break;
                        }
                    }
                }

                // calculate the output
                if (this.m_OLDP) {
                    // generate unvoiced samples here
                    if ((this.m_RNG & 1) !== 0) {
                        this.m_excitation_data = 0xC0; // ~0x3F; /* according to the patent it is (either + or -) half of the maximum value in the chirp table, so either 01000000(0x40) or 11000000(0xC0)*/
                    } else {
                        this.m_excitation_data = 0x40;
                    }
                } else { /* (!this.m_OLDP) */
                    // generate voiced samples here
                    /* US patent 4331836 Figure 14B shows, and logic would hold, that a pitch based chirp
                     * function has a chirp/peak and then a long chain of zeroes.
                     * The last entry of the chirp rom is at address 0b110011 (51d), the 52nd sample,
                     * and if the address reaches that point the ADDRESS incrementer is
                     * disabled, forcing all samples beyond 51d to be == 51d
                     */
                    if (this.m_pitch_count >= 51) {
                        this.m_excitation_data = this.m_coeff.chirptable[51];
                    } else { /* m_pitch_count < 51 */
                        this.m_excitation_data = this.m_coeff.chirptable[this.m_pitch_count];
                    }
                }

                if (TMS5200.USE_JAVASCRIPT_RNG) {
                    // RM: Don't want to spend time on this in JavaScript - just use built in RNG
                    this.m_RNG = Math.random() > 0.5 ? 1 : 0;
                } else {
                    // Update LFSR *20* times every sample (once per T cycle), like patent shows
                    for (i = 0; i < 20; i++) {
                        bitout =
                            ((this.m_RNG >> 12) & 1) ^
                            ((this.m_RNG >> 3) & 1) ^
                            ((this.m_RNG >> 2) & 1) ^
                            ((this.m_RNG >> 0) & 1);
                        this.m_RNG <<= 1;
                        this.m_RNG |= bitout;
                        this.m_RNG &= 0xFFFF; // RM: Truncate to 16 bits
                    }
                }

                this_sample = this.lattice_filter();
                /* execute lattice filter */

                /* next, force result to 14 bits (since its possible that the addition at the final (k1) stage of the lattice overflowed) */
                while (this_sample > 16383) {
                    this_sample -= 32768;
                }
                while (this_sample < -16384) {
                    this_sample += 32768;
                }
                if (!this.m_digital_select) {// analog SPK pin output is only 8 bits, with clipping
                    buffer[buf_count] = this.clip_analog(this_sample);
                } else { // digital I/O pin output is 12 bits
                    if (TMS5200.ALLOW_4_LSB) {
                        // input:  ssss ssss ssss ssss ssnn nnnn nnnn nnnn
                        // N taps:                       ^                 = 0x2000;
                        // output: ssss ssss ssss ssss snnn nnnn nnnn nnnN
                        buffer[buf_count] = (this_sample << 1) | ((this_sample & 0x2000) >> 13);
                    } else {
                        this_sample &= ~0xF;
                        // input:  ssss ssss ssss ssss ssnn nnnn nnnn 0000
                        // N taps:                       ^^ ^^^            = 0x3E00;
                        // output: ssss ssss ssss ssss snnn nnnn nnnN NNNN
                        buffer[buf_count] = (this_sample << 1) | ((this_sample & 0x3E00) >> 9);
                    }
                }
                // Update all counts
                this.m_subcycle++;
                if ((this.m_subcycle === 2) && (this.m_PC === 12)) {
                    /* Circuit 412 in the patent acts a reset, resetting the pitch counter to 0
                     * if INHIBIT was true during the most recent frame transition.
                     * The exact time this occurs is betwen IP=7, PC=12 sub=0, T=t12
                     * and m_IP = 0, PC=0 sub=0, T=t12, a period of exactly 20 cycles,
                     * which overlaps the time OLDE and OLDP are updated at IP=7 PC=12 T17
                     * (and hence INHIBIT itself 2 t-cycles later). We do it here because it is
                     * convenient and should make no difference in output.
                     */
                    if ((this.m_IP === 7) && (this.m_inhibit)) {
                        this.m_pitch_count = 0;
                    }
                    this.m_subcycle = this.m_subc_reload;
                    this.m_PC = 0;
                    this.m_IP++;
                    this.m_IP &= 0x7;
                } else if (this.m_subcycle === 3) {
                    this.m_subcycle = this.m_subc_reload;
                    this.m_PC++;
                }
                this.m_pitch_count++;
                if (this.m_pitch_count >= this.m_current_pitch) {
                    this.m_pitch_count = 0;
                }
                this.m_pitch_count &= 0x1FF;
                buf_count++;
                size--;
            }
        }

        // empty:
        while (size > 0) {
            this.m_subcycle++;
            if ((this.m_subcycle === 2) && (this.m_PC === 12)) {
                this.m_subcycle = this.m_subc_reload;
                this.m_PC = 0;
                this.m_IP++;
                this.m_IP &= 0x7;
            } else if (this.m_subcycle === 3) {
                this.m_subcycle = this.m_subc_reload;
                this.m_PC++;
            }
            buffer[buf_count] = -1;
            /* should be just -1; actual chip outputs -1 every idle sample; (cf note in data sheet, p 10, table 4) */
            buf_count++;
            size--;
        }
    }

    /**********************************************************************************************

     clip_analog -- clips the 14 bit return value from the lattice filter to its final 10 bit value (-512 to 511), and upshifts/range extends this to 16 bits

     ***********************************************************************************************/

    private clip_analog(cliptemp: number): number {
        /* clipping, just like the patent shows:
         * the top 10 bits of this result are visible on the digital output IO pin.
         * next, if the top 3 bits of the 14 bit result are all the same, the lowest of those 3 bits plus the next 7 bits are the signed analog output, otherwise the low bits are all forced to match the inverse of the topmost bit, i.e.:
         * 1x xxxx xxxx xxxx -> 0b10000000
         * 11 1bcd efgh xxxx -> 0b1bcdefgh
         * 00 0bcd efgh xxxx -> 0b0bcdefgh
         * 0x xxxx xxxx xxxx -> 0b01111111
         */
        if (cliptemp > 2047) {
            cliptemp = 2047;
        } else if (cliptemp < -2048) {
            cliptemp = -2048;
        }
        /* at this point the analog output is tapped */
        if (TMS5200.ALLOW_4_LSB) {
            // input:  ssss snnn nnnn nnnn
            // N taps:       ^^^ ^         = 0x0780
            // output: snnn nnnn nnnn NNNN
            return (cliptemp << 4) | ((cliptemp & 0x780) >> 7); // upshift and range adjust
        } else {
            cliptemp &= ~0xF;
            // input:  ssss snnn nnnn 0000
            // N taps:       ^^^ ^^^^      = 0x07F0
            // P taps:       ^             = 0x0400
            // output: snnn nnnn NNNN NNNP
            return (cliptemp << 4) | ((cliptemp & 0x7F0) >> 3) | ((cliptemp & 0x400) >> 10); // upshift and range adjust
        }
    }

    /**********************************************************************************************

     matrix_multiply -- does the proper multiply and shift
     a is the k coefficient and is clamped to 10 bits (9 bits plus a sign)
     b is the running result and is clamped to 14 bits.
     output is 14 bits, but note the result LSB bit is always 1.
     Because the low 4 bits of the result are trimmed off before
     output, this makes almost no difference in the computation.

     **********************************************************************************************/
    private matrix_multiply(a: number, b: number): number {
        while (a > 511) {
            a -= 1024;
        }
        while (a < -512) {
            a += 1024;
        }
        while (b > 16383) {
            b -= 32768;
        }
        while (b < -16384) {
            b += 32768;
        }
        return ((a * b) >> 9) | 1; // &(~1);
    }

    /**********************************************************************************************

     lattice_filter -- executes one 'full run' of the lattice filter on a specific byte of
     excitation data, and specific values of all the current k constants,  and returns the
     resulting sample.

     ***********************************************************************************************/

    private lattice_filter(): number {
        // Lattice filter here
        // Aug/05/07: redone as unrolled loop, for clarity - LN
        /* Originally Copied verbatim from table I in US patent 4,209,804, now updated to be in same order as the actual chip does it, not that it matters.
         notation equivalencies from table:
         Yn(i) == m_u[n-1]
         Kn = m_current_k[n-1]
         bn = m_x[n-1]
         */
        /*
         int ep = matrix_multiply(m_previous_energy, (m_excitation_data<<6));  //Y(11)
         m_u[10] = ep;
         for (int i = 0; i < 10; i++)
         {
         int ii = 10-i; // for m = 10, this would be 11 - i, and since i is from 1 to 10, then ii ranges from 10 to 1
         //int jj = ii+1; // this letiable, even on the fortran version, is never used. it probably was intended to be used on the two lines below the next one to save some redundant additions on each.
         ep = ep - (((m_current_k[ii-1] * m_x[ii-1])>>9)|1); // subtract reflection from lower stage 'top of lattice'
         m_u[ii-1] = ep;
         m_x[ii] = m_x[ii-1] + (((m_current_k[ii-1] * ep)>>9)|1); // add reflection from upper stage 'bottom of lattice'
         }
         m_x[0] = ep; // feed the last section of the top of the lattice directly to the bottom of the lattice
         */
        const m_u = this.m_u;
        const m_x = this.m_x;
        const m_current_k = this.m_current_k;
        m_u[10] = this.matrix_multiply(this.m_previous_energy, (this.m_excitation_data << 6));  // Y(11)
        m_u[9] = m_u[10] - this.matrix_multiply(m_current_k[9], m_x[9]);
        m_u[8] = m_u[9] - this.matrix_multiply(m_current_k[8], m_x[8]);
        m_u[7] = m_u[8] - this.matrix_multiply(m_current_k[7], m_x[7]);
        m_u[6] = m_u[7] - this.matrix_multiply(m_current_k[6], m_x[6]);
        m_u[5] = m_u[6] - this.matrix_multiply(m_current_k[5], m_x[5]);
        m_u[4] = m_u[5] - this.matrix_multiply(m_current_k[4], m_x[4]);
        m_u[3] = m_u[4] - this.matrix_multiply(m_current_k[3], m_x[3]);
        m_u[2] = m_u[3] - this.matrix_multiply(m_current_k[2], m_x[2]);
        m_u[1] = m_u[2] - this.matrix_multiply(m_current_k[1], m_x[1]);
        m_u[0] = m_u[1] - this.matrix_multiply(m_current_k[0], m_x[0]);
        m_x[9] = m_x[8] + this.matrix_multiply(m_current_k[8], m_u[8]);
        m_x[8] = m_x[7] + this.matrix_multiply(m_current_k[7], m_u[7]);
        m_x[7] = m_x[6] + this.matrix_multiply(m_current_k[6], m_u[6]);
        m_x[6] = m_x[5] + this.matrix_multiply(m_current_k[5], m_u[5]);
        m_x[5] = m_x[4] + this.matrix_multiply(m_current_k[4], m_u[4]);
        m_x[4] = m_x[3] + this.matrix_multiply(m_current_k[3], m_u[3]);
        m_x[3] = m_x[2] + this.matrix_multiply(m_current_k[2], m_u[2]);
        m_x[2] = m_x[1] + this.matrix_multiply(m_current_k[1], m_u[1]);
        m_x[1] = m_x[0] + this.matrix_multiply(m_current_k[0], m_u[0]);
        m_x[0] = m_u[0];
        this.m_previous_energy = this.m_current_energy;
        // this.log.info(m_u[0]);
        return m_u[0];
    }

    /**********************************************************************************************

     process_command -- extract a byte from the FIFO and interpret it as a command

     ***********************************************************************************************/

    private process_command(cmd: number) {
        /* parse the command */
        switch (cmd & 0x70) {
            case 0x10 : /* read byte */
                this.log.info("Speech: read byte");
                if (!this.m_talk_status) { /* TALKST must be clear for RDBY */
                    if (this.m_schedule_dummy_read) {
                        this.m_schedule_dummy_read = false;
                        this.rom_read(1);
                    }
                    this.m_data_register = this.rom_read(8);
                    /* read one byte from speech ROM... */
                    this.m_RDB_flag = true;
                }
                break;

            case 0x00:
            case 0x20: /* set rate (tms5220c and cd2501ecd only), otherwise NOP */
                this.log.info("Speech: load frame rate");
                if (TMS5200.HAS_RATE_CONTROL) {
                    this.m_c_letiant_rate = cmd & 0x0F;
                }
                break;

            case 0x30 : /* read and branch */
                if (!this.m_talk_status) {/* TALKST must be clear for RB */
                    this.log.info("Speech: read and branch");
                    this.m_RDB_flag = false;
                    this.rom_read_and_branch();
                }
                break;

            case 0x40 : /* load address */
                if (!this.m_talk_status) { /* TALKST must be clear for LA */
                    this.log.debug("Speech: load address nybble " + Util.toHexByte(cmd & 0x0f));
                    /* tms5220 data sheet says that if we load only one 4-bit nibble, it won't work.
                     This code does not care about this. */
                    this.rom_load_address(cmd & 0x0f);
                    this.m_schedule_dummy_read = true;
                }
                break;

            case 0x50 : /* speak */
                this.log.info("Speech: speak");
                if (this.m_schedule_dummy_read) {
                    this.m_schedule_dummy_read = false;
                    this.rom_read(1);
                }
                this.m_speaking_now = true;
                this.m_speak_external = false;
                this.m_talk_status = true;
                /* start immediately */
                /* clear out letiables before speaking */
                // TO-DO: similar to the victory case described above, but for VSM speech
                this.m_subcycle = this.m_subc_reload;
                this.m_PC = 0;
                this.m_IP = TMS5200.reload_table[this.m_c_letiant_rate & 0x3];
                this.m_new_frame_energy_idx = 0;
                this.m_new_frame_pitch_idx = 0;
                let i;
                for (i = 0; i < 4; i++) {
                    this.m_new_frame_k_idx[i] = 0;
                }
                for (i = 4; i < 7; i++) {
                    this.m_new_frame_k_idx[i] = 0xF;
                }
                for (i = 7; i < this.m_coeff.num_k; i++) {
                    this.m_new_frame_k_idx[i] = 0x7;
                }
                break;

            case 0x60 : /* speak external */
                this.log.info("Speech: speak external");
                // SPKEXT going active activates SPKEE which clears the fifo
                this.m_fifo_head = this.m_fifo_tail = this.m_fifo_count = this.m_fifo_bits_taken = 0;
                this.m_speak_external = true;
                this.m_RDB_flag = false;
                break;

            case 0x70 : /* reset */
                this.log.info("Speech: reset");
                if (this.m_schedule_dummy_read) {
                    this.m_schedule_dummy_read = false;
                    this.rom_read(1);
                }
                this.reset();
                break;
        }

        /* update the buffer low state */
        this.update_status_and_ints();
    }

    /******************************************************************************************

     parse_frame -- parse a new frame's worth of data; returns 0 if not enough bits in buffer

     ******************************************************************************************/

    private parse_frame() {
        let indx, i, rep_flag;

        // We actually don't care how many bits are left in the fifo here; the frame subpart will be processed normally,
        // and any bits extracted 'past the end' of the fifo will be read as zeroes; the fifo being emptied will set the
        // /BE latch which will halt speech exactly as if a stop frame had been encountered (instead of whatever partial
        // frame was read); the same exact circuitry is used for both on the real chip, see us patent 4335277 sheet 16,
        // gates 232a (decode stop frame) and 232b (decode /BE plus DDIS (decode disable) which is active during speak external).

        /* if the chip is a tms5220C, and the rate mode is set to that each frame (0x04 bit set)
         has a 2 bit rate preceding it, grab two bits here and store them as the rate; */
        if ((this.m_c_letiant_rate & 0x04) !== 0) {
            indx = this.extract_bits(2);
            this.m_IP = TMS5200.reload_table[indx];
        } else { // non-5220C and 5220C in fixed rate mode
            this.m_IP = TMS5200.reload_table[this.m_c_letiant_rate & 0x3];
        }

        this.update_status_and_ints();
        if (!this.m_talk_status) {
            // goto ranout;
            this.log.warn("Ran out of bits on a parse (1)");
            return;
        }

        // attempt to extract the energy index
        this.m_new_frame_energy_idx = this.extract_bits(this.m_coeff.energy_bits);
        this.update_status_and_ints();
        if (!this.m_talk_status) {
            // goto ranout;
            this.log.warn("Ran out of bits on a parse (2)");
            return;
        }
        // if the energy index is 0 or 15, we're done
        if ((this.m_new_frame_energy_idx === 0) || (this.m_new_frame_energy_idx === 15)) {
            return;
        }

        // attempt to extract the repeat flag
        rep_flag = this.extract_bits(1);

        // attempt to extract the pitch
        this.m_new_frame_pitch_idx = this.extract_bits(this.m_coeff.pitch_bits);
        this.update_status_and_ints();
        if (!this.m_talk_status) {
            // goto ranout;
            this.log.warn("Ran out of bits on a parse (3)");
            return;
        }

        // if this is a repeat frame, just do nothing, it will reuse the old coefficients
        if (rep_flag) {
            return;
        }

        // extract first 4 K coefficients
        for (i = 0; i < 4; i++) {
            this.m_new_frame_k_idx[i] = this.extract_bits(this.m_coeff.kbits[i]);
            this.update_status_and_ints();
            if (!this.m_talk_status) {
                // goto ranout;
                this.log.warn("Ran out of bits on a parse (4)");
                return;
            }
        }

        // if the pitch index was zero, we only need 4 K's...
        if (this.m_new_frame_pitch_idx === 0) {
            /* and the rest of the coefficients are zeroed, but that's done in the generator code */
            return;
        }

        // If we got here, we need the remaining 6 K's
        for (i = 4; i < this.m_coeff.num_k; i++) {
            this.m_new_frame_k_idx[i] = this.extract_bits(this.m_coeff.kbits[i]);
            this.update_status_and_ints();
            if (!this.m_talk_status) {
                // goto ranout;
                this.log.warn("Ran out of bits on a parse (5)");
                return;
            }
        }

        if (this.m_speak_external) {
            this.log.debug("Parsed a frame successfully in FIFO - bits remaining: " + (this.m_fifo_count * 8 - this.m_fifo_bits_taken));
        } else {
            this.log.debug("Parsed a frame successfully in ROM\n");
        }
    }

    /**********************************************************************************************

     set_interrupt_state -- generate an interrupt

     ***********************************************************************************************/

    private set_interrupt_state(state: number) {
        if (this.m_irq_handler && state !== this.m_irq_pin) {
            this.m_irq_handler(!state);
        }
        this.m_irq_pin = state;
    }

    /**********************************************************************************************

     update_ready_state -- update the ready line

     ***********************************************************************************************/

    private update_ready_state() {
        const state = this.ready_read();
        if (this.m_readyq_handler && state !== this.m_ready_pin) {
            this.m_readyq_handler(!state);
        }
        this.m_ready_pin = state;
        if (this.cpu) {
            this.cpu.setSuspended(!this.m_ready_pin);
        }
    }

    // -------------------------------------------------
    //  device_reset - device-specific reset
    // -------------------------------------------------

    private device_reset() {

        this.m_digital_select = TMS5200.FORCE_DIGITAL; // assume analog output
        /* initialize the FIFO */
        this.m_fifo = new Uint8Array(TMS5200.FIFO_SIZE);
        this.m_fifo_head = this.m_fifo_tail = this.m_fifo_count = this.m_fifo_bits_taken = 0;

        /* initialize the chip state */
        /* Note that we do not actually clear IRQ on start-up : IRQ is even raised if m_buffer_empty or m_buffer_low are 0 */
        this.m_speaking_now = this.m_speak_external = this.m_talk_status = false;
        this.m_irq_pin = 0;
        this.m_ready_pin = false;
        this.set_interrupt_state(0);
        this.update_ready_state();
        this.m_buffer_empty = this.m_buffer_low = true;

        this.m_RDB_flag = false;

        /* initialize the energy/pitch/k states */
        this.m_new_frame_energy_idx = this.m_current_energy = this.m_target_energy = 0;
        this.m_new_frame_pitch_idx = this.m_current_pitch = this.m_target_pitch = 0;

        this.m_new_frame_k_idx = new Uint8Array(10);
        this.m_current_k = new Int16Array(10);
        this.m_target_k = new Int16Array(10);

        /* initialize the sample generators */
        this.m_inhibit = true;
        this.m_subcycle = this.m_c_letiant_rate = this.m_pitch_count = this.m_PC = 0;

        this.m_subc_reload = TMS5200.FORCE_SUBC_RELOAD;
        this.m_OLDE = this.m_OLDP = true;
        this.m_IP = TMS5200.reload_table[this.m_c_letiant_rate & 0x3];
        this.m_RNG = 0x1FFF;

        this.m_u = new Int32Array(11);
        this.m_x = new Int32Array(10);

        this.rom_load_address(0);
        // MZ: Do the dummy read immediately. The previous line will cause a
        // shift in the address pointer in the VSM. When the next command is a
        // load_address, no dummy read will occur, hence the address will be
        // falsely shifted.
        this.rom_read(1);
        this.m_schedule_dummy_read = false;

        this.m_io_ready = true;
    }

    /**********************************************************************************************

     Speech ROM function

    ***********************************************************************************************/

    /*
     Read 'count' bits serially from speech ROM
    */
    private rom_read(count: number): number {
        let val;

        if (this.m_load_pointer !== 0) {   /* first read after load address is ignored */
            this.m_load_pointer = 0;
            count--;
        }

        if (this.m_speechROMaddr < TMS5200.ROM_LENGTH) {
            if (count < this.m_ROM_bits_count) {
                this.m_ROM_bits_count -= count;
                val = (TMS5200.ROM[this.m_speechROMaddr] >> this.m_ROM_bits_count) & (0xFF >> (8 - count));
            } else {
                val = TMS5200.ROM[this.m_speechROMaddr] << 8;

                this.m_speechROMaddr = (this.m_speechROMaddr + 1) & (TMS5200.ROM_LENGTH - 1);

                if (this.m_speechROMaddr < TMS5200.ROM_LENGTH) {
                    val |= TMS5200.ROM[this.m_speechROMaddr];
                }

                this.m_ROM_bits_count += 8 - count;

                val = (val >> this.m_ROM_bits_count) & (0xFF >> (8 - count));
            }
        } else {
            val = 0;
        }

        return val;
    }

    /*
     Write an address nibble to speech ROM
     */
    private rom_load_address(data) {
        /* tms5220 data sheet says that if we load only one 4-bit nibble, it won't work.
         This code does not care about this. */
        this.m_speechROMaddr = ( (this.m_speechROMaddr & ~(0xf << this.m_load_pointer))
            | (((data & 0xf)) << this.m_load_pointer) ) & (TMS5200.ROM_LENGTH - 1);
        this.m_load_pointer += 4;
        this.m_ROM_bits_count = 8;
    }

    /*
     Perform a read and branch command
     */
    private rom_read_and_branch() {
        /* tms5220 data sheet says that if more than one speech ROM (tms6100) is present,
         there is a bus contention.  This code does not care about this. */
        if (this.m_speechROMaddr < TMS5200.ROM_LENGTH - 1) {
            this.m_speechROMaddr = (this.m_speechROMaddr & 0x3c000)
                | ((((TMS5200.ROM[this.m_speechROMaddr]) << 8)
                | TMS5200.ROM[this.m_speechROMaddr + 1]) & 0x3fff);
        } else if (this.m_speechROMaddr === TMS5200.ROM_LENGTH - 1) {
            this.m_speechROMaddr = (this.m_speechROMaddr & 0x3c000)
                | (((TMS5200.ROM[this.m_speechROMaddr]) << 8) & 0x3fff);
        } else {
            this.m_speechROMaddr = (this.m_speechROMaddr & 0x3c000);
        }

        this.m_ROM_bits_count = 8;
    }

    getState(): object {
        return {
            enabled: this.enabled,
            m_speak_external: this.m_speak_external,
            m_talk_status: this.m_talk_status,
            m_speaking_now: this.m_speaking_now,
            m_buffer_low: this.m_buffer_low,
            m_buffer_empty: this.m_buffer_empty,
            m_schedule_dummy_read: this.m_schedule_dummy_read,
            m_fifo_count: this.m_fifo_count,
            m_fifo_tail: this.m_fifo_tail,
            m_fifo: this.m_fifo,
            m_subcycle: this.m_subcycle,
            m_subc_reload: this.m_subc_reload,
            m_c_letiant_rate: this.m_c_letiant_rate,
            m_PC: this.m_PC,
            m_IP: this.m_IP,
            m_new_frame_energy_idx: this.m_new_frame_energy_idx,
            m_new_frame_pitch_idx: this.m_new_frame_pitch_idx,
            m_new_frame_k_idx: this.m_new_frame_k_idx,
            m_RDB_flag: this.m_RDB_flag,
            m_data_register: this.m_data_register,
            m_OLDE: this.m_OLDE,
            m_OLDP: this.m_OLDP,
            m_inhibit: this.m_inhibit,
            m_target_energy: this.m_target_energy,
            m_target_pitch: this.m_target_pitch,
            m_target_k: this.m_target_k,
            m_current_k: this.m_current_k,
            m_RNG: this.m_RNG,
            m_excitation_data: this.m_excitation_data,
            m_u: this.m_u,
            m_x: this.m_x,
            m_digital_select: this.m_digital_select,
            m_speechROMaddr: this.m_speechROMaddr,
            m_load_pointer: this.m_load_pointer,
            m_ROM_bits_count: this.m_ROM_bits_count,
            m_irq_pin: this.m_irq_pin,
            m_io_ready: this.m_io_ready,
            m_irq_handler: this.m_irq_handler,
            m_readyq_handler: this.m_readyq_handler
        };
    }

    restoreState(state: any) {
        this.enabled = state.enabled;
        this.m_speak_external = state.m_speak_external;
        this.m_talk_status = state.m_talk_status;
        this.m_speaking_now = state.m_speaking_now;
        this.m_buffer_low = state.m_buffer_low;
        this.m_buffer_empty = state.m_buffer_empty;
        this.m_schedule_dummy_read = state.m_schedule_dummy_read;
        this.m_fifo_count = state.m_fifo_count;
        this.m_fifo_tail = state.m_fifo_tail;
        this.m_fifo = state.m_fifo;
        this.m_subcycle = state.m_subcycle;
        this.m_subc_reload = state.m_subc_reload;
        this.m_c_letiant_rate = state.m_c_letiant_rate;
        this.m_PC = state.m_PC;
        this.m_IP = state.m_IP;
        this.m_new_frame_energy_idx = state.m_new_frame_energy_idx;
        this.m_new_frame_pitch_idx = state.m_new_frame_pitch_idx;
        this.m_new_frame_k_idx = state.m_new_frame_k_idx;
        this.m_RDB_flag = state.m_RDB_flag;
        this.m_data_register = state.m_data_register;
        this.m_OLDE = state.m_OLDE;
        this.m_OLDP = state.m_OLDP;
        this.m_inhibit = state.m_inhibit;
        this.m_target_energy = state.m_target_energy;
        this.m_target_pitch = state.m_target_pitch;
        this.m_target_k = state.m_target_k;
        this.m_current_k = state.m_current_k;
        this.m_RNG = state.m_RNG;
        this.m_excitation_data = state.m_excitation_data;
        this.m_u = state.m_u;
        this.m_x = state.m_x;
        this.m_digital_select = state.m_digital_select;
        this.m_speechROMaddr = state.m_speechROMaddr;
        this.m_load_pointer = state.m_load_pointer;
        this.m_ROM_bits_count = state.m_ROM_bits_count;
        this.m_irq_pin = state.m_irq_pin;
        this.m_io_ready = state.m_io_ready;
        this.m_irq_handler = state.m_irq_handler;
        this.m_readyq_handler = state.m_readyq_handler;
    }
}
