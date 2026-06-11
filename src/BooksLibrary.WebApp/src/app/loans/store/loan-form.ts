import { createFormGroupState, FormGroupState } from 'ngrx-forms';

export interface LoanFormValue {
  bookId: number | null;
  memberId: number | null;
}

export const LOAN_FORM_ID = 'loans.loanForm';

export const emptyLoanFormValue: LoanFormValue = {
  bookId: null,
  memberId: null,
};

export function createLoanFormState(value: LoanFormValue): FormGroupState<LoanFormValue> {
  return createFormGroupState(LOAN_FORM_ID, value);
}
