import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import {CommandDispatcherService} from '../services/command-dispatcher.service';
import * as $ from 'jquery';
import 'bootstrap';
import 'bootstrap-select';

// declare var jQuery: JQuery;

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements OnInit, AfterViewInit {

    private commandDispatcherService: CommandDispatcherService;
    private _driveIndex = 0;

    constructor(private element: ElementRef, commandDispatcherService: CommandDispatcherService) {
        this.commandDispatcherService = commandDispatcherService;
    }

    ngOnInit() {
        console.log("Init");
    }

    ngAfterViewInit() {
        const select = this.element.nativeElement.querySelector(".selectpicker");
        $(select).selectpicker({iconBase: 'fa'});
    }

    get driveIndex(): number {
        return this._driveIndex;
    }

    set driveIndex(value: number) {
        this._driveIndex = value;
    }

    start() {
        this.commandDispatcherService.start();
    }

    fast() {
        this.commandDispatcherService.fast();
    }

    frame() {
        this.commandDispatcherService.frame();
    }

    step() {
        this.commandDispatcherService.step();
    }

    pause() {
        this.commandDispatcherService.pause();
    }

    reset() {
        this.commandDispatcherService.reset();
    }

    openModule(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.openModule(files[0]);
        }
    }

    openDisk(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.openDisk(files, this._driveIndex);
        }
    }
}
