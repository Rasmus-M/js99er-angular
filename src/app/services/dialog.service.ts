import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent, ErrorDialogData} from "../components/error-dialog/error-dialog.component";
import {DebuggerDialogComponent, DebuggerDialogData} from "../components/debugger-dialog/debugger-dialog.component";
import {firstValueFrom} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    static dialog: MatDialog;

    public static showErrorDialog(error: any) {
        const errorMessage = typeof error === 'object' ? JSON.stringify(error) : error;
        DialogService.dialog.open<ErrorDialogComponent, ErrorDialogData>(ErrorDialogComponent, {
            data: { message: errorMessage }
        });
    }

    constructor(
        private dlg: MatDialog
    ) {}

    public init() {
        DialogService.dialog = this.dlg;
    }

    public showErrorDialog(error: any) {
        DialogService.showErrorDialog(error);
    }

    public showDebuggerDialog(data: DebuggerDialogData) {
        const dialogRef = this.dlg.open<DebuggerDialogComponent, DebuggerDialogData, DebuggerDialogData>(DebuggerDialogComponent, { data: data });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
