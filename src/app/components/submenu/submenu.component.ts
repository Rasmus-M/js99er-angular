import {Component, Input, OnInit} from '@angular/core';
import {Software, SoftwareType} from '../../classes/software';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Log} from '../../classes/log';

@Component({
    selector: 'app-submenu',
    templateUrl: './submenu.component.html',
    styleUrls: ['./submenu.component.css']
})
export class SubmenuComponent implements OnInit {

    @Input() structure: any;
    @Input() path: string;

    log: Log = Log.getLog();

    constructor(
        private softwareMenuService: SoftwareMenuService,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
    }

    getPath(index: number) {
        return (this.path ? this.path + "." : "") + index;
    }

    openSoftware(path: string) {
        this.softwareMenuService.loadModuleFromMenu(path).subscribe(
            (software: Software) => {
                this.commandDispatcherService.openSoftware(software);
            },
            (error) => {
                console.log(error);
                this.log.error(error);
            }
        );
    }
}
