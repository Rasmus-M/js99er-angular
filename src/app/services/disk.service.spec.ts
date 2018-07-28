import {inject, TestBed} from '@angular/core/testing';

import {DiskService} from './disk.service';
import {ZipService} from "./zip.service";
import {CommandDispatcherService} from "./command-dispatcher.service";
import {ObjectLoaderService} from "./object-loader.service";

describe('DiskService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiskService, ZipService, CommandDispatcherService, ObjectLoaderService]
    });
  });

  it('should be created', inject([DiskService], (service: DiskService) => {
    expect(service).toBeTruthy();
  }));
});
