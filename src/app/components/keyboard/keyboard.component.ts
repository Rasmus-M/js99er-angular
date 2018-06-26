import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import * as imageMapResize from 'image-map-resizer';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';

@Component({
    selector: 'app-keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent implements OnInit, AfterViewInit {

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
    }

    ngAfterViewInit() {
        const map = this.element.nativeElement.querySelector('map');
        imageMapResize(map);
    }

    virtualKeyPress(keyCode: number) {
        this.commandDispatcherService.pressKey(keyCode);
    }
}

