import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {SoftwareMenuService} from '../../services/software-menu.service';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';

@Component({
    selector: 'app-main-controls',
    templateUrl: './main-controls.component.html',
    styleUrls: ['./main-controls.component.css'],
})
export class MainControlsComponent implements OnInit, OnDestroy {

    running = false;
    driveIndex = 0;
    menuData = SoftwareMenuService.MENU;

    private subscription: Subscription;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {}

    ngOnInit(): void {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
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

    openModule(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {
            this.commandDispatcherService.loadModule(files[0]);
            fileInput.value = "";
        }
    }

    openDisk(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {
            this.commandDispatcherService.loadDisk(this.driveIndex, files);
            fileInput.value = "";
        }
    }

    screenshot() {
        this.commandDispatcherService.screenshot();
    }

    saveState() {
        this.commandDispatcherService.saveState();
    }

    restoreState() {
        this.commandDispatcherService.restoreState();
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
            case ConsoleEventType.DISK_DRIVE_CHANGED:
                this.driveIndex = event.data;
                break;
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
