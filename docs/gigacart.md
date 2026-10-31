# Loading Gigacart cartridges

Gigacart keeps the TI's usual 8 KiB cartridge window at `>6000–>7FFF`. The write address chooses a bank within a 32 MiB block. The byte written chooses the block. Two data bits give four blocks, or 128 MiB; four give sixteen blocks, or 512 MiB.

Open a regular cartridge BIN with **Open cartridge**. Power-of-two BINs larger than 32 MiB are recognized as Gigacart and use the CPLD boot GROM in their final 256 bytes. Smaller images, such as the 8 MiB Dragon's Lair demo, need an RPK that identifies their mapper. FinalGROM-converted images belong on FinalGROM; use the original cartridge image here.

## Describe the hardware in an RPK

An RPK is a ZIP containing `layout.xml` and its named image files. This example uses the CPLD boot arrangement:

```xml
<?xml version="1.0" encoding="utf-8"?>
<romset>
  <resources>
    <rom id="rom" file="rom.bin" />
  </resources>
  <configuration>
    <pcb type="gigacart-cpld" bank_data_bits="2" initial_bank="first">
      <socket id="rom_socket" uses="rom" />
    </pcb>
  </configuration>
</romset>
```

| PCB type | Boot arrangement |
| --- | --- |
| `gigacart-rom` | ROM only; no GROM is supplied by the emulator. |
| `gigacart-grom` | A separate GROM image, connected through `grom_socket`. |
| `gigacart-cpld` | The final 256 ROM bytes mirrored at GROM `>8000–>9FFF`. |

For the separate-GROM type, add `<rom id="grom" file="grom.bin" />` under resources and `<socket id="grom_socket" uses="grom" />` under the PCB. GROM images must contain whole 8 KiB blocks, up to 40 KiB. The other two types do not accept a GROM socket.

`bank_data_bits` is required for these three names and accepts 1 through 8. The ROM must be a power-of-two number of whole 8 KiB banks within the declared capacity. A smaller ROM mirrors within that capacity; it is not padded to hide an inconsistent declaration.

`initial_bank` defaults to `first`. It also accepts `last` or a decimal bank number within the declared selector range. This controls reset and power-up only; software can select another bank immediately. For a smaller installed ROM, the initial selection mirrors into that ROM. Save states preserve the selected bank and the reset bank.

The older js99er name `gigacart` remains supported. With that name, omitted width is inferred from image size, and a supplied GROM takes precedence over the CPLD boot bytes. New packages should describe their boot hardware explicitly.

## Bank selection

For an actual 8-bit bus write:

```javascript
const block = byteValue & ((1 << bankDataBits) - 1);
const bank = (block << 12) | ((address >> 1) & 0x0fff);
const offset = (bank % installedBankCount) * 0x2000 + (readAddress - 0x6000);
```

js99er's cartridge interface receives a CPU word. Its high byte supplies the final block selection, because the TI's external bus writes the low byte first and the high byte last. For example, word `>0200` written to `>6020` selects physical bank `>2010` in a 128 MiB image. Image offsets use multiplication rather than signed 32-bit shifts.

## Checks and limits

`npm run test:gigacart` exercises the mapper, boot variants, RPK resource validation, reset/save state, compatibility with existing cartridges, and synthetic widths through eight data bits. A private browser test also loads real ZIP/XML packages through the browser's cartridge loader.

Private-image tests compared every word in every bank of Dragon's Lair (8 and 128 MiB), Cinema (128 MiB), Kung Fury (128 MiB), and Lion King (512 MiB). All five booted and produced changing video frames. Dragon's Lair also completed Dragonostics and a 194-move Practice run back to its introduction.

Cinema, Kung Fury and Lion King completed continuous playback through their restart. At physical banks 128 and 256, the first 6 KiB of video RAM matched the first pass byte for byte after each loop. The last selected banks were 16,383, 16,105 and 45,864 respectively; unused capacity need not be played. Reviewed captures show continued playback after restart. The runs exercised the production PSG/audio-gate path and produced changing, bounded samples, but do not substitute for listening on the user's audio setup.

The full-bank checksum reference was generated from the same Dragon's Lair dump; it is not independent proof of that dump's accuracy.

Widths through eight bits describe the expansion allowance. Sparse synthetic tests cover the large address arithmetic; they do not establish that an 8 GiB image can be allocated in every browser. Available browser memory remains a practical limit.

Mike Brent (Tursi)'s [Gigacart repository](https://github.com/tursilion/gigacart) supplies the hardware and CPLD reference. Jon supplied cartridge images, board knowledge and real-system observations. Private ROM images are not distributed with these tests.
