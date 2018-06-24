import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ControlEvent, ControlEventType} from '../classes/controlEvent';

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

    started() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STARTED, {}));
    }

    stopped() {
        this.eventSubject.next(new ControlEvent(ControlEventType.STOPPED, {}));
    }
}
