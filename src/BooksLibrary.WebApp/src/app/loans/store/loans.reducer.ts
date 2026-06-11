import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FormGroupState, onNgrxForms, updateGroup, validate, wrapReducerWithFormStateUpdate,
} from 'ngrx-forms';
import { required } from 'ngrx-forms/validation';
import { Book } from '../../core/models/book';
import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';
import { createLoanFormState, emptyLoanFormValue, LoanFormValue } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';

export const loansFeatureKey = 'loans';

export const loansAdapter = createEntityAdapter<LoanDetail>();

export interface LoansState {
  loans: EntityState<LoanDetail>;
  loaded: boolean;
  saving: boolean;
  showReturned: boolean;
  dialog: { open: boolean };
  loanForm: FormGroupState<LoanFormValue>;
  members: Member[];
  books: Book[];
}

export const initialLoansState: LoansState = {
  loans: loansAdapter.getInitialState(),
  loaded: false,
  saving: false,
  showReturned: false,
  dialog: { open: false },
  loanForm: createLoanFormState(emptyLoanFormValue),
  members: [],
  books: [],
};

const rawReducer = createReducer(
  initialLoansState,
  onNgrxForms(),
  on(LoansApiActions.loadSuccess, (state, { loans }) => ({
    ...state,
    loans: loansAdapter.setAll(loans, state.loans),
    loaded: true,
  })),
  on(LoansApiActions.loadMembersSuccess, (state, { members }) => ({ ...state, members })),
  on(LoansApiActions.loadBooksSuccess, (state, { books }) => ({ ...state, books })),
  on(LoansPageActions.toggleShowReturned, (state, { showReturned }) => ({ ...state, showReturned })),
  on(LoansPageActions.openDialog, state => ({
    ...state,
    dialog: { open: true },
    loanForm: createLoanFormState(emptyLoanFormValue),
  })),
  on(LoansPageActions.closeDialog, state => ({ ...state, dialog: { open: false } })),
  on(LoansPageActions.save, state => ({ ...state, saving: true })),
  on(LoansApiActions.saveSuccess, state => ({
    ...state,
    saving: false,
    dialog: { open: false },
  })),
  on(LoansApiActions.saveFailure, state => ({ ...state, saving: false })),
);

export const validateLoanForm = updateGroup<LoanFormValue>({
  bookId: validate(required),
  memberId: validate(required),
});

export const loansReducer = wrapReducerWithFormStateUpdate(
  rawReducer,
  state => state.loanForm,
  validateLoanForm,
);
