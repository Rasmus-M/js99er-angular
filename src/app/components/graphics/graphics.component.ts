import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from "rxjs";
import {TI994A} from "../../emulator/classes/ti994a";
import {ConsoleEvent, ConsoleEventType} from "../../classes/consoleevent";
import {EventDispatcherService} from "../../services/event-dispatcher.service";

@Component({
    selector: 'app-graphics',
    templateUrl: './graphics.component.html',
    styleUrls: ['./graphics.component.css']
})
export class GraphicsComponent implements OnInit, AfterViewInit, OnChanges {

    @Input() visible: boolean;

    private ti994A: TI994A;
    private timerHandle: number;
    private eventSubscription: Subscription;
    private tileCanvas: HTMLCanvasElement;
    private spriteCanvas: HTMLCanvasElement;

    constructor(
        private element: ElementRef,
        private eventDispatcherService: EventDispatcherService,
    ) {}

    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    startUpdate() {
        if (!this.timerHandle) {
            this.timerHandle = window.setInterval(this.updateView.bind(this), 500);
        }
    }

    stopUpdate() {
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    ngAfterViewInit() {
        this.tileCanvas = this.element.nativeElement.querySelector('#tile-canvas');
        this.spriteCanvas = this.element.nativeElement.querySelector('#sprite-canvas');

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.visible.currentValue) {
            this.updateView();
        }
    }

    private onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                break;
            case ConsoleEventType.STARTED:
                this.startUpdate();
                break;
            case ConsoleEventType.STOPPED:
                this.stopUpdate();
                this.updateView();
                break;
        }
    }

    updateView() {
        if (this.visible) {
            this.ti994A.getVDP().drawTilePatternImage(this.tileCanvas);
            this.ti994A.getVDP().drawSpritePatternImage(this.spriteCanvas);
        }
    }
}
