import { Book } from '../../core/models/book';
import { booksAdapter, initialBooksState } from './books.reducer';
import { selectBooksVm } from './books.selectors';

describe('books selectors', () => {
  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  it('selectBooksVm joins the category name', () => {
    const state = {
      ...initialBooksState,
      books: booksAdapter.setAll([book], initialBooksState.books),
      categories: [{ id: 3, name: 'Programming' }],
    };

    const vm = selectBooksVm.projector(
      booksAdapter.getSelectors().selectAll(state.books),
      state.categories,
    );

    expect(vm).toEqual([{ ...book, categoryName: 'Programming' }]);
  });

  it('selectBooksVm falls back to empty name for unknown category', () => {
    const vm = selectBooksVm.projector([book], []);
    expect(vm[0].categoryName).toBe('');
  });
});
