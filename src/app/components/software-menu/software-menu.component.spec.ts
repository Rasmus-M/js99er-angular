import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareMenuComponent } from './software-menu.component';

describe('SoftwareMenuComponent', () => {
  let component: SoftwareMenuComponent;
  let fixture: ComponentFixture<SoftwareMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SoftwareMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SoftwareMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
