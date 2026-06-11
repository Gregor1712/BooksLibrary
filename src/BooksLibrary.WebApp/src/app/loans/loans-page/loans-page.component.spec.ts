import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { LoansPageActions } from '../store/loans.actions';
import { LoanVm, selectLoansVm, selectShowReturned } from '../store/loans.selectors';
import { LoansPageComponent } from './loans-page.component';

describe('LoansPageComponent', () => {
  let fixture: ComponentFixture<LoansPageComponent>;
  let store: MockStore;

  const vm: LoanVm[] = [{
    id: 7, bookTitle: 'Clean Code', memberName: 'Jana Novakova',
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    status: 'Active', isReturned: false,
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoansPageComponent],
      imports: [TableModule, FormsModule, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectLoansVm, value: vm },
            { selector: selectShowReturned, value: false },
          ],
        }),
        ConfirmationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(LoansPageComponent);
    fixture.detectChanges();
  });

  it('dispatches opened on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(LoansPageActions.opened());
  });

  it('renders loan rows with book title and member name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Clean Code');
    expect(text).toContain('Jana Novakova');
  });

  it('dispatches toggleShowReturned when the toggle changes', () => {
    fixture.componentInstance.onToggleReturned(true);
    expect(store.dispatch).toHaveBeenCalledWith(LoansPageActions.toggleShowReturned({ showReturned: true }));
  });
});
