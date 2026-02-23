import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SignatureDialogComponent } from './signature-dialog.component';

describe('SignatureDialogComponent', () => {
  let component: SignatureDialogComponent;
  let fixture: ComponentFixture<SignatureDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SignatureDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignatureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
