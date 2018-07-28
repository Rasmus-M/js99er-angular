import {async, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from "@angular/router";
import {AudioService} from "./services/audio.service";
import {CommandDispatcherService} from "./services/command-dispatcher.service";
import {SettingsService} from "./services/settings.service";
import {DiskService} from "./services/disk.service";
import {ModuleService} from "./services/module.service";
import {HttpClient} from "@angular/common/http";

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [
                AppComponent
            ],
            providers: [
                {provide: Router},
                {provide: ActivatedRoute},
                {provide: AudioService},
                {provide: CommandDispatcherService},
                {provide: SettingsService},
                {provide: DiskService},
                {provide: ModuleService},
                {provide: HttpClient}
            ]
        }).compileComponents();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));
    it(`should have as title 'JS99'er'`, async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('JS99\'er');
    }));
    /*
    it('should render title in a h1 tag', async(() => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
    }));
    */
});
