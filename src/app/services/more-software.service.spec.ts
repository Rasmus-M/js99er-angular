import { TestBed, inject } from '@angular/core/testing';

import { MoreSoftwareService } from './more-software.service';

describe('MoreSoftwareService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoreSoftwareService]
    });
  });

  it('should be created', inject([MoreSoftwareService], (service: MoreSoftwareService) => {
    expect(service).toBeTruthy();
  }));
});
