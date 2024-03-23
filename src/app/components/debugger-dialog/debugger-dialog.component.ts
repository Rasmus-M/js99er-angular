import {Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {DialogRef} from "@angular/cdk/dialog";
import {MAT_DIALOG_DATA, MatDialog} from "@angular/material/dialog";

export interface DebuggerDialogData {
    cycleCountStart: number;
    cycleCountEnd: number;
}

@Component({
    templateUrl: 'debugger-dialog.component.html',
    styleUrls: ['debugger-dialog.component.css']
})
export class DebuggerDialogComponent {

    constructor(
        private dialogRef: DialogRef,
        @Inject(MAT_DIALOG_DATA) public data: DebuggerDialogData
    ) {}

    cancel() {
        this.dialogRef.close();
    }
}
