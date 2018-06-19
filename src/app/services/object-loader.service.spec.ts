import { TestBed, inject } from '@angular/core/testing';

import { ObjectLoaderService } from './object-loader.service';

describe('ObjectLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObjectLoaderService]
    });
  });

  it('should be created', inject([ObjectLoaderService], (service: ObjectLoaderService) => {
    expect(service).toBeTruthy();
  }));
});
