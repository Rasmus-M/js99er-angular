import {Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from 'rxjs/index';
import * as $ from "jquery";
import {TI994A} from '../../emulator/classes/ti994a';
import {DisassemblerService} from '../../services/disassembler.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {Util} from '../../classes/util';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Command, CommandType} from '../../classes/command';

@Component({
    selector: 'app-debugger',
    templateUrl: './debugger.component.html',
    styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent implements OnInit, OnChanges, OnDestroy {

    @Input() visible: boolean;

    memoryView = 0;
    memoryType = 0;
    debuggerAddress: string;
    breakpointAddress: string;
    statusString: string;

    private ti994A: TI994A;
    private timerHandle: number;
    private eventSubscription: Subscription;
    private commandSubscription: Subscription;

    constructor(
        private element: ElementRef,
        private disassemblerService: DisassemblerService,
        private eventDispatcherService: EventDispatcherService,
        private commandDispatcherService: CommandDispatcherService,
    ) {}

    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
    }

    startUpdate() {
        this.timerHandle = window.setInterval(this.updateDebugger.bind(this), 200);
    }

    stopUpdate() {
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
            this.timerHandle = 0;
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
        }
    }

    private onCommand(command: Command) {
        switch (command.type) {
            case CommandType.SET_BREAKPOINT_ADDRESS:
                const addr = command.data;
                if (addr === undefined || addr === null) {
                    this.onBreakpointAddressChanged("");
                } else {
                    this.onBreakpointAddressChanged(Util.toHexWordShort(addr));
                }
                break;
        }
    }

    updateDebugger() {
        if (this.visible && this.ti994A) {
            setTimeout(() => {
                this.statusString = this.ti994A.getStatusString();
                let viewObj;
                const pc = this.ti994A.getPC();
                if (this.ti994A.isRunning()) {
                    // Running
                    if (this.memoryView === 0) {
                        // Disassemble
                        if (this.memoryType === 0) {
                            // CPU
                            this.disassemblerService.setMemory(this.ti994A.getMemory());
                            viewObj = this.disassemblerService.disassemble(pc, null, 19, pc);
                        } else {
                            // VDP
                            this.disassemblerService.setMemory(this.ti994A.getVDP());
                            viewObj = this.disassemblerService.disassemble(pc, null, 19, pc);
                        }
                    } else {
                        // Hex view
                        if (this.memoryType === 0) {
                            // CPU
                            const debuggerAddress = this.getDebuggerAddress(0x8300);
                            viewObj = this.ti994A.getMemory().hexView(debuggerAddress, 304, debuggerAddress);
                        } else {
                            // VDP
                            const debuggerAddress = this.getDebuggerAddress(0);
                            viewObj = this.ti994A.getVDP().hexView(debuggerAddress, 304, debuggerAddress);
                        }
                    }
                } else {
                    // Stopped
                    const debuggerAddress = this.getDebuggerAddress(pc);
                    if (this.memoryView === 0) {
                        // Disassemble
                        if (this.memoryType === 0) {
                            // CPU
                            this.disassemblerService.setMemory(this.ti994A.getMemory());
                            viewObj = this.disassemblerService.disassemble(0, 0x10000, null, debuggerAddress);
                            // viewObj = this.disassemblerService.disassemble(debuggerAddress - 0x400, 0x800, null, debuggerAddress);
                        } else {
                            // VDP
                            this.disassemblerService.setMemory(this.ti994A.getVDP());
                            viewObj = this.disassemblerService.disassemble(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, null, debuggerAddress);
                        }
                    } else {
                        // Hex view
                        if (this.memoryType === 0) {
                            // CPU
                            viewObj = this.ti994A.getMemory().hexView(0, 0x10000, debuggerAddress);
                        } else {
                            // VDP
                            viewObj = this.ti994A.getVDP().hexView(0, this.ti994A.getVDP().getGPU() ? 0x4800 : 0x4000, debuggerAddress);
                        }
                    }
                }
                const $memory = $(this.element.nativeElement).find("#memory");
                $memory.text(viewObj.text);
                if (viewObj.anchorLine) {
                    setTimeout(
                        function () {
                            $memory.scrollTop(viewObj.anchorLine * ($memory.prop('scrollHeight') / viewObj.lineCount));
                        }
                    );
                }
            });
        }
    }

    getDebuggerAddress(defaultValue: number) {
        const addr = Util.parseHexNumber(this.debuggerAddress);
        return isNaN(addr) ? defaultValue : addr;
    }

    onDebuggerAddressChanged(value) {
        const addr = Util.parseHexNumber(value);
        if (isNaN(addr)) {
            this.debuggerAddress = "";
        } else {
            this.debuggerAddress = Util.toHexWordShort(value);
        }
        this.updateDebugger();
    }

    onBreakpointAddressChanged(value) {
        const addr = Util.parseHexNumber(value);
        if (isNaN(addr)) {
            this.commandDispatcherService.setBreakpoint(null);
            this.breakpointAddress = "";
        } else {
            this.commandDispatcherService.setBreakpoint(addr);
            this.breakpointAddress = Util.toHexWordShort(value);
        }
        this.ti994A.getKeyboard().start();
        this.updateDebugger();
    }

    onTextFocus() {
        this.ti994A.getKeyboard().stop();
    }

    ngOnDestroy() {
        this.stopUpdate();
        this.eventSubscription.unsubscribe();
    }
}
