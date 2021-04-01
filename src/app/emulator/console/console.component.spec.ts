import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ConsoleComponent} from './console.component';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {ModuleService} from "../../services/module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ZipService} from "../../services/zip.service";
import {DiskService} from "../../services/disk.service";
import {ObjectLoaderService} from "../../services/object-loader.service";
import {SettingsService} from "../../services/settings.service";
import {ConsoleFactoryService} from "../services/console-factory.service";
import {DiskImage} from "../classes/diskimage";
import {Settings} from "../../classes/settings";
import {Console} from "../interfaces/console";
import {CPU} from "../interfaces/cpu";
import {CRU} from "../classes/cru";
import {DiskDrive} from "../classes/diskdrive";
import {GoogleDrive} from "../classes/googledrive";
import {Keyboard} from "../classes/keyboard";
import {Memory} from "../classes/memory";
import {PSG} from "../interfaces/psg";
import {Speech} from "../interfaces/speech";
import {Tape} from "../classes/tape";
import {Software} from "../../classes/software";
import {VDP} from "../interfaces/vdp";
import {AudioService} from "../../services/audio.service";
import {TIPI} from "../classes/tipi";

class ConsoleMock implements Console {
    frame(skipBreakpoint?: boolean) {
    }
    getCPU(): CPU {
        return undefined;
    }
    getCRU(): CRU {
        return undefined;
    }
    getDiskDrives(): DiskDrive[] {
        return undefined;
    }
    getGoogleDrives(): GoogleDrive[] {
        return undefined;
    }
    getKeyboard(): Keyboard {
        return undefined;
    }
    getMemory(): Memory {
        return undefined;
    }
    getPSG(): PSG {
        return undefined;
    }
    getSpeech(): Speech {
        return undefined;
    }
    getTape(): Tape {
        return undefined;
    }
    getVDP(): VDP {
        return undefined;
    }
    isRunning() {
    }
    loadSoftware(software: Software) {
    }
    reset(keepCart: boolean) {
    }
    setGoogleDrive() {
    }
    setVDP() {
    }
    start(fast: boolean, skipBreakpoint?: boolean) {
    }
    step() {
    }
    stepOver() {
    }
    stop() {
    }
    getTIPI(): TIPI {
        return undefined;
    }
    setTIPI() {
    }
}

class ConsoleFactoryMock {
    create(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], settings: Settings, onBreakpoint: (CPU) => void): Console {
     return new ConsoleMock();
  }
}

describe('ConsoleComponent', () => {
    let component: ConsoleComponent;
    let fixture: ComponentFixture<ConsoleComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConsoleComponent],
            providers: [
                CommandDispatcherService,
                ModuleService,
                HttpClient,
                HttpHandler,
                ZipService,
                DiskService,
                ObjectLoaderService,
                SettingsService,
                AudioService,
                {provide: ConsoleFactoryService, useClass: ConsoleFactoryMock }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConsoleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
