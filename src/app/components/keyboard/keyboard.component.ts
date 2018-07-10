import {Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import * as imageMapResize from 'image-map-resizer';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';

@Component({
    selector: 'app-keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent implements OnChanges {

    @Input() visible: boolean;

    private initialized = false;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.visible.currentValue) {
            const map = this.element.nativeElement.querySelector('map');
            imageMapResize(map);
        }
    }

    virtualKeyPress(keyCode: number) {
        this.commandDispatcherService.pressKey(keyCode);
    }
}

