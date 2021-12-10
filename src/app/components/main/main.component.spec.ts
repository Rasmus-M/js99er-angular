import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {MainComponent} from './main.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AudioService} from "../../services/audio.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {SettingsService} from "../../services/settings.service";
import {DiskService} from "../../services/disk.service";
import {ModuleService} from "../../services/module.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {MoreSoftwareService} from "../../services/more-software.service";

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [MainComponent],
            providers: [
                {provide: ActivatedRoute, useValue: {
                    paramMap: {
                        subscribe: () => {}
                    },
                }},
                {provide: AudioService},
                {provide: CommandDispatcherService},
                {provide: SettingsService},
                {provide: DiskService},
                {provide: ModuleService, useValue: {}},
                {provide: HttpClient},
                {provide: DiskService, useValue: {
                    createDefaultDiskImages: () => {}
                }},
                {provide: MoreSoftwareService, useValue: {}}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it(`should have as title 'JS99'er'`, () => {
        expect(component.title).toEqual('JS99\'er');
    });

});
