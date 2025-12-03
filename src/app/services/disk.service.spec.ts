import {inject, TestBed} from '@angular/core/testing';

import {DiskService} from './disk.service';
import {CommandDispatcherService} from "./command-dispatcher.service";
import {ObjectLoaderService} from "./object-loader.service";
import {SettingsService} from "./settings.service";

describe('DiskService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiskService, CommandDispatcherService, ObjectLoaderService, SettingsService]
    });
  });

  it('should be created', inject([DiskService], (service: DiskService) => {
    expect(service).toBeTruthy();
  }));
});
