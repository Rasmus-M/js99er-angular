import {Opcode} from "./opcode";

export class Decoder {

     /*
     Formats:

           0 1 2    3   4 5  6  7  8  9  10 11 12 13 14 15
         +------------------------------------------------+
     1   | Opcode | B | Td |  RegNr     | Ts |    RegNr   |
         +--------+---+----+------------+----+------------+
     2   |  Opcode               |      Displacement      |
         +-----------------------+------------------------+
     3   |  Opcode         |  RegNr     | Ts |    RegNr   |
         +-----------------+------------+----+------------+
     4   |  Opcode         |  Count     | Ts |    RegNr   |
         +-----------------+------------+----+------------+
     5   |  Opcode               |  Count    |    RegNr   |
         +-----------------------+-----------+------------+
     6   |  Opcode                      | Ts |    RegNr   |
         +------------------------------+----+------------+
     7   |  Opcode                      |  0 | 0| 0| 0| 0 |
         +---------------------------------+-+--+--+--+---+
     8   |  Opcode                      |  0 |    RegNr   |
         +---------------------------------+-+------------+
     9   |  Opcode         |   Reg/Nr   | Ts |    RegNr   |
         +-----------------+------------+----+------------+
    */

    private static opcodes = [
        new Opcode(0x0200, "LI", 8, true),
        new Opcode(0x0220, "AI", 8, true),
        new Opcode(0x0240, "ANDI", 8, true),
        new Opcode(0x0260, "ORI", 8, true),
        new Opcode(0x0280, "CI", 8, true),
        new Opcode(0x02a0, "STWP", 8, true),
        new Opcode(0x02c0, "STST", 8, true),
        new Opcode(0x02e0, "LWPI", 8, true),
        new Opcode(0x0300, "LIMI", 8, true),
        new Opcode(0x0340, "IDLE", 7, true),
        new Opcode(0x0360, "RSET", 7, true),
        new Opcode(0x0380, "RTWP", 7, true),
        new Opcode(0x03a0, "CKON", 7, true),
        new Opcode(0x03c0, "CKOF", 7, true),
        new Opcode(0x03e0, "LREX", 7, true),
        new Opcode(0x0400, "BLWP", 6, true),
        new Opcode(0x0440, "B", 6, true),
        new Opcode(0x0480, "X", 6, true),
        new Opcode(0x04c0, "CLR", 6, true),
        new Opcode(0x0500, "NEG", 6, true),
        new Opcode(0x0540, "INV", 6, true),
        new Opcode(0x0580, "INC", 6, true),
        new Opcode(0x05c0, "INCT", 6, true),
        new Opcode(0x0600, "DEC", 6, true),
        new Opcode(0x0640, "DECT", 6, true),
        new Opcode(0x0680, "BL", 6, true),
        new Opcode(0x06c0, "SWPB", 6, true),
        new Opcode(0x0700, "SETO", 6, true),
        new Opcode(0x0740, "ABS", 6, true),
        new Opcode(0x0800, "SRA", 5, true),
        new Opcode(0x0900, "SRL", 5, true),
        new Opcode(0x0a00, "SLA", 5, true),
        new Opcode(0x0b00, "SRC", 5, true),
        // New F18A opcodes
        new Opcode(0x0c00, "RET", 7, false),
        new Opcode(0x0c80, "CALL", 6, false),
        new Opcode(0x0d00, "PUSH", 6, false),
        new Opcode(0x0e00, "SLC", 5, false),
        new Opcode(0x0f00, "POP", 6, false),
        // ...
        new Opcode(0x1000, "JMP", 2, true),
        new Opcode(0x1100, "JLT", 2, true),
        new Opcode(0x1200, "JLE", 2, true),
        new Opcode(0x1300, "JEQ", 2, true),
        new Opcode(0x1400, "JHE", 2, true),
        new Opcode(0x1500, "JGT", 2, true),
        new Opcode(0x1600, "JNE", 2, true),
        new Opcode(0x1700, "JNC", 2, true),
        new Opcode(0x1800, "JOC", 2, true),
        new Opcode(0x1900, "JNO", 2, true),
        new Opcode(0x1a00, "JL", 2, true),
        new Opcode(0x1b00, "JH", 2, true),
        new Opcode(0x1c00, "JOP", 2, true),
        new Opcode(0x1d00, "SBO", 2, true),
        new Opcode(0x1e00, "SBZ", 2, true),
        new Opcode(0x1f00, "TB", 2, true),
        new Opcode(0x2000, "COC", 3, true),
        new Opcode(0x2400, "CZC", 3, true),
        new Opcode(0x2800, "XOR", 3, true),
        new Opcode(0x2c00, "XOP", 3, true),
        new Opcode(0x3000, "LDCR", 4, true),
        new Opcode(0x3400, "STCR", 4, true),
        new Opcode(0x3800, "MPY", 9, true),
        new Opcode(0x3c00, "DIV", 9, true),
        new Opcode(0x4000, "SZC", 1, true),
        new Opcode(0x5000, "SZCB", 1, true),
        new Opcode(0x6000, "S", 1, true),
        new Opcode(0x7000, "SB", 1, true),
        new Opcode(0x8000, "C", 1, true),
        new Opcode(0x9000, "CB", 1, true),
        new Opcode(0xa000, "A", 1, true),
        new Opcode(0xb000, "AB", 1, true),
        new Opcode(0xc000, "MOV", 1, true),
        new Opcode(0xd000, "MOVB", 1, true),
        new Opcode(0xe000, "SOC", 1, true),
        new Opcode(0xf000, "SOCB", 1, true)
    ];

    private static decoderTable: Opcode[];

    static getDecoderTable() {
        if (!this.decoderTable) {
            const decoderTable = [];
            for (let i = 0; i < this.opcodes.length; i++) {
                const opcode = this.opcodes[i];
                const code = opcode.code;
                for (let j = 0; j <= opcode.invFormatMask; j++) {
                    decoderTable[code | j] = opcode;
                }
            }
            this.decoderTable = decoderTable;
        }
        return this.decoderTable;
    }
}
