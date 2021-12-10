import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {DiskComponent} from './disk.component';
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import { MatTableModule } from "@angular/material/table";

describe('DiskComponent', () => {
    let component: DiskComponent;
    let fixture: ComponentFixture<DiskComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [DiskComponent],
            imports: [MatTableModule],
            providers: [CommandDispatcherService]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DiskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
