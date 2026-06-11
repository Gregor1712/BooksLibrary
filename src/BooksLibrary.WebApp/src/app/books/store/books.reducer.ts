import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FormGroupState, onNgrxForms, updateGroup, validate, wrapReducerWithFormStateUpdate,
} from 'ngrx-forms';
import { greaterThan, lessThanOrEqualTo, maxLength, required } from 'ngrx-forms/validation';
import { Book } from '../../core/models/book';
import { Category } from '../../core/models/category';
import { BookFormValue, createBookFormState, emptyBookFormValue } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';

export const booksFeatureKey = 'books';

export const booksAdapter = createEntityAdapter<Book>();

export interface BooksState {
  books: EntityState<Book>;
  loaded: boolean;
  saving: boolean;
  dialog: { open: boolean; editedId: number | null };
  bookForm: FormGroupState<BookFormValue>;
  categories: Category[];
}

export const initialBooksState: BooksState = {
  books: booksAdapter.getInitialState(),
  loaded: false,
  saving: false,
  dialog: { open: false, editedId: null },
  bookForm: createBookFormState(emptyBookFormValue),
  categories: [],
};

const rawReducer = createReducer(
  initialBooksState,
  onNgrxForms(),
  on(BooksApiActions.loadSuccess, (state, { books }) => ({
    ...state,
    books: booksAdapter.setAll(books, state.books),
    loaded: true,
  })),
  on(BooksApiActions.loadCategoriesSuccess, (state, { categories }) => ({ ...state, categories })),
  on(BooksPageActions.openCreateDialog, state => ({
    ...state,
    dialog: { open: true, editedId: null },
    bookForm: createBookFormState(emptyBookFormValue),
  })),
  on(BooksPageActions.openEditDialog, (state, { book }) => ({
    ...state,
    dialog: { open: true, editedId: book.id },
    bookForm: createBookFormState({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      year: book.year,
      categoryId: book.categoryId,
    }),
  })),
  on(BooksPageActions.closeDialog, state => ({
    ...state,
    dialog: { open: false, editedId: null },
  })),
  on(BooksPageActions.save, state => ({ ...state, saving: true })),
  on(BooksApiActions.saveSuccess, state => ({
    ...state,
    saving: false,
    dialog: { open: false, editedId: null },
  })),
  on(BooksApiActions.saveFailure, state => ({ ...state, saving: false })),
);

export const validateBookForm = updateGroup<BookFormValue>({
  title: validate(required, maxLength(200)),
  author: validate(required, maxLength(100)),
  isbn: validate(required, maxLength(13)),
  year: validate(required, greaterThan(0), lessThanOrEqualTo(new Date().getFullYear())),
  categoryId: validate(required),
});

export const booksReducer = wrapReducerWithFormStateUpdate(
  rawReducer,
  state => state.bookForm,
  validateBookForm,
);
