import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { LoansPageActions } from '../store/loans.actions';
import { LoanVm, selectLoansVm, selectShowReturned } from '../store/loans.selectors';

@Component({
  selector: 'app-loans-page',
  templateUrl: './loans-page.component.html',
})
export class LoansPageComponent implements OnInit {
  vm$ = this.store.select(selectLoansVm);
  showReturned$ = this.store.select(selectShowReturned);

  constructor(
    private store: Store,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(LoansPageActions.opened());
  }

  onNew(): void {
    this.store.dispatch(LoansPageActions.openDialog());
  }

  onToggleReturned(showReturned: boolean): void {
    this.store.dispatch(LoansPageActions.toggleShowReturned({ showReturned }));
  }

  onReturn(loan: LoanVm): void {
    this.confirmationService.confirm({
      message: `Return "${loan.bookTitle}"?`,
      header: 'Confirm return',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(LoansPageActions.returnBook({ id: loan.id })),
    });
  }
}
