import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {SoftwareMenuComponent} from './software-menu.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import {ModuleService} from "../../services/module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {DiskService} from "../../services/disk.service";
import {ObjectLoaderService} from "../../services/object-loader.service";
import {SettingsService} from "../../services/settings.service";

describe('SoftwareMenuComponent', () => {
    let component: SoftwareMenuComponent;
    let fixture: ComponentFixture<SoftwareMenuComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [SoftwareMenuComponent],
            imports: [MatMenuModule, MatDialogModule],
            providers: [ModuleService, HttpClient, HttpHandler, CommandDispatcherService, DiskService, ObjectLoaderService, SettingsService]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SoftwareMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
