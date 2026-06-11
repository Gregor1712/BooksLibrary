import { LoanDetail } from '../../core/models/loan';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { initialLoansState, loansReducer } from './loans.reducer';

describe('loansReducer', () => {
  const loan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false,
    book: { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: false },
  };

  it('stores loans and sets loaded on loadSuccess', () => {
    const state = loansReducer(initialLoansState, LoansApiActions.loadSuccess({ loans: [loan] }));
    expect(state.loaded).toBeTrue();
    expect(state.loans.ids).toEqual([7]);
  });

  it('toggleShowReturned updates the flag', () => {
    const state = loansReducer(initialLoansState, LoansPageActions.toggleShowReturned({ showReturned: true }));
    expect(state.showReturned).toBeTrue();
  });

  it('openDialog opens with an empty, invalid form', () => {
    const state = loansReducer(initialLoansState, LoansPageActions.openDialog());
    expect(state.dialog.open).toBeTrue();
    expect(state.loanForm.value).toEqual({ bookId: null, memberId: null });
    expect(state.loanForm.isInvalid).toBeTrue();
  });

  it('saveSuccess closes the dialog and clears saving', () => {
    const opened = loansReducer(initialLoansState, LoansPageActions.openDialog());
    const saving = loansReducer(opened, LoansPageActions.save());
    expect(saving.saving).toBeTrue();

    const state = loansReducer(saving, LoansApiActions.saveSuccess());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeFalse();
  });

  it('saveFailure keeps the dialog open', () => {
    const opened = loansReducer(initialLoansState, LoansPageActions.openDialog());
    const saving = loansReducer(opened, LoansPageActions.save());
    const state = loansReducer(saving, LoansApiActions.saveFailure());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeTrue();
  });

  it('stores lookup books and members', () => {
    const withBooks = loansReducer(initialLoansState, LoansApiActions.loadBooksSuccess({
      books: [{ id: 1, title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1, isAvailable: true }],
    }));
    expect(withBooks.books.length).toBe(1);

    const withMembers = loansReducer(initialLoansState, LoansApiActions.loadMembersSuccess({
      members: [{ id: 2, firstName: 'Jana', lastName: 'Novakova', email: 'jana@example.com' }],
    }));
    expect(withMembers.members.length).toBe(1);
  });
});
