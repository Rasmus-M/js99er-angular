import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ControlEvent, ControlEventType} from '../classes/controlEvent';
import {TI994A} from '../emulator/classes/ti994a';

@Injectable({
    providedIn: 'root'
})
export class EventDispatcherService {

    private eventSubject: Subject<ControlEvent> = new Subject<ControlEvent>();

    private eventObservable: Observable<ControlEvent> = this.eventSubject.asObservable();

    constructor() {
    }

    subscribe(handler: (event: ControlEvent) => void): Subscription {
        return this.eventObservable.subscribe(handler);
    }

    ready(ti994A: TI994A) {
        this.eventSubject.next(new ControlEvent(ControlEventType.READY, ti994A));
    }

    started() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STARTED, {}));
    }

    stopped() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STOPPED, {}));
    }

    screenshot(dataURL: string) {
        this.eventSubject.next(new ControlEvent(ControlEventType.SCREENSHOT, dataURL));
    }
}
