import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {OptionsComponent} from './options.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {SettingsService} from "../../services/settings.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('SettingsComponent', () => {
    let component: OptionsComponent;
    let fixture: ComponentFixture<OptionsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [OptionsComponent],
            providers: [SettingsService, CommandDispatcherService]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
