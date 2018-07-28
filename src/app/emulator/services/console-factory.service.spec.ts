import { TestBed, inject } from '@angular/core/testing';

import { ConsoleFactoryService } from './console-factory.service';

describe('ConsoleFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConsoleFactoryService]
    });
  });

  it('should be created', inject([ConsoleFactoryService], (service: ConsoleFactoryService) => {
    expect(service).toBeTruthy();
  }));
});
