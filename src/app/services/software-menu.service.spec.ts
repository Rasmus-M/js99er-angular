import {inject, TestBed} from '@angular/core/testing';

import {SoftwareMenuService} from './software-menu.service';

describe('SoftwareMenuService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SoftwareMenuService]
    });
  });

  it('should be created', inject([SoftwareMenuService], (service: SoftwareMenuService) => {
    expect(service).toBeTruthy();
  }));
});
