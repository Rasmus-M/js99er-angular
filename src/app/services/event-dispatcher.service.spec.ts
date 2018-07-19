import {inject, TestBed} from '@angular/core/testing';

import {EventDispatcherService} from './event-dispatcher.service';

describe('EventDispatcherService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EventDispatcherService]
        });
    });

    it('should be created', inject([EventDispatcherService], (service: EventDispatcherService) => {
        expect(service).toBeTruthy();
    }));
});
