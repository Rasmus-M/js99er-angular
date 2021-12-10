import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {GraphicsComponent} from './graphics.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";

describe('GraphicsComponent', () => {
    let component: GraphicsComponent;
    let fixture: ComponentFixture<GraphicsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [GraphicsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GraphicsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
