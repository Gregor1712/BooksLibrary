import { createActionGroup, props } from '@ngrx/store';
import {Book} from "../../core/models/book";
//import { Document } from '../document.model';

export const DocumentsActions = createActionGroup({
  source: 'Documents',
  events: {
    'Add Document': props<{ documentId: number }>(),
    'Remove Document': props<{ documentId: number }>(),
  },
});

export const DocumentsApiActions = createActionGroup({
  source: 'Documents API',
  events: {
    'Retrieved Document List': props<{ documents: ReadonlyArray<Book> }>(),
  },
});
