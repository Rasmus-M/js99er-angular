import {async, TestBed} from '@angular/core/testing';
import {Js99erComponent} from './js99er.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [
                Js99erComponent
            ]
        }).compileComponents();
    }));
    it('should create the app', () => {
        const fixture = TestBed.createComponent(Js99erComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});
