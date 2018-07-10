import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreMenuComponent } from './more-menu.component';

describe('MoreMenuComponent', () => {
  let component: MoreMenuComponent;
  let fixture: ComponentFixture<MoreMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
