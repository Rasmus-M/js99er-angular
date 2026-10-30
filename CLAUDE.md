# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JS99'er is a TI-99/4A home computer emulator (https://js99er.net) written in TypeScript as an Angular app. The VDP scanline renderers are written in AssemblyScript and compiled to WebAssembly.

## Commands

- `npm run serve` — dev server at http://localhost:4200 (development configuration)
- `npm run build` — release build: compiles AssemblyScript to `dist/assets/wasm/` then runs `ng build --configuration production` into `dist/`
- `npm run asbuild:debug` — rebuild the WASM into `src/assets/wasm/` (these outputs are committed; rebuild after editing anything in `assembly/`, since `ng serve` serves the committed `index.wasm`)
- `npm test` — Karma/Jasmine unit tests (`*.spec.ts` under `src/`, needs Chrome). Run a single spec file with `ng test --include src/app/emulator/classes/f18a-gpu.spec.ts`
- `npm run test:gigacart` — Node test runner script (`tools/gigacart-test.cjs`) that loads TS sources directly via `ts-node/register/transpile-only`, no browser needed. `tools/audio-gate-test.cjs` follows the same pattern (run with `node tools/audio-gate-test.cjs`). This is the quickest way to unit-test emulator classes that don't need the DOM.
- `npm run lint` / `npm run e2e` — legacy TSLint/Protractor configs from older Angular versions; may not work with the current Angular CLI.

## Architecture

### Emulator core (`src/app/emulator/`)
- `classes/ti994a.ts` (`TI994A`, implements `Console`) assembles the machine: `Memory`, `TMS9900` CPU, `CRU`, VDP, PSG, `TMS5200` speech, keyboard, tape, disk drives/FDC, Google Drive, TIPI and RAM disk. It owns the main loop: `frame()` runs one 60 Hz frame scanline by scanline, interleaving `vdp.drawScanline(y)` with `cpu.run(cyclesPerScanline)` and, for F18A, the F18A GPU (a second TMS9900-like CPU in `f18a-gpu.ts`). Fast mode multiplies the cycle budget by 3. Firefox uses `requestAnimationFrame`; others use `setInterval`.
- Hardware variants are chosen from `Settings` behind interfaces in `interfaces/` (`VDP`, `PSG`, `CPU`, `FDC`, `Speech`, `RAMDisk`...): VDP = `TMS9918A` | `F18A` (also `PICO9918`) | `V9938`; PSG = `TMS9919` | `Forti`; disk = `GenericFdc` | `TiFDC` | `MyarcFDC`. The `set*()` methods on `TI994A` swap components at runtime when settings change.
- `memory.ts` decodes the CPU address space (console ROM/GROM, 32K RAM or `SAMS`, cartridge, VDP/sound/speech/GROM ports, DSR space). Expansion cards implement `PeripheralCard` / `MemoryMappedCard` (both extend `CRUDevice`) and are attached with `memory.registerPeripheralCard()` / `deregisterPeripheralCard()`. `cartridge.ts` handles cartridge ROM/GROM banking schemes (including Gigacart).
- Components implement `Stateful` (`getState()` / `restoreState()`), which is used for save states (persisted via `DatabaseService`/IndexedDB).
- `services/console-factory.service.ts` creates the `TI994A` instance; `console/console.component.ts` hosts the canvas.

### WebAssembly VDP rendering (`assembly/`)
- `assembly/tms9918a.ts` and `assembly/f18a.ts` export `drawScanline`, re-exported from `assembly/index.ts` as `drawScanline9918a` / `drawScanlineF18a`.
- `WasmService` is a route resolver that instantiates `assets/wasm/index.wasm` with an imported `WebAssembly.Memory` (21 pages) before the app starts. The TS VDP classes create typed-array views directly onto that buffer: VDP RAM at `0x00000`, palette at `0x10000`, canvas image data at `0x20000`; AssemblyScript static data starts at `--memoryBase 98304` (`0x18000`). These addresses must stay consistent between `src/app/emulator/classes/tms9918a.ts` / `f18a.ts`, `assembly/*.ts`, and the `asbuild` scripts. `V9938` renders in TS only.

### Angular UI (`src/app/`)
- `js99er.component.ts` is the root (`<js99er>` element); it parses the optional JSON `config` attribute (see README for embedding options) into `ConfigService`. `components/main/main.component.ts` drives the emulator: it creates the console, dispatches commands, and handles save/restore of state.
- UI and emulator are decoupled through two RxJS buses: `CommandDispatcherService` (UI → emulator commands such as start/fast/step/load software/change setting, `classes/command.ts`) and `EventDispatcherService` (emulator → UI events, `classes/console-event.ts`).
- `SettingsService` / `classes/settings.ts` holds emulator settings (defaults documented in README). Other services handle software loading (`module.service.ts` for RPK/ZIP/bin cartridges, `object-loader.service.ts` for E/A object files), disk images, the disassembler and audio.
- `src/assets/software/` and `src/assets/carts/` hold bundled software; relative `cartUrl`/`diskUrl` values resolve against `assets/`.

### Other
- `proxy/proxy.js` is a small Node HTTP proxy for downloading remote files (CORS workaround).
- `test/` contains a prebuilt deployment snapshot, not test sources.
