import { createActionGroup, props } from '@ngrx/store';
import { Document } from '../document.model';

export const DocumentsActions = createActionGroup({
  source: 'Documents',
  events: {
    'Add Document': props<{ documentId: string }>(),
    'Remove Document': props<{ documentId: string }>(),
  },
});

export const DocumentsApiActions = createActionGroup({
  source: 'Documents API',
  events: {
    'Retrieved Document List': props<{ documents: ReadonlyArray<Document> }>(),
  },
});
