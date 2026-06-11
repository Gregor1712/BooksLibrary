import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MessageService } from 'primeng/api';
import { Observable, of, throwError } from 'rxjs';
import { LoanDetail } from '../../core/models/loan';
import { BooksApiService } from '../../core/services/books-api.service';
import { LoansApiService } from '../../core/services/loans-api.service';
import { MembersApiService } from '../../core/services/members-api.service';
import { createLoanFormState } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { validateLoanForm } from './loans.reducer';
import { LoansEffects } from './loans.effects';
import { selectLoanForm, selectLoansLoaded, selectMembers } from './loans.selectors';

describe('LoansEffects', () => {
  let actions$: Observable<Action>;
  let effects: LoansEffects;
  let loansApi: jasmine.SpyObj<LoansApiService>;

  const loan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false, book: null,
  };

  const validForm = validateLoanForm(createLoanFormState({ bookId: 1, memberId: 2 }));

  beforeEach(() => {
    loansApi = jasmine.createSpyObj('LoansApiService', ['getDetailAll', 'create', 'returnBook']);
    const booksApi = jasmine.createSpyObj('BooksApiService', ['getAll']);
    booksApi.getAll.and.returnValue(of([]));
    const membersApi = jasmine.createSpyObj('MembersApiService', ['getAll']);
    membersApi.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        LoansEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectLoansLoaded, value: false },
            { selector: selectMembers, value: [] },
            { selector: selectLoanForm, value: validForm },
          ],
        }),
        { provide: LoansApiService, useValue: loansApi },
        { provide: BooksApiService, useValue: booksApi },
        { provide: MembersApiService, useValue: membersApi },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    });

    effects = TestBed.inject(LoansEffects);
  });

  it('load$ fetches loan details when not loaded', (done) => {
    loansApi.getDetailAll.and.returnValue(of([loan]));
    actions$ = of(LoansPageActions.opened());

    effects.load$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.loadSuccess({ loans: [loan] }));
      done();
    });
  });

  it('save$ creates a loan from the form value', (done) => {
    loansApi.create.and.returnValue(of(7));
    actions$ = of(LoansPageActions.save());

    effects.save$.subscribe(action => {
      expect(loansApi.create).toHaveBeenCalledWith({ bookId: 1, memberId: 2 });
      expect(action).toEqual(LoansApiActions.saveSuccess());
      done();
    });
  });

  it('save$ maps API errors to saveFailure', (done) => {
    loansApi.create.and.returnValue(throwError(() => new Error('409')));
    actions$ = of(LoansPageActions.save());

    effects.save$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.saveFailure());
      done();
    });
  });

  it('return$ calls the return endpoint', (done) => {
    loansApi.returnBook.and.returnValue(of(void 0));
    actions$ = of(LoansPageActions.returnBook({ id: 7 }));

    effects.return$.subscribe(action => {
      expect(loansApi.returnBook).toHaveBeenCalledWith(7);
      expect(action).toEqual(LoansApiActions.returnSuccess());
      done();
    });
  });

  it('refresh$ refetches after returnSuccess', (done) => {
    loansApi.getDetailAll.and.returnValue(of([loan]));
    actions$ = of(LoansApiActions.returnSuccess());

    effects.refresh$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.loadSuccess({ loans: [loan] }));
      done();
    });
  });
});
