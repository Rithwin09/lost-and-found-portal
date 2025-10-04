import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemDetail } from './admin-item-detail';

describe('AdminItemDetail', () => {
  let component: AdminItemDetail;
  let fixture: ComponentFixture<AdminItemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminItemDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
