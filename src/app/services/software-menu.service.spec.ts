import {inject, TestBed} from '@angular/core/testing';

import {SoftwareMenuService} from './software-menu.service';
import {ModuleService} from "./module.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ZipService} from "./zip.service";

describe('SoftwareMenuService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SoftwareMenuService, ModuleService, HttpClient, HttpHandler, ModuleService, ZipService]
    });
  });

  it('should be created', inject([SoftwareMenuService], (service: SoftwareMenuService) => {
    expect(service).toBeTruthy();
  }));
});
