import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {LogComponent} from './log.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";

describe('LogComponent', () => {
    let component: LogComponent;
    let fixture: ComponentFixture<LogComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [LogComponent],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
