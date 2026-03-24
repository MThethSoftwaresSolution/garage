import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyExchangesPage } from './my-exchanges.page';

describe('MyExchangesPage', () => {
  let component: MyExchangesPage;
  let fixture: ComponentFixture<MyExchangesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyExchangesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
