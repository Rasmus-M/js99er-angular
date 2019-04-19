import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {MainComponent} from './main.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AudioService} from "../../services/audio.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {SettingsService} from "../../services/settings.service";
import {DiskService} from "../../services/disk.service";
import {ModuleService} from "../../services/module.service";
import {HttpClient} from "@angular/common/http";

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [MainComponent],
            providers: [
                {provide: ActivatedRoute},
                {provide: AudioService},
                {provide: CommandDispatcherService},
                {provide: SettingsService},
                {provide: DiskService},
                {provide: ModuleService},
                {provide: HttpClient}
            ]

        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it(`should have as title 'JS99'er'`, () => {
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('JS99\'er');
    });

});
