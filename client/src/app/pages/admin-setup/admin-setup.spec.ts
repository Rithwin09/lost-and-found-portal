import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSetup } from './admin-setup';

describe('AdminSetup', () => {
  let component: AdminSetup;
  let fixture: ComponentFixture<AdminSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
