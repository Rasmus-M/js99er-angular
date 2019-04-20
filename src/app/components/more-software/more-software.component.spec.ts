import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {MoreSoftwareComponent} from './more-software.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {MAT_DIALOG_DATA, MatAutocompleteModule, MatDialogModule, MatDialogRef} from "@angular/material";

describe('MoreSoftwareComponent', () => {
    let component: MoreSoftwareComponent;
    let fixture: ComponentFixture<MoreSoftwareComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [MoreSoftwareComponent],
            imports: [MatAutocompleteModule],
            providers: [
                {provide: MAT_DIALOG_DATA, useValue: []},
                {provide: MatDialogRef, useValue: {}}]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MoreSoftwareComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
