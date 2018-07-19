import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {MoreSoftwareComponent} from './more-software.component';

describe('MoreSoftwareComponent', () => {
  let component: MoreSoftwareComponent;
  let fixture: ComponentFixture<MoreSoftwareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreSoftwareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
