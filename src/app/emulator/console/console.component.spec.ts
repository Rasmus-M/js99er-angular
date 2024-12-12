import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {ConsoleComponent} from './console.component';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {ModuleService} from "../../services/module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {DiskService} from "../../services/disk.service";
import {ObjectLoaderService} from "../../services/object-loader.service";
import {SettingsService} from "../../services/settings.service";
import {ConsoleFactoryService} from "../services/console-factory.service";
import {DiskImage} from "../classes/disk-image";
import {Settings} from "../../classes/settings";
import {Console} from "../interfaces/console";
import {CPU} from "../interfaces/cpu";
import {CRU} from "../classes/cru";
import {DiskDrive} from "../classes/disk-drive";
import {Keyboard} from "../classes/keyboard";
import {Memory} from "../classes/memory";
import {PSG} from "../interfaces/psg";
import {Speech} from "../interfaces/speech";
import {Tape} from "../classes/tape";
import {Software} from "../../classes/software";
import {VDP} from "../interfaces/vdp";
import {AudioService} from "../../services/audio.service";
import {TIPI} from "../classes/tipi";
import {TMS9919} from "../classes/tms9919";
import {TMS9900} from "../classes/tms9900";
import {TMS5200} from "../classes/tms5200";
import {TMS9918A} from "../classes/tms9918a";
import {WasmService} from "../../services/wasm.service";
import {TiFDC} from "../classes/ti-fdc";
import {GoogleDrive} from "../classes/google-drive";
import {GenericFdc} from "../classes/generic-fdc";
import {GoogleDriveFDC} from "../classes/google-drive-fdc";
import {FDC} from "../interfaces/fdc";
import {Observable} from "rxjs";
import {PeripheralCard} from "../interfaces/peripheral-card";
import {RAMDisk} from "../interfaces/ram-disk";
import {Horizon} from "../classes/horizon";
import {DatabaseService} from "../../services/database.service";

class ConsoleMock implements Console {

    private settings = new Settings();

    frame(skipBreakpoint?: boolean) {
    }

    getCPU(): CPU {
        return new TMS9900(this);
    }

    getCRU(): CRU {
        return new CRU(this);
    }

    getDiskDrives(): DiskDrive[] {
        return [];
    }

    getKeyboard(): Keyboard {
        return new Keyboard({} as Document, this, this.settings);
    }

    getMemory(): Memory {
        return new Memory(this, this.settings);
    }

    getPSG(): PSG {
        return new TMS9919(this.getCPU(), this.getTape());
    }

    getSpeech(): Speech {
        return new TMS5200(true);
    }

    getTape(): Tape {
        return new Tape();
    }

    getVDP(): VDP {
        return new TMS9918A({
            getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null {
                return {} as CanvasRenderingContext2D;
            }
        } as HTMLCanvasElement, this, {} as WasmService);
    }

    isRunning() {
    }

    loadSoftware(software?: Software) {
    }

    reset(keepCart: boolean) {
    }

    setGoogleDrive() {
    }

    setVDP() {
    }

    setPSG() {
    }

    start(fast: boolean, skipBreakpoint?: boolean) {
    }

    step() {
    }

    stepOver() {
    }

    stop() {
    }

    getTIPI(): TIPI | null {
        return null;
    }

    setTIPI() {
    }

    getFDC(): FDC {
        return new GenericFdc(this, []);
    }

    setFDC(): void {
    }

    getGoogleDrivesFdc(): GoogleDriveFDC {
        return new GoogleDriveFDC(this, []);
    }

    cyclesPassed(): Observable<number> {
        return new Observable();
    }

    getCardById(id: string): PeripheralCard | null {
        return null;
    }

    getRAMDisk(): RAMDisk | null {
        return new Horizon(this);
    }

    setRAMDisk(): void {
    }

    getDatabaseService(): DatabaseService {
        return new DatabaseService();
    }

    destroy() {
    }
}

class ConsoleFactoryMock {
    create(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], settings: Settings, onBreakpoint: (cpu: CPU) => void): Console {
        return new ConsoleMock();
    }
}

describe('ConsoleComponent', () => {
    let component: ConsoleComponent;
    let fixture: ComponentFixture<ConsoleComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ConsoleComponent],
            providers: [
                CommandDispatcherService,
                ModuleService,
                HttpClient,
                HttpHandler,
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
