import {Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import imageMapResize from 'image-map-resizer';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';

@Component({
    selector: 'keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.css'],
    standalone: false
})
export class KeyboardComponent implements OnChanges {

    @Input() visible: boolean;

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue) {
            setTimeout(
                () => {
                    const map = this.element.nativeElement.querySelector('map') as HTMLMapElement;
                    if (map) {
                        imageMapResize(map);
                    }
                }, 200
            );
        }
    }

    virtualKeyPress(keyCode: number) {
        this.commandDispatcherService.pressKey(keyCode);
    }
}

