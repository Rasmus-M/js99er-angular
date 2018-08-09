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
    private paletteCanvas: HTMLCanvasElement;
    private tileCanvasTop: HTMLCanvasElement;
    private tileCanvasMiddle: HTMLCanvasElement;
    private tileCanvasBottom: HTMLCanvasElement;
    private spriteCanvas: HTMLCanvasElement;

    tileCanvasTopVisible = true;
    tileCanvasMiddleVisible = false;
    tileCanvasBottomVisible = false;
    spriteCanvasVisible = true;

    constructor(
        private element: ElementRef,
        private eventDispatcherService: EventDispatcherService,
    ) {}

    ngOnInit() {
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    startUpdate() {
        if (!this.timerHandle) {
            this.timerHandle = window.setInterval(this.updateView.bind(this), 200);
        }
    }

    stopUpdate() {
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    ngAfterViewInit() {
        this.paletteCanvas = this.element.nativeElement.querySelector('#palette-canvas');
        this.tileCanvasTop = this.element.nativeElement.querySelector('#tile-canvas-top');
        this.tileCanvasMiddle = this.element.nativeElement.querySelector('#tile-canvas-middle');
        this.tileCanvasBottom = this.element.nativeElement.querySelector('#tile-canvas-bottom');
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

    setTileCanvasTopVisible(visible: boolean) {
        this.tileCanvasTopVisible = visible;
        this.updateView();
    }

    setTileCanvasMiddleVisible(visible: boolean) {
        this.tileCanvasMiddleVisible = visible;
        this.updateView();
    }

    setTileCanvasBottomVisible(visible: boolean) {
        this.tileCanvasBottomVisible = visible;
        this.updateView();
    }

    setSpriteCanvasVisible(visible: boolean) {
        this.spriteCanvasVisible = visible;
        this.updateView();
    }

    updateView() {
        if (this.visible) {
            const vdp = this.ti994A.getVDP();
            vdp.drawPaletteImage(this.paletteCanvas);
            if (this.tileCanvasTopVisible) {
                vdp.drawTilePatternImage(this.tileCanvasTop, 0, true);
            }
            if (this.tileCanvasMiddleVisible) {
                vdp.drawTilePatternImage(this.tileCanvasMiddle, 1, true);
            }
            if (this.tileCanvasBottomVisible) {
                vdp.drawTilePatternImage(this.tileCanvasBottom, 2, true);
            }
            if (this.spriteCanvasVisible) {
                vdp.drawSpritePatternImage(this.spriteCanvas, true);
            }
        }
    }
}
