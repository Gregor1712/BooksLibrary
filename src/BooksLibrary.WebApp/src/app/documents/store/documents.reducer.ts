import { createReducer, on } from '@ngrx/store';

import { DocumentsApiActions } from './documents.actions';
import {Book} from "../../core/models/book";
//import { Document } from '../document.model';

export const initialState: ReadonlyArray<Book> = [];

export const documentsReducer = createReducer(
  initialState,
  on(DocumentsApiActions.retrievedDocumentList, (_state, { documents }) => documents)
);
