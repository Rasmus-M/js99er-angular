import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent, ErrorDialogData} from "../components/error-dialog/error-dialog.component";

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    static dialog: MatDialog;

    constructor(
        private dlg: MatDialog
    ) {}

    public init() {
        DialogService.dialog = this.dlg;
    }

    public static showErrorDialog(error: any) {
        const errorMessage = typeof error === 'object' ? JSON.stringify(error) : error;
        DialogService.dialog.open<ErrorDialogComponent, ErrorDialogData>(ErrorDialogComponent, {
            data: { message: errorMessage }
        });
    }

    public showErrorDialog(error: any) {
        DialogService.showErrorDialog(error);
    }
}
