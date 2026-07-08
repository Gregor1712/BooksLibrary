import { createReducer, on } from '@ngrx/store';
import { DocumentsActions } from './documents.actions';

export const initialState: ReadonlyArray<number> = [];

export const collectionReducer = createReducer(
  initialState,
  on(DocumentsActions.removeDocument, (state, { documentId }) =>
    state.filter((id) => id !== documentId)
  ),
  on(DocumentsActions.addDocument, (state, { documentId }) => {
    if (state.indexOf(documentId) > -1) return state;
    return [...state, documentId];
  })
);
