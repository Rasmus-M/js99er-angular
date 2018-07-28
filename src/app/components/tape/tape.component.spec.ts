import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TapeComponent} from './tape.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('TapeComponent', () => {
    let component: TapeComponent;
    let fixture: ComponentFixture<TapeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [TapeComponent],
            providers: [CommandDispatcherService]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TapeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
