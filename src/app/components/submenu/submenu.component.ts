import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Software} from '../../classes/software';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Log} from '../../classes/log';

@Component({
    selector: 'app-submenu',
    templateUrl: './submenu.component.html',
    styleUrls: ['./submenu.component.css']
})
export class SubmenuComponent {

    @Input() data: any;
    @Output() closing: EventEmitter<boolean>;

    log: Log = Log.getLog();

    constructor(
        private softwareMenuService: SoftwareMenuService,
        private commandDispatcherService: CommandDispatcherService
    ) {
        this.closing = new EventEmitter<boolean>();
    }

    openSoftware(i: number) {
        this.closing.emit(true);
        this.softwareMenuService.loadModuleFromMenu(this.data[i].url).subscribe(
            (software: Software) => {
                this.commandDispatcherService.loadSoftware(software);
            },
            (error) => {
                console.log(error);
                this.log.error(error);
            }
        );
    }

    openSubmenu(i: number, evt: Event) {
        for (let j = 0; j < this.data.length; j++) {
            if (this.data[j].type === "SUBMENU") {
                this.data[j].items.visible = i === j;
            }
        }
        evt.stopPropagation();
    }

    onClose() {
        for (let j = 0; j < this.data.length; j++) {
            if (this.data[j].type === "SUBMENU") {
                this.data[j].items.visible = false;
            }
        }
        this.closing.emit(true);
    }
}
