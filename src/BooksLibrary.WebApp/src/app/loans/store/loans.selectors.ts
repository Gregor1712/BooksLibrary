import { createFeatureSelector, createSelector } from '@ngrx/store';
import { loansAdapter, loansFeatureKey, LoansState } from './loans.reducer';

export const selectLoansState = createFeatureSelector<LoansState>(loansFeatureKey);

const entitySelectors = loansAdapter.getSelectors();

export const selectAllLoans = createSelector(selectLoansState, s => entitySelectors.selectAll(s.loans));
export const selectLoansLoaded = createSelector(selectLoansState, s => s.loaded);
export const selectShowReturned = createSelector(selectLoansState, s => s.showReturned);
export const selectMembers = createSelector(selectLoansState, s => s.members);
export const selectLookupBooks = createSelector(selectLoansState, s => s.books);
export const selectLoansDialogOpen = createSelector(selectLoansState, s => s.dialog.open);
export const selectLoanForm = createSelector(selectLoansState, s => s.loanForm);
export const selectLoansSaving = createSelector(selectLoansState, s => s.saving);

export interface LoanVm {
  id: number;
  bookTitle: string;
  memberName: string;
  loanDate: string;
  dueDate: string;
  status: 'Active' | 'Overdue' | 'Returned';
  isReturned: boolean;
}

export const selectLoansVm = createSelector(
  selectAllLoans,
  selectMembers,
  selectShowReturned,
  (loans, members, showReturned): LoanVm[] =>
    loans
      .filter(l => showReturned || !l.isReturned)
      .map(l => {
        const member = members.find(m => m.id === l.memberId);
        return {
          id: l.id,
          bookTitle: l.book?.title ?? `#${l.bookId}`,
          memberName: member ? `${member.firstName} ${member.lastName}` : `#${l.memberId}`,
          loanDate: l.loanDate,
          dueDate: l.dueDate,
          status: l.isReturned ? 'Returned' : l.isOverdue ? 'Overdue' : 'Active',
          isReturned: l.isReturned,
        };
      }),
);

export const selectAvailableBookOptions = createSelector(
  selectLookupBooks,
  books => books.filter(b => b.isAvailable),
);
