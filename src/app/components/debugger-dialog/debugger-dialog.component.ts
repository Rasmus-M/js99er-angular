import {Component, Inject} from "@angular/core";
import {DialogRef} from "@angular/cdk/dialog";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {Breakpoint, BreakpointType} from "../../classes/breakpoint";
import {faBan, faTrash} from "@fortawesome/free-solid-svg-icons";

export interface DebuggerDialogData {
    cycleCountStart: number;
    cycleCountEnd: number;
    breakpoints: Breakpoint[];
}

@Component({
    templateUrl: 'debugger-dialog.component.html',
    styleUrls: ['debugger-dialog.component.css']
})
export class DebuggerDialogComponent {

    protected readonly deleteIcon = faTrash;

    constructor(
        private dialogRef: DialogRef,
        @Inject(MAT_DIALOG_DATA) public data: DebuggerDialogData
    ) {}

    addBreakpoint() {
        this.data.breakpoints.push(new Breakpoint(BreakpointType.INSTRUCTION, NaN, 0xffff));
    }

    deleteBreakpoint(breakpoint: Breakpoint) {
        this.data.breakpoints.splice(this.data.breakpoints.indexOf(breakpoint), 1);
    }

    cancel() {
        this.dialogRef.close();
    }
}
