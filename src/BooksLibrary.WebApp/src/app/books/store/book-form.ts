import { createFormGroupState, FormGroupState } from 'ngrx-forms';

export interface BookFormValue {
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number | null;
}

export const BOOK_FORM_ID = 'books.bookForm';

export const emptyBookFormValue: BookFormValue = {
  title: '',
  author: '',
  isbn: '',
  year: new Date().getFullYear(),
  categoryId: null,
};

export function createBookFormState(value: BookFormValue): FormGroupState<BookFormValue> {
  return createFormGroupState(BOOK_FORM_ID, value);
}
