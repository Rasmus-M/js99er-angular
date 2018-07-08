import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import * as $ from 'jquery';
import 'bootstrap';
import 'bootstrap-select';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';

// declare var jQuery: JQuery;

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements OnInit, AfterViewInit, OnDestroy {

    running = false;
    driveIndex = 0;
    menu = SoftwareMenuService.MENU;
    private subscription: Subscription;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {}

    ngOnInit(): void {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    ngAfterViewInit() {
        const select = this.element.nativeElement.querySelector(".selectpicker");
        $(select).selectpicker({iconBase: 'fa'});
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

    stop() {
        this.commandDispatcherService.stop();
    }

    reset() {
        this.commandDispatcherService.reset();
    }

    openModule(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.loadModule(files[0]);
        }
    }

    openDisk(files: FileList) {
        if (files.length) {
            this.commandDispatcherService.loadDisk(files, this.driveIndex);
        }
    }

    screenshot() {
        this.commandDispatcherService.screenshot();
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.STARTED:
                this.running = true;
                break;
            case ConsoleEventType.STOPPED:
                this.running = false;
                break;
            case ConsoleEventType.SCREENSHOT_TAKEN:
                this.element.nativeElement.querySelector("#btnScreenshot").href = event.data;
                break;
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
