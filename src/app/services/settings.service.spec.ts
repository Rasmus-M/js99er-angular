import {inject, TestBed} from '@angular/core/testing';

import {SettingsService} from './settings.service';
import {CommandDispatcherService} from "./command-dispatcher.service";

describe('SettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsService, CommandDispatcherService]
    });
  });

  it('should be created', inject([SettingsService], (service: SettingsService) => {
    expect(service).toBeTruthy();
  }));
});
