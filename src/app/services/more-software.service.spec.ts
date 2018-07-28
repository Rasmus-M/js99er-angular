import {inject, TestBed} from '@angular/core/testing';

import {MoreSoftwareService} from './more-software.service';
import {HttpClient, HttpHandler} from "@angular/common/http";

describe('MoreSoftwareService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoreSoftwareService, HttpClient, HttpHandler]
    });
  });

  it('should be created', inject([MoreSoftwareService], (service: MoreSoftwareService) => {
    expect(service).toBeTruthy();
  }));
});
