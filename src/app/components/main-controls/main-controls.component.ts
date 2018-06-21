import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import * as $ from 'jquery';
import 'bootstrap';
import 'bootstrap-select';
import {SoftwareMenuService} from '../../services/software-menu.service';

// declare var jQuery: JQuery;

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements AfterViewInit {

    running = false;
    driveIndex = 0;
    menu = SoftwareMenuService.MENU;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngAfterViewInit() {
        const select = this.element.nativeElement.querySelector(".selectpicker");
        $(select).selectpicker({iconBase: 'fa'});
    }

    start() {
        this.running = true;
        this.commandDispatcherService.start();
    }

    fast() {
        this.running = true;
        this.commandDispatcherService.fast();
    }

    frame() {
        this.commandDispatcherService.frame();
    }

    step() {
        this.commandDispatcherService.step();
    }

    pause() {
        this.running = false;
        this.commandDispatcherService.pause();
    }

    reset() {
        this.running = true;
        this.commandDispatcherService.reset();
    }

    openModule(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.openModule(files[0]);
        }
    }

    openDisk(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.openDisk(files, this.driveIndex);
        }
    }
}
