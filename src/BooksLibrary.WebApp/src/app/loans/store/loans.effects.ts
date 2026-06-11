import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MarkAsSubmittedAction } from 'ngrx-forms';
import { MessageService } from 'primeng/api';
import { EMPTY, catchError, exhaustMap, filter, from, map, of, switchMap, tap } from 'rxjs';
import { BooksApiService } from '../../core/services/books-api.service';
import { LoansApiService } from '../../core/services/loans-api.service';
import { MembersApiService } from '../../core/services/members-api.service';
import { LOAN_FORM_ID } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { selectLoanForm, selectLoansLoaded, selectMembers } from './loans.selectors';

@Injectable()
export class LoansEffects {
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.opened),
      concatLatestFrom(() => this.store.select(selectLoansLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.loansApi.getDetailAll().pipe(
          map(loans => LoansApiActions.loadSuccess({ loans })),
          catchError(() => of(LoansApiActions.loadFailure())),
        ),
      ),
    ),
  );

  refresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansApiActions.saveSuccess, LoansApiActions.returnSuccess),
      switchMap(() =>
        this.loansApi.getDetailAll().pipe(
          map(loans => LoansApiActions.loadSuccess({ loans })),
          catchError(() => of(LoansApiActions.loadFailure())),
        ),
      ),
    ),
  );

  loadMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.opened),
      concatLatestFrom(() => this.store.select(selectMembers)),
      filter(([, members]) => members.length === 0),
      switchMap(() =>
        this.membersApi.getAll().pipe(
          map(members => LoansApiActions.loadMembersSuccess({ members })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  loadBooks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.openDialog),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => LoansApiActions.loadBooksSuccess({ books })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.save),
      concatLatestFrom(() => this.store.select(selectLoanForm)),
      exhaustMap(([, form]) => {
        if (form.isInvalid) {
          const actions: Action[] = [
            new MarkAsSubmittedAction(LOAN_FORM_ID) as Action,
            LoansApiActions.saveFailure(),
          ];
          return from(actions);
        }
        return this.loansApi.create({ bookId: form.value.bookId!, memberId: form.value.memberId! }).pipe(
          map(() => LoansApiActions.saveSuccess()),
          catchError(() => of(LoansApiActions.saveFailure())),
        );
      }),
    ),
  );

  return$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.returnBook),
      exhaustMap(({ id }) =>
        this.loansApi.returnBook(id).pipe(
          map(() => LoansApiActions.returnSuccess()),
          catchError(() => of(LoansApiActions.returnFailure())),
        ),
      ),
    ),
  );

  saveSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoansApiActions.saveSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Loan created.' })),
      ),
    { dispatch: false },
  );

  returnSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoansApiActions.returnSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Returned', detail: 'Book returned.' })),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private loansApi: LoansApiService,
    private booksApi: BooksApiService,
    private membersApi: MembersApiService,
    private messageService: MessageService,
  ) {}
}
