import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SoftwareMenuComponent} from './software-menu.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {MatDialog, MatDialogModule, MatMenuModule} from "@angular/material";
import {SoftwareMenuService} from "../../services/software-menu.service";
import {ModuleService} from "../../services/module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ZipService} from "../../services/zip.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('SoftwareMenuComponent', () => {
    let component: SoftwareMenuComponent;
    let fixture: ComponentFixture<SoftwareMenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [SoftwareMenuComponent],
            imports: [MatMenuModule, MatDialogModule],
            providers: [SoftwareMenuService, ModuleService, HttpClient, HttpHandler, ZipService, CommandDispatcherService]
        })
            .compileComponents();
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
