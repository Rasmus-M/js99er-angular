import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DebuggerComponent} from './debugger.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('DebuggerComponent', () => {
    let component: DebuggerComponent;
    let fixture: ComponentFixture<DebuggerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [DebuggerComponent],
            providers: [
                CommandDispatcherService
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DebuggerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
