import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {SoftwareMenuComponent} from './software-menu.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import {ModuleService} from "../../services/module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ZipService} from "../../services/zip.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('SoftwareMenuComponent', () => {
    let component: SoftwareMenuComponent;
    let fixture: ComponentFixture<SoftwareMenuComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [SoftwareMenuComponent],
            imports: [MatMenuModule, MatDialogModule],
            providers: [ModuleService, HttpClient, HttpHandler, ZipService, CommandDispatcherService]
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
