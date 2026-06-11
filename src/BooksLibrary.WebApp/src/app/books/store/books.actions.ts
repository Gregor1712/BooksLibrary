import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { Category } from '../../core/models/category';

export const BooksPageActions = createActionGroup({
  source: 'Books Page',
  events: {
    'Opened': emptyProps(),
    'Open Create Dialog': emptyProps(),
    'Open Edit Dialog': props<{ book: Book }>(),
    'Close Dialog': emptyProps(),
    'Save': emptyProps(),
    'Delete': props<{ id: number }>(),
  },
});

export const BooksApiActions = createActionGroup({
  source: 'Books API',
  events: {
    'Load Success': props<{ books: Book[] }>(),
    'Load Failure': emptyProps(),
    'Load Categories Success': props<{ categories: Category[] }>(),
    'Save Success': emptyProps(),
    'Save Failure': emptyProps(),
    'Delete Success': emptyProps(),
    'Delete Failure': emptyProps(),
  },
});
