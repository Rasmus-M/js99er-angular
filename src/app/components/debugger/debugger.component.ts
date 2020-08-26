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
import {MemoryView} from "../../classes/memoryview";

enum MemoryViewType {
    DISASSEMBLY,
    HEX,
    SPLIT
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
    debuggerAddress: string;
    breakpointAddress: string;
    statusString: string;
    memoryString: string;
    memoryString2: string;
    memoryView: MemoryView;

    private ti994A: TI994A;
    private timerHandle: number;
    private eventSubscription: Subscription;
    private commandSubscription: Subscription;

    constructor(
        private element: ElementRef,
        private disassemblerService: DisassemblerService,
        private eventDispatcherService: EventDispatcherService,
        private commandDispatcherService: CommandDispatcherService
    ) {}


    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.visible.currentValue) {
            this.updateDebugger();
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
                this.updateDebugger();
                break;
            case ConsoleEventType.STATE_RESTORED:
                this.updateDebugger();
                break;
        }
    }

    private onCommand(command: Command) {
        if (command.type === CommandType.SET_BREAKPOINT_ADDRESS) {
            const addr = command.data;
            if (addr === undefined || addr === null) {
                this.breakpointAddress = "";
            } else {
                this.breakpointAddress = Util.toHexWordShort(addr);
            }
        }
    }

    updateDebugger() {
        if (this.visible && this.ti994A) {
            // console.log("Update debugger");
            this.statusString = this.ti994A.getStatusString();
            let memoryView: MemoryView;
            switch (this.memoryViewType) {
                case MemoryViewType.DISASSEMBLY:
                    memoryView = this.getDisassemblyView(this.memoryType);
                    break;
                case MemoryViewType.HEX:
                    memoryView = this.getHexView(this.memoryType, false);
                    break;
                case MemoryViewType.SPLIT:
                    memoryView = this.getDisassemblyView(0);
                    const viewObj2 = this.getHexView(this.memoryType, true);
                    this.memoryString2 = viewObj2.lines.join("\n");
                    this.scrollToAnchorLine(viewObj2, "memory2");
                    break;
            }
            this.memoryString = memoryView.lines.join("\n");
            this.scrollToAnchorLine(memoryView, this.getAseemblyViewId());
            this.memoryView = memoryView;
        }
    }

    scrollToAnchorLine(viewObj: MemoryView, id: string) {
        const $memory = $(this.element.nativeElement).find("#" + id);
        if (viewObj.anchorLine !== null && viewObj.lines.length > 0) {
            setTimeout(
                function () {
                    const lineHeight = $memory.prop('scrollHeight') / viewObj.lines.length;
                    $memory.scrollTop(viewObj.anchorLine * lineHeight);
                }
            );
        }
    }

    getDisassemblyView(memoryType: number): MemoryView {
        let memoryView: MemoryView;
        const breakpointAddress = this.getBreakpointAddress(null);
        const pc = this.ti994A.getPC();
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
            const debuggerAddress = this.memoryViewType === MemoryViewType.SPLIT ? pc : this.getDebuggerAddress(pc);
            if (memoryType === MemoryType.CPU) {
                // CPU
                this.disassemblerService.setMemory(this.ti994A.getMemory());
                // viewObj = this.disassemblerService.disassemble(0, 0x10000, null, debuggerAddress);
                memoryView = this.disassemblerService.disassemble(debuggerAddress - 0x800, 0x1000, null, debuggerAddress, breakpointAddress);
            } else {
                // VDP
                this.disassemblerService.setMemory(this.ti994A.getVDP());
                memoryView = this.disassemblerService.disassemble(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, null, debuggerAddress, breakpointAddress);
            }
        }
        return memoryView;
    }

    getHexView(memoryType: number, narrow: boolean): MemoryView {
        const width = narrow ? 8 : 16;
        let memoryView: MemoryView;
        const pc = this.ti994A.getPC();
        if (this.ti994A.isRunning()) {
            // Running
            if (memoryType === MemoryType.CPU) {
                // CPU
                const debuggerAddress = this.getDebuggerAddress(0x8300);
                memoryView = this.ti994A.getMemory().hexView(debuggerAddress, 512, width, debuggerAddress);
            } else {
                // VDP
                const debuggerAddress = this.getDebuggerAddress(0);
                memoryView = this.ti994A.getVDP().hexView(debuggerAddress, 512, width, debuggerAddress);
            }
        } else {
            // Stopped
            const debuggerAddress = this.getDebuggerAddress(pc);
            if (memoryType === MemoryType.CPU) {
                // CPU
                memoryView = this.ti994A.getMemory().hexView(debuggerAddress % width, 0x10000, width, debuggerAddress);
            } else {
                // VDP
                memoryView = this.ti994A.getVDP().hexView(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, width, debuggerAddress);
            }
        }
        return memoryView;
    }

    getDebuggerAddress(defaultValue: number) {
        const addr = Util.parseHexNumber(this.debuggerAddress);
        return isNaN(addr) ? defaultValue : addr;
    }

    getBreakpointAddress(defaultValue: number) {
        const addr = Util.parseHexNumber(this.breakpointAddress);
        return isNaN(addr) ? defaultValue : addr;
    }

    onDebuggerAddressChanged(value: string) {
        const addr = Util.parseHexNumber(value);
        if (isNaN(addr)) {
            this.debuggerAddress = "";
        } else {
            this.debuggerAddress = Util.toHexWordShort(addr);
        }
        this.updateDebugger();
    }

    onBreakpointAddressChanged(value: string) {
        const addr = Util.parseHexNumber(value);
        if (isNaN(addr)) {
            this.commandDispatcherService.setBreakpoint(null);
            this.breakpointAddress = "";
        } else {
            this.commandDispatcherService.setBreakpoint(addr);
            this.breakpointAddress = Util.toHexWordShort(addr);
        }
        this.updateDebugger();
    }

    onTextFocus() {
        this.commandDispatcherService.stopKeyboard();
    }

    onTextBlur() {
        this.commandDispatcherService.startKeyboard();
    }

    ngOnDestroy() {
        this.stopUpdate();
        this.eventSubscription.unsubscribe();
        this.commandSubscription.unsubscribe();
    }

    onMemoryViewChanged(memoryViewType: MemoryViewType) {
        this.memoryViewType = memoryViewType;
        this.updateDebugger();
    }

    onMemoryTypeChanged(memoryType: MemoryType) {
        this.memoryType = memoryType;
        this.updateDebugger();
    }

    onMemoryViewClicked(event: MouseEvent) {
        console.log("click");
        if (this.memoryViewType !== MemoryViewType.HEX && !this.ti994A.isRunning() && this.memoryView && event.offsetX < 64) {
            const $memory = $(this.element.nativeElement).find("#" + this.getAseemblyViewId());
            const lineHeight = $memory.prop('scrollHeight') / this.memoryView.lines.length;
            const lineNo = Math.floor(($memory.prop('scrollTop') + event.offsetY) / lineHeight);
            const line = this.memoryView.lines[lineNo];
            const addressString = line.substr(3, 4);
            if (addressString !== this.breakpointAddress) {
                this.onBreakpointAddressChanged(addressString);
            } else {
                this.onBreakpointAddressChanged("");
            }
            this.updateDebugger();
        }
    }

    getAseemblyViewId() {
        return this.memoryViewType !== MemoryViewType.SPLIT ? "memory" : "memory1";
    }
}
