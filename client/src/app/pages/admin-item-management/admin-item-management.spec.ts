import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemManagement } from './admin-item-management';

describe('AdminItemManagement', () => {
  let component: AdminItemManagement;
  let fixture: ComponentFixture<AdminItemManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminItemManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
