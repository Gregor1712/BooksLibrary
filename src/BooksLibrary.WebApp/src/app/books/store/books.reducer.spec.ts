import { Book } from '../../core/models/book';
import { BooksApiActions, BooksPageActions } from './books.actions';
import { booksReducer, initialBooksState } from './books.reducer';

describe('booksReducer', () => {
  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  it('stores books and sets loaded on loadSuccess', () => {
    const state = booksReducer(initialBooksState, BooksApiActions.loadSuccess({ books: [book] }));
    expect(state.loaded).toBeTrue();
    expect(state.books.ids).toEqual([1]);
    expect(state.books.entities[1]).toEqual(book);
  });

  it('stores categories on loadCategoriesSuccess', () => {
    const state = booksReducer(
      initialBooksState,
      BooksApiActions.loadCategoriesSuccess({ categories: [{ id: 3, name: 'Programming' }] }),
    );
    expect(state.categories).toEqual([{ id: 3, name: 'Programming' }]);
  });

  it('openCreateDialog opens the dialog with an empty, invalid form', () => {
    const state = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    expect(state.dialog).toEqual({ open: true, editedId: null });
    expect(state.bookForm.value.title).toBe('');
    expect(state.bookForm.controls.title.isInvalid).toBeTrue();
  });

  it('openEditDialog fills the form from the book', () => {
    const state = booksReducer(initialBooksState, BooksPageActions.openEditDialog({ book }));
    expect(state.dialog).toEqual({ open: true, editedId: 1 });
    expect(state.bookForm.value).toEqual({
      title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
      year: 2008, categoryId: 3,
    });
    expect(state.bookForm.isValid).toBeTrue();
  });

  it('closeDialog closes the dialog', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const state = booksReducer(opened, BooksPageActions.closeDialog());
    expect(state.dialog.open).toBeFalse();
  });

  it('save sets saving; saveSuccess clears saving and closes the dialog', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const savingState = booksReducer(opened, BooksPageActions.save());
    expect(savingState.saving).toBeTrue();

    const done = booksReducer(savingState, BooksApiActions.saveSuccess());
    expect(done.saving).toBeFalse();
    expect(done.dialog.open).toBeFalse();
  });

  it('saveFailure clears saving but keeps the dialog open', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const savingState = booksReducer(opened, BooksPageActions.save());
    const state = booksReducer(savingState, BooksApiActions.saveFailure());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeTrue();
  });
});
