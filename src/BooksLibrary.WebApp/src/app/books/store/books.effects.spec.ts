import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MessageService } from 'primeng/api';
import { Observable, of, throwError } from 'rxjs';
import { Book } from '../../core/models/book';
import { BooksApiService } from '../../core/services/books-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { createBookFormState } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';
import { validateBookForm } from './books.reducer';
import { BooksEffects } from './books.effects';
import {
  selectBookForm, selectBooksLoaded, selectCategories, selectEditedId,
} from './books.selectors';

describe('BooksEffects', () => {
  let actions$: Observable<Action>;
  let effects: BooksEffects;
  let booksApi: jasmine.SpyObj<BooksApiService>;
  let store: MockStore;

  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  const validForm = validateBookForm(createBookFormState({
    title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
    year: 2008, categoryId: 3,
  }));

  beforeEach(() => {
    booksApi = jasmine.createSpyObj('BooksApiService', ['getAll', 'create', 'update', 'delete']);
    const categoriesApi = jasmine.createSpyObj('CategoriesApiService', ['getAll']);
    categoriesApi.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        BooksEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectBooksLoaded, value: false },
            { selector: selectCategories, value: [] },
            { selector: selectBookForm, value: validForm },
            { selector: selectEditedId, value: null },
          ],
        }),
        { provide: BooksApiService, useValue: booksApi },
        { provide: CategoriesApiService, useValue: categoriesApi },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    });

    effects = TestBed.inject(BooksEffects);
    store = TestBed.inject(MockStore);
  });

  it('load$ fetches books when not loaded', (done) => {
    booksApi.getAll.and.returnValue(of([book]));
    actions$ = of(BooksPageActions.opened());

    effects.load$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.loadSuccess({ books: [book] }));
      done();
    });
  });

  it('load$ does nothing when already loaded', () => {
    store.overrideSelector(selectBooksLoaded, true);
    store.refreshState();
    actions$ = of(BooksPageActions.opened());

    let emitted = false;
    effects.load$.subscribe(() => (emitted = true));
    expect(emitted).toBeFalse();
  });

  it('save$ creates a new book when editedId is null', (done) => {
    booksApi.create.and.returnValue(of(10));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(booksApi.create).toHaveBeenCalledWith({
        title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
        year: 2008, categoryId: 3,
      });
      expect(action).toEqual(BooksApiActions.saveSuccess());
      done();
    });
  });

  it('save$ updates when editedId is set', (done) => {
    store.overrideSelector(selectEditedId, 1);
    store.refreshState();
    booksApi.update.and.returnValue(of(void 0));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(booksApi.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ title: 'Clean Code' }));
      expect(action).toEqual(BooksApiActions.saveSuccess());
      done();
    });
  });

  it('save$ maps API errors to saveFailure', (done) => {
    booksApi.create.and.returnValue(throwError(() => new Error('409')));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.saveFailure());
      done();
    });
  });

  it('delete$ maps success to deleteSuccess', (done) => {
    booksApi.delete.and.returnValue(of(void 0));
    actions$ = of(BooksPageActions.delete({ id: 1 }));

    effects.delete$.subscribe(action => {
      expect(booksApi.delete).toHaveBeenCalledWith(1);
      expect(action).toEqual(BooksApiActions.deleteSuccess());
      done();
    });
  });

  it('refresh$ refetches after saveSuccess', (done) => {
    booksApi.getAll.and.returnValue(of([book]));
    actions$ = of(BooksApiActions.saveSuccess());

    effects.refresh$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.loadSuccess({ books: [book] }));
      done();
    });
  });
});
