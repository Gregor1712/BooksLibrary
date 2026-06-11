import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { booksAdapter, booksFeatureKey, BooksState } from './books.reducer';

export const selectBooksState = createFeatureSelector<BooksState>(booksFeatureKey);

const entitySelectors = booksAdapter.getSelectors();

export const selectAllBooks = createSelector(selectBooksState, s => entitySelectors.selectAll(s.books));
export const selectBooksLoaded = createSelector(selectBooksState, s => s.loaded);
export const selectCategories = createSelector(selectBooksState, s => s.categories);
export const selectDialogOpen = createSelector(selectBooksState, s => s.dialog.open);
export const selectEditedId = createSelector(selectBooksState, s => s.dialog.editedId);
export const selectBookForm = createSelector(selectBooksState, s => s.bookForm);
export const selectSaving = createSelector(selectBooksState, s => s.saving);

export interface BookVm extends Book {
  categoryName: string;
}

export const selectBooksVm = createSelector(
  selectAllBooks,
  selectCategories,
  (books, categories): BookVm[] =>
    books.map(b => ({
      ...b,
      categoryName: categories.find(c => c.id === b.categoryId)?.name ?? '',
    })),
);
