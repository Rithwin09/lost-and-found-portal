import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationDashboard } from './verification-dashboard';

describe('VerificationDashboard', () => {
  let component: VerificationDashboard;
  let fixture: ComponentFixture<VerificationDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificationDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
