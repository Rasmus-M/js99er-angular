import {Component, OnInit} from '@angular/core';
import {CommandService} from '../command.service';

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css']
})
export class MainControlsComponent implements OnInit {

    commandService: CommandService;

    constructor(commandService: CommandService) {
        this.commandService = commandService;
    }

    ngOnInit() {
    }

    start() {
        this.commandService.start();
    }

    fast() {
        this.commandService.fast();
    }

    frame() {
        this.commandService.frame();
    }

    step() {
        this.commandService.step();
    }

    pause() {
        this.commandService.pause();
    }

    reset() {
        this.commandService.reset();
    }

    openModule(files: FileList) {
        if (files.length) {
            this.commandService.openModule(files[0]);
        }
    }

    openDisk(files: FileList) {
        if (files.length) {
            this.commandService.openDisk(files);
        }
    }
}
