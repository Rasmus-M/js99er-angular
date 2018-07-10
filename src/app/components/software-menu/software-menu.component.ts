import {Component, Input, OnInit} from '@angular/core';
import {Software} from '../../classes/software';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Log} from '../../classes/log';

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
        private commandDispatcherService: CommandDispatcherService
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

}
