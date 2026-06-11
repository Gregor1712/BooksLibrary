import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoansPageActions } from '../store/loans.actions';
import {
  selectAvailableBookOptions, selectLoanForm, selectLoansDialogOpen, selectLoansSaving, selectMembers,
} from '../store/loans.selectors';

@Component({
  selector: 'app-loan-dialog',
  templateUrl: './loan-dialog.component.html',
})
export class LoanDialogComponent {
  open$ = this.store.select(selectLoansDialogOpen);
  form$ = this.store.select(selectLoanForm);
  saving$ = this.store.select(selectLoansSaving);
  bookOptions$ = this.store.select(selectAvailableBookOptions);
  memberOptions$ = this.store.select(selectMembers);

  constructor(private store: Store) {}

  onSave(): void {
    this.store.dispatch(LoansPageActions.save());
  }

  onClose(): void {
    this.store.dispatch(LoansPageActions.closeDialog());
  }
}
