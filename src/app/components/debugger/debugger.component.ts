import {Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import * as $ from 'jquery';
import {TI994A} from '../../emulator/classes/ti994a';
import {DisassemblerService} from '../../services/disassembler.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {Util} from '../../classes/util';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Command, CommandType} from '../../classes/command';
import {MemoryLine, MemoryView} from "../../classes/memoryview";
import {faCogs} from "@fortawesome/free-solid-svg-icons";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DebuggerDialogComponent, DebuggerDialogData} from "../debugger-dialog/debugger-dialog.component";
import {DialogRef} from "@angular/cdk/dialog";

enum MemoryViewType {
    DISASSEMBLY,
    HEX,
    SPLIT,
    LIST
}

enum MemoryType {
    CPU,
    VDP
}

@Component({
    selector: 'app-debugger',
    templateUrl: './debugger.component.html',
    styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent implements OnInit, OnChanges, OnDestroy {

    @Input() visible: boolean;

    memoryViewType: MemoryViewType = MemoryViewType.SPLIT;
    memoryType: MemoryType = MemoryType.CPU;
    viewAddress: number;
    breakpointAddress: number;
    statusString: string;
    memoryString: string;
    memoryString2: string;
    memoryView: MemoryView;
    expandStatus = false;

    protected readonly faCogs = faCogs;

    private ti994A: TI994A;
    private timerHandle: number;
    private scrollTimeoutHandles: number[] = [];
    private eventSubscription: Subscription;
    private commandSubscription: Subscription;
    private listView: MemoryView;
    private listViewMap: Map<number, MemoryLine>;
    private lastAnchorLine: MemoryLine | null = null;
    private lastBreakpointLine: MemoryLine | null = null;

    constructor(
        private element: ElementRef,
        private disassemblerService: DisassemblerService,
        private eventDispatcherService: EventDispatcherService,
        private commandDispatcherService: CommandDispatcherService,
        private matDialog: MatDialog
    ) {}


    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe((event) => {
            this.onEvent(event);
        });
        this.commandSubscription = this.commandDispatcherService.subscribe((event) => {
            this.onCommand(event);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.visible.currentValue) {
            this.updateDebugger(false);
        }
    }

    ngOnDestroy() {
        this.stopUpdate();
        this.eventSubscription.unsubscribe();
        this.commandSubscription.unsubscribe();
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
        }
    }

    private onCommand(command: Command) {
        if (command.type === CommandType.SET_BREAKPOINT_ADDRESS) {
            const addr = command.data;
            if (addr === undefined || addr === null) {
                this.breakpointAddress = 0;
            } else {
                this.breakpointAddress = addr;
            }
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
            this.scrollTimeoutHandles[id] = setTimeout(
                function () {
                    const lineHeight = $memory.prop('scrollHeight') / memoryView.lines.length;
                    $memory.scrollTop(memoryView.anchorLine * lineHeight + 1);
                }, 100
            );
        }
    }

    private getDisassemblyView(memoryType: MemoryType): MemoryView {
        let memoryView: MemoryView;
        const breakpointAddress = this.getBreakpointAddress(null);
        const pc = this.ti994A.getPC();
        const cycleLog = this.ti994A.getCPU().getCycleLog();
        if (this.ti994A.isRunning()) {
            // Running
            if (memoryType === MemoryType.CPU) {
                // CPU
                this.disassemblerService.setMemory(this.ti994A.getMemory());
            } else {
                // VDP
                this.disassemblerService.setMemory(this.ti994A.getVDP());
            }
            memoryView = this.disassemblerService.disassemble(pc, null, 32, pc, breakpointAddress);
        } else {
            // Stopped
            const viewAddress = this.memoryViewType === MemoryViewType.SPLIT ? pc : this.getViewAddress(pc);
            if (memoryType === MemoryType.CPU) {
                // CPU
                this.disassemblerService.setMemory(this.ti994A.getMemory());
                memoryView = this.disassemblerService.disassemble(viewAddress - 0x800, 0x1000, null, viewAddress, breakpointAddress);
                memoryView.lines.forEach((memoryLine) => {
                    const cycles = cycleLog[memoryLine.addr];
                    if (cycles) {
                        memoryLine.text = Util.padr(memoryLine.text + ' ', ' ', 38) + cycles;
                    }
                });
            } else {
                // VDP
                this.disassemblerService.setMemory(this.ti994A.getVDP());
                memoryView = this.disassemblerService.disassemble(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, null, viewAddress, breakpointAddress);
            }
        }
        return memoryView;
    }

    private getHexView(memoryType: MemoryType, narrow: boolean): MemoryView {
        const width = narrow ? 8 : 16;
        let memoryView: MemoryView;
        const pc = this.ti994A.getPC();
        if (this.ti994A.isRunning()) {
            // Running
            if (memoryType === MemoryType.CPU) {
                // CPU
                const viewAddress = this.getViewAddress(0x8300);
                memoryView = this.ti994A.getMemory().hexView(viewAddress, 512, width, viewAddress);
            } else {
                // VDP
                const viewAddress = this.getViewAddress(0);
                memoryView = this.ti994A.getVDP().hexView(viewAddress, 512, width, viewAddress);
            }
        } else {
            // Stopped
            const viewAddress = this.getViewAddress(pc);
            if (memoryType === MemoryType.CPU) {
                // CPU
                memoryView = this.ti994A.getMemory().hexView(viewAddress % width, 0x10000, width, viewAddress);
            } else {
                // VDP
                memoryView = this.ti994A.getVDP().hexView(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, width, viewAddress);
            }
        }
        return memoryView;
    }

    private getListView(memoryType: MemoryType): MemoryView {
        if (this.listView && memoryType === MemoryType.CPU) {
            if (this.lastAnchorLine != null) {
                this.lastAnchorLine.text = ' ' + this.lastAnchorLine.text.substring(1);
                this.lastAnchorLine = null;
            }
            if (this.lastBreakpointLine != null) {
                this.lastBreakpointLine.text = this.lastBreakpointLine.text.charAt(0) + ' ' + this.lastBreakpointLine.text.substring(2);
                this.lastBreakpointLine = null;
            }
            const viewAddress = this.getViewAddress(this.ti994A.getPC());
            const anchorLine = this.listViewMap.get(viewAddress);
            if (anchorLine) {
                anchorLine.text = '\u25ba' + anchorLine.text.substring(1);
                this.lastAnchorLine = anchorLine;
            }
            this.listView.anchorLine = this.lastAnchorLine?.index || null;
            const breakpointAddress = this.getBreakpointAddress(null);
            const breakpointLine = this.listViewMap.get(breakpointAddress);
            if (breakpointLine) {
                breakpointLine.text = breakpointLine.text.charAt(0) + '\u25cf' + breakpointLine.text.substring(2);
                this.lastBreakpointLine = breakpointLine;
            }
            this.listView.breakpointLine = this.lastBreakpointLine?.index || null;
            return this.listView;
        } else {
            return {lines: [], anchorLine: null, breakpointLine: null};
        }
    }

    private getViewAddress(defaultValue: number) {
        return isNaN(this.viewAddress) ? defaultValue : this.viewAddress;
    }

    private getBreakpointAddress(defaultValue: number) {
        return isNaN(this.breakpointAddress) ? defaultValue : this.breakpointAddress;
    }

    protected onViewAddressChanged() {
        this.updateDebugger(true);
    }

    protected onBreakpointAddressChanged() {
        this.commandDispatcherService.setBreakpoint(this.breakpointAddress);
        this.updateDebugger(true);
    }

    protected onMemoryViewChanged(memoryViewType: MemoryViewType) {
        this.memoryViewType = memoryViewType;
        this.updateDebugger(true);
    }

    protected onMemoryTypeChanged(memoryType: MemoryType) {
        this.memoryType = memoryType;
        this.updateDebugger(true);
    }

    protected onMemoryViewClicked(event: MouseEvent) {
        if (this.memoryViewType !== MemoryViewType.HEX && !this.ti994A.isRunning() && this.memoryView && event.offsetX < 64) {
            const $memory = $(this.element.nativeElement).find("#" + this.getAssemblyViewId());
            const lineHeight = $memory.prop('scrollHeight') / this.memoryView.lines.length;
            const lineNo = Math.floor(($memory.prop('scrollTop') + event.offsetY) / lineHeight);
            const line = this.memoryView.lines[lineNo];
            this.breakpointAddress = line.addr;
            this.onBreakpointAddressChanged();
        }
    }

    private getAssemblyViewId() {
        return this.memoryViewType !== MemoryViewType.SPLIT ? "memory" : "memory1";
    }

    protected openListFile(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {
            const file: File = fileInput.files[0];
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
                    breakpointLine: null,
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
            cycleCountEnd: cycleCount.end
        };
        const dialogRef = this.matDialog.open<DebuggerDialogComponent, DebuggerDialogData, DebuggerDialogData>(DebuggerDialogComponent, { data: data });
        dialogRef.afterClosed().subscribe(
            (value) => {
                if (value) {
                    this.ti994A.getCPU().setCycleCount(value.cycleCountStart, value.cycleCountEnd);
                }
            }
        );
    }
}
