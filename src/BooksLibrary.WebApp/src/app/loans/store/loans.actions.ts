import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';

export const LoansPageActions = createActionGroup({
  source: 'Loans Page',
  events: {
    'Opened': emptyProps(),
    'Toggle Show Returned': props<{ showReturned: boolean }>(),
    'Open Dialog': emptyProps(),
    'Close Dialog': emptyProps(),
    'Save': emptyProps(),
    'Return Book': props<{ id: number }>(),
  },
});

export const LoansApiActions = createActionGroup({
  source: 'Loans API',
  events: {
    'Load Success': props<{ loans: LoanDetail[] }>(),
    'Load Failure': emptyProps(),
    'Load Members Success': props<{ members: Member[] }>(),
    'Load Books Success': props<{ books: Book[] }>(),
    'Save Success': emptyProps(),
    'Save Failure': emptyProps(),
    'Return Success': emptyProps(),
    'Return Failure': emptyProps(),
  },
});
