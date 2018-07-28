import {inject, TestBed} from '@angular/core/testing';

import {ModuleService} from './module.service';
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ZipService} from "./zip.service";

describe('ModuleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModuleService, HttpClient, HttpHandler, ZipService]
    });
  });

  it('should be created', inject([ModuleService], (service: ModuleService) => {
    expect(service).toBeTruthy();
  }));
});
