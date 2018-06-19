import { TestBed, inject } from '@angular/core/testing';

import { ZipService } from './zip.service';

describe('ZipService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ZipService]
    });
  });

  it('should be created', inject([ZipService], (service: ZipService) => {
    expect(service).toBeTruthy();
  }));
});
