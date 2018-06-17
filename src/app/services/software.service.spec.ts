import { TestBed, inject } from '@angular/core/testing';

import { SoftwareService } from './software.service';

describe('SoftwareService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SoftwareService]
    });
  });

  it('should be created', inject([SoftwareService], (service: SoftwareService) => {
    expect(service).toBeTruthy();
  }));
});
