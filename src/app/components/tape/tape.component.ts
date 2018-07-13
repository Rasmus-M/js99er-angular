import {Component, OnDestroy, OnInit} from '@angular/core';
import {TI994A} from '../../emulator/classes/ti994a';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {Tape} from '../../emulator/classes/tape';

@Component({
    selector: 'app-tape',
    templateUrl: './tape.component.html',
    styleUrls: ['./tape.component.css']
})
export class TapeComponent implements OnInit, OnDestroy {

    private subscription: Subscription;
    private tape: Tape;

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                const ti994A: TI994A = event.data;
                this.tape = ti994A.getTape();
                break;
        }
    }

    openTape(fileInput: HTMLInputElement) {
        const files = fileInput.files;
        if (files.length) {

        }
    }

    saveTape() {

    }

    record() {

    }

    play() {

    }

    rewind() {

    }

    stop() {

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
