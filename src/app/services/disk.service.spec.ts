import { TestBed, inject } from '@angular/core/testing';

import { DiskService } from './disk.service';

describe('DiskService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiskService]
    });
  });

  it('should be created', inject([DiskService], (service: DiskService) => {
    expect(service).toBeTruthy();
  }));
});
