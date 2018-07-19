import {Component, Input, OnInit} from '@angular/core';
import {Software} from '../../classes/software';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Log} from '../../classes/log';
import {MoreSoftwareComponent} from '../more-software/more-software.component';
import {MatDialog} from '@angular/material';
import {MoreSoftwareService} from '../../services/more-software.service';

@Component({
    selector: 'app-software-menu',
    templateUrl: './software-menu.component.html',
    styleUrls: ['./software-menu.component.css']
})
export class SoftwareMenuComponent implements OnInit {

    @Input() menuData: any;

    private log: Log = Log.getLog();

    constructor(
        private softwareMenuService: SoftwareMenuService,
        private moreSoftwareService: MoreSoftwareService,
        private commandDispatcherService: CommandDispatcherService,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
    }

    openSoftware(url) {
        this.softwareMenuService.loadModuleFromMenu(url).subscribe(
            (software: Software) => {
                this.commandDispatcherService.loadSoftware(software);
            },
            (error) => {
                console.log(error);
                this.log.error(error);
            }
        );
    }

    openMoreDialog(): void {
        const dialogRef = this.dialog.open(MoreSoftwareComponent, {
            width: '400px',
            data: this.moreSoftwareService.getAllCarts()
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result instanceof Software) {
                this.openSoftware(result.url);
            }
        });
    }
}
