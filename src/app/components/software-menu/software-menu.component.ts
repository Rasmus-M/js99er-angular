import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Software} from '../../classes/software';
import {ModuleService} from '../../services/module.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Log} from '../../classes/log';
import {MoreSoftwareComponent} from '../more-software/more-software.component';
import { MatDialog } from '@angular/material/dialog';
import {MoreSoftwareService} from '../../services/more-software.service';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import {DiskService} from "../../services/disk.service";

@Component({
    selector: 'app-software-menu',
    templateUrl: './software-menu.component.html',
    styleUrls: ['./software-menu.component.css']
})
export class SoftwareMenuComponent implements OnInit {

    menuData: any;
    menuIcon = faBars;

    private log: Log = Log.getLog();

    constructor(
        private httpClient: HttpClient,
        public dialog: MatDialog,
        private moduleService: ModuleService,
        private diskService: DiskService,
        private moreSoftwareService: MoreSoftwareService,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
        this.httpClient.get("assets/software/index.json", {responseType: "json"}).subscribe(
            (menuData) => {
                this.menuData = menuData;
            },
            this.log.error
        );
    }

    openSoftware(url: string, diskUrl?: string) {
        if (url) {
            this.moduleService.loadModuleFromURL(url).subscribe({
                next: (software: Software) => {
                    this.commandDispatcherService.loadSoftware(software);
                },
                error: (error) => {
                    this.log.error(error);
                }
            });
            if (diskUrl) {
                this.diskService.fetchDiskFileFromURL(diskUrl).subscribe({
                    next: (file: File) => {
                        this.commandDispatcherService.loadDisk(0, [file]);
                    },
                    error: (error) => {
                        this.log.error(error);
                    }
                });
            }
        } else {
            this.commandDispatcherService.unloadSoftware();
        }
    }

    openMoreDialog(): void {
        this.moreSoftwareService.getIndex().subscribe(
            (carts: Software[]) => {
                this.commandDispatcherService.stopKeyboard();
                const dialogRef = this.dialog.open(MoreSoftwareComponent, {
                    width: '400px',
                    data: carts
                });
                dialogRef.afterClosed().subscribe(result => {
                    this.commandDispatcherService.startKeyboard();
                    if (result instanceof Software) {
                        this.openSoftware(result.url);
                    }
                });
            },
            this.log.error
        );
    }
}
