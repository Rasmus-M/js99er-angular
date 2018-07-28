import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DebuggerComponent} from './debugger.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AudioService} from "../../services/audio.service";
import {SettingsService} from "../../services/settings.service";
import {ModuleService} from "../../services/module.service";
import {HttpClient} from "@angular/common/http";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {DiskService} from "../../services/disk.service";

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
