import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MarkAsSubmittedAction } from 'ngrx-forms';
import { MessageService } from 'primeng/api';
import { EMPTY, Observable, catchError, exhaustMap, filter, from, map, of, switchMap, tap } from 'rxjs';
import { SaveBookRequest } from '../../core/models/book';
import { BooksApiService } from '../../core/services/books-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { BOOK_FORM_ID, BookFormValue } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';
import { FormGroupState } from 'ngrx-forms';
import {
  selectBookForm, selectBooksLoaded, selectCategories, selectEditedId,
} from './books.selectors';
import { LoansApiActions } from '../../loans/store/loans.actions';

@Injectable()
export class BooksEffects {
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.opened),
      concatLatestFrom(() => this.store.select(selectBooksLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => BooksApiActions.loadSuccess({ books })),
          catchError(() => of(BooksApiActions.loadFailure())),
        ),
      ),
    ),
  );

  // Cross-feature cache invalidation: loan mutations (create/return) change book availability,
  // so the cached books list must be refetched. Same role as MediatR notifications in the
  // Kros reference architecture.
  refresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksApiActions.saveSuccess, BooksApiActions.deleteSuccess, LoansApiActions.saveSuccess, LoansApiActions.returnSuccess),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => BooksApiActions.loadSuccess({ books })),
          catchError(() => of(BooksApiActions.loadFailure())),
        ),
      ),
    ),
  );

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.opened),
      concatLatestFrom(() => this.store.select(selectCategories)),
      filter(([, categories]) => categories.length === 0),
      switchMap(() =>
        this.categoriesApi.getAll().pipe(
          map(categories => BooksApiActions.loadCategoriesSuccess({ categories })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  save$ = createEffect((): Observable<Action> =>
    this.actions$.pipe(
      ofType(BooksPageActions.save),
      concatLatestFrom(() => [
        this.store.select(selectBookForm),
        this.store.select(selectEditedId),
      ]),
      exhaustMap(([, form, editedId]: [unknown, FormGroupState<BookFormValue>, number | null]) => {
        if (form.isInvalid) {
          const actions: Action[] = [
            new MarkAsSubmittedAction(BOOK_FORM_ID) as Action,
            BooksApiActions.saveFailure(),
          ];
          return from(actions);
        }
        const payload: SaveBookRequest = {
          title: form.value.title,
          author: form.value.author,
          isbn: form.value.isbn,
          year: form.value.year,
          categoryId: form.value.categoryId!,
        };
        const request$: Observable<number | void> = editedId === null
          ? this.booksApi.create(payload)
          : this.booksApi.update(editedId, payload);
        return request$.pipe(
          map((_result): Action => BooksApiActions.saveSuccess()),
          catchError(() => of(BooksApiActions.saveFailure())),
        );
      }),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.delete),
      exhaustMap(({ id }) =>
        this.booksApi.delete(id).pipe(
          map(() => BooksApiActions.deleteSuccess()),
          catchError(() => of(BooksApiActions.deleteFailure())),
        ),
      ),
    ),
  );

  saveSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BooksApiActions.saveSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Book saved.' })),
      ),
    { dispatch: false },
  );

  deleteSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BooksApiActions.deleteSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Book deleted.' })),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private booksApi: BooksApiService,
    private categoriesApi: CategoriesApiService,
    private messageService: MessageService,
  ) {}
}
