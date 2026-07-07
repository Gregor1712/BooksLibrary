import { createReducer, on } from '@ngrx/store';

import { DocumentsApiActions } from './documents.actions';
import { Document } from '../document.model';

export const initialState: ReadonlyArray<Document> = [];

export const documentsReducer = createReducer(
  initialState,
  on(DocumentsApiActions.retrievedDocumentList, (_state, { documents }) => documents)
);
