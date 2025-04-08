import {Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import $ from 'jquery';
import {TI994A} from '../../emulator/classes/ti994a';
import {DisassemblerService} from '../../services/disassembler.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/console-event';
import {Util} from '../../classes/util';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {MemoryLine, MemoryView} from "../../classes/memory-view";
import {faCogs} from "@fortawesome/free-solid-svg-icons";
import {DebuggerDialogData} from "../debugger-dialog/debugger-dialog.component";
import {MemoryDevice} from "../../emulator/interfaces/memory-device";
import {DialogService} from "../../services/dialog.service";
import {Breakpoint, BreakpointType} from "../../classes/breakpoint";

enum MemoryViewType {
    DISASSEMBLY,
    HEX,
    SPLIT,
    LIST
}

enum MemoryType {
    CPU,
    VDP,
    SAMS,
    CART,
    GROM
}

@Component({
    selector: 'debugger',
    templateUrl: './debugger.component.html',
    styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent implements OnInit, OnChanges, OnDestroy {

    @Input() visible: boolean;

    memoryViewType: MemoryViewType = MemoryViewType.SPLIT;
    memoryType: MemoryType = MemoryType.CPU;
    viewAddress: number;
    breakpoint: Breakpoint;
    addressDigits = 4;
    statusString: string;
    memoryString: string;
    memoryString2: string;
    memoryView: MemoryView;
    expandStatus = false;

    protected readonly faCogs = faCogs;

    private ti994A: TI994A;
    private timerHandle: number | null;
    private scrollTimeoutHandles: {[key: string]: number} = {};
    private eventSubscription: Subscription;
    private listView: MemoryView;
    private listViewMap: Map<number, MemoryLine>;
    private lastAnchorLine: MemoryLine | null = null;
    private lastBreakpointLines: MemoryLine[] = [];
    private breakpoints: Breakpoint[] = [];

    private readonly nullMemoryDevice: MemoryDevice = {
        getMemorySize(): number {
            return 0;
        }, getWord(addr: number): number {
            return 0;
        }, hexView(start: number, length: number, width: number, anchorAddr: number): MemoryView {
            return new MemoryView([], null, []);
        }
    };

    constructor(
        private element: ElementRef,
        private disassemblerService: DisassemblerService,
        private eventDispatcherService: EventDispatcherService,
        private commandDispatcherService: CommandDispatcherService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe((event) => {
            this.onEvent(event);
        });
        this.breakpoint = new Breakpoint(BreakpointType.INSTRUCTION, NaN, 0xffff);
        this.breakpoints.push(this.breakpoint);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'].currentValue) {
            this.updateDebugger(false);
        }
    }

    ngOnDestroy() {
        this.stopUpdate();
        this.eventSubscription.unsubscribe();
    }

    startUpdate() {
        if (!this.timerHandle) {
            this.timerHandle = window.setInterval(this.updateDebugger.bind(this), 200);
        }
    }

    stopUpdate() {
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    private onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                break;
            case ConsoleEventType.STARTED:
                this.startUpdate();
                break;
            case ConsoleEventType.STOPPED:
                this.stopUpdate();
                this.updateDebugger(true);
                break;
            case ConsoleEventType.STATE_RESTORED:
                this.updateDebugger(true);
                break;
            case ConsoleEventType.BREAKPOINTS_RESTORED:
                this.breakpoints = event.data;
                break;
        }
    }

    private updateDebugger(force: boolean) {
        if (this.visible && this.ti994A) {
            this.statusString = this.ti994A.getStatusString(this.expandStatus);
            let memoryView: MemoryView;
            switch (this.memoryViewType) {
                case MemoryViewType.DISASSEMBLY:
                    memoryView = this.getDisassemblyView(this.memoryType);
                    break;
                case MemoryViewType.HEX:
                    memoryView = this.getHexView(this.memoryType, false);
                    break;
                case MemoryViewType.SPLIT:
                    memoryView = this.getDisassemblyView(this.ti994A.isGPUActive() ? MemoryType.VDP : MemoryType.CPU);
                    const memoryView2 = this.getHexView(this.memoryType, true);
                    this.memoryString2 = memoryView2.lines.map(l => l.text).join("\n");
                    this.scrollToAnchorLine(memoryView2, "memory2");
                    break;
                case MemoryViewType.LIST:
                    memoryView = this.getListView(this.memoryType);
                    break;
            }
            if (force || this.memoryViewType !== MemoryViewType.LIST) {
                this.memoryString = memoryView.lines.map(l => l.text).join("\n");
            }
            this.scrollToAnchorLine(memoryView, this.getAssemblyViewId());
            this.memoryView = memoryView;
        }
    }

    private scrollToAnchorLine(memoryView: MemoryView, id: string) {
        const $memory = $(this.element.nativeElement).find("#" + id);
        if (memoryView.anchorLine != null && memoryView.lines.length > 0) {
            if (this.scrollTimeoutHandles[id]) {
                clearTimeout(this.scrollTimeoutHandles[id]);
            }
            this.scrollTimeoutHandles[id] = window.setTimeout(
                function () {
                    if (memoryView.anchorLine !== null) {
                        const lineHeight = $memory.prop('scrollHeight') / memoryView.lines.length;
                        $memory.scrollTop(memoryView.anchorLine * lineHeight - 1);
                    }
                }, 100
            );
        }
    }

    private getDisassemblyView(memoryType: MemoryType): MemoryView {
        let memoryView: MemoryView;
        const pc = this.ti994A.getPC();
        const cycleLog = this.ti994A.getCPU().getCycleLog();
        const memoryDevice = this.getMemoryDevice(memoryType);
        if (this.ti994A.isRunning()) {
            // Running
            this.disassemblerService.setMemory(memoryDevice);
            memoryView = this.disassemblerService.disassemble(pc, null, 32, pc, this.breakpoints);
        } else {
            // Stopped
            const viewAddress = this.memoryViewType === MemoryViewType.SPLIT ? pc : this.getViewAddress(pc);
            this.disassemblerService.setMemory(memoryDevice);
            memoryView = this.disassemblerService.disassemble(Math.max(viewAddress - 0x800, 0), 0x1000, null, viewAddress, this.breakpoints);
            if (memoryType === MemoryType.CPU) {
                memoryView.lines.forEach((memoryLine) => {
                    if (memoryLine.addr !== null) {
                        const cycles = cycleLog[memoryLine.addr];
                        if (cycles) {
                            memoryLine.text = Util.padr(memoryLine.text + ' ', ' ', 38) + cycles;
                        }
                    }
                });
            }
        }
        return memoryView;
    }

    private getHexView(memoryType: MemoryType, narrow: boolean): MemoryView {
        let memoryView: MemoryView;
        const width = narrow ? 8 : 16;
        const memoryDevice = this.getMemoryDevice(memoryType);
        if (this.ti994A.isRunning()) {
            // Running
            const viewAddress = this.getViewAddress(memoryType === MemoryType.CPU ? 0x8300 : 0);
            memoryView = memoryDevice.hexView(viewAddress, 512, width, viewAddress);
        } else {
            // Stopped
            const viewAddress = this.getViewAddress(this.ti994A.getPC());
            const offset = viewAddress % width;
            const start = offset ? offset - width : 0;
            const length = memoryDevice.getMemorySize() + offset + (offset ? width : 0);
            memoryView = memoryDevice.hexView(start, length, width, viewAddress);
        }
        return memoryView;
    }

    private getListView(memoryType: MemoryType): MemoryView {
        if (this.listView && memoryType === MemoryType.CPU) {
            if (this.lastAnchorLine != null) {
                this.lastAnchorLine.text = ' ' + this.lastAnchorLine.text.substring(1);
                this.lastAnchorLine = null;
            }
            for (const lastBreakpointLine of this.lastBreakpointLines) {
                lastBreakpointLine.text = lastBreakpointLine.text.charAt(0) + ' ' + lastBreakpointLine.text.substring(2);
            }
            this.lastBreakpointLines = [];
            const viewAddress = this.getViewAddress(this.ti994A.getPC());
            const anchorLine = this.listViewMap.get(viewAddress);
            if (anchorLine) {
                anchorLine.text = '\u25ba' + anchorLine.text.substring(1);
                this.lastAnchorLine = anchorLine;
            }
            this.listView.anchorLine = this.lastAnchorLine?.index || null;
            for (const breakpoint of this.breakpoints) {
                const breakpointLine = this.listViewMap.get(breakpoint.addr);
                if (breakpointLine) {
                    breakpointLine.text = breakpointLine.text.charAt(0) + '\u25cf' + breakpointLine.text.substring(2);
                    this.lastBreakpointLines.push(breakpointLine);
                }
            }
            return this.listView;
        } else {
            return {lines: [], anchorLine: null, breakpointLines: []};
        }
    }

    private getMemoryDevice(memoryType: MemoryType): MemoryDevice {
        const memory = this.ti994A.getMemory();
        switch (memoryType) {
            case MemoryType.CPU:
                return memory;
            case MemoryType.VDP:
                return this.ti994A.getVDP();
            case MemoryType.SAMS:
                return memory.getSAMS() || this.nullMemoryDevice;
            case MemoryType.CART:
                return memory.getCartridge() || this.nullMemoryDevice;
            case MemoryType.GROM:
                return memory.getGROM();
            default:
                return memory;
        }
    }

    private getViewAddress(defaultValue: number) {
        return isNaN(this.viewAddress) ? defaultValue : this.viewAddress;
    }

    protected onViewAddressChanged() {
        this.updateDebugger(true);
    }

    protected onBreakpointAddressChanged() {
        this.commandDispatcherService.setBreakpoints(this.breakpoints);
        this.updateDebugger(true);
    }

    protected onMemoryViewChanged(memoryViewType: MemoryViewType) {
        this.memoryViewType = memoryViewType;
        this.updateDebugger(true);
    }

    protected onMemoryTypeChanged(memoryType: MemoryType) {
        this.memoryType = memoryType;
        switch (memoryType) {
            case MemoryType.CPU:
                this.addressDigits = 4;
                break;
            case MemoryType.VDP:
                this.addressDigits = 4;
                break;
            case MemoryType.SAMS:
                this.addressDigits = 5;
                break;
            case MemoryType.CART:
                this.addressDigits = 5;
                break;
            case MemoryType.GROM:
                this.addressDigits = 4;
                break;
        }
        this.updateDebugger(true);
    }

    protected onMemoryViewClicked(event: MouseEvent) {
        if (this.memoryViewType !== MemoryViewType.HEX && !this.ti994A.isRunning() && this.memoryView && event.offsetX < 64) {
            const $memory = $(this.element.nativeElement).find("#" + this.getAssemblyViewId());
            const lineHeight = $memory.prop('scrollHeight') / this.memoryView.lines.length;
            const lineNo = Math.floor(($memory.prop('scrollTop') + event.offsetY) / lineHeight);
            const line = this.memoryView.lines[lineNo];
            const lineAddr = line.addr !== null ? line.addr : NaN;
            const breakpoint = this.breakpoints.find(bp => bp.addr === line.addr);
            if (!breakpoint) {
                let found = false;
                for (const breakpoint of this.breakpoints) {
                    if (isNaN(breakpoint.addr)) {
                        breakpoint.addr = lineAddr;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.breakpoints.push(new Breakpoint(BreakpointType.INSTRUCTION, lineAddr , 0xffff));
                }
            } else {
                breakpoint.addr = NaN;
                while (this.breakpoints.length > 1 && isNaN(this.breakpoints[this.breakpoints.length - 1].addr)) {
                    this.breakpoints.pop();
                }
            }
            this.onBreakpointAddressChanged();
        }
    }

    private getAssemblyViewId() {
        return this.memoryViewType !== MemoryViewType.SPLIT ? "memory" : "memory1";
    }

    protected openListFile(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files && files.length) {
            const file: File = files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                const lines = text.split('\n');
                this.listViewMap = new Map<number, MemoryLine>();
                const memoryLines: MemoryLine[] = lines.map((line, index) => {
                    const addr = Util.parseHexNumber(line.substring(5, 10));
                    const memoryLine = {
                        index: index,
                        addr: !isNaN(addr) ? addr : null,
                        text: '  ' + line
                    };
                    if (!isNaN(addr)) {
                        this.listViewMap.set(addr, memoryLine);
                    }
                    return memoryLine;
                });
                this.listView = {
                    lines: memoryLines,
                    breakpointLines: [],
                    anchorLine: null
                };
                this.memoryString = '';
                this.updateDebugger(true);
            };
            reader.readAsText(file);
            fileInput.value = "";
        }
    }

    protected toggleExpandStatus() {
        this.expandStatus = !this.expandStatus;
        this.updateDebugger(false);
    }

    protected openDialog() {
        const cycleCount = this.ti994A.getCPU().getCycleCount();
        const data: DebuggerDialogData = {
            cycleCountStart: cycleCount.start,
            cycleCountEnd: cycleCount.end,
            breakpoints: this.breakpoints
        };
        this.dialogService.showDebuggerDialog(data).then(
            (value) => {
                if (value) {
                    this.ti994A.getCPU().setCycleCount(value.cycleCountStart, value.cycleCountEnd);
                    this.updateDebugger(true);
                }
            }
        ).catch(
            (error) => {
                console.error(error);
            }
        );
    }
}
