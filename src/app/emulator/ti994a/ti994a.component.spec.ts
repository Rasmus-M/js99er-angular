import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Ti994aComponent } from './ti994a.component';

describe('Ti994aComponent', () => {
  let component: Ti994aComponent;
  let fixture: ComponentFixture<Ti994aComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Ti994aComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ti994aComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
