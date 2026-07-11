import { createSelector, createFeatureSelector } from '@ngrx/store';
import {Book} from "../../core/models/book";
//import { Document } from '../document.model';

export const selectDocuments = createFeatureSelector<ReadonlyArray<Book>>('documents');
export const selectCollectionState = createFeatureSelector<ReadonlyArray<number>>('collection');

export const selectDocumentCollection = createSelector(
  selectDocuments,
  selectCollectionState,
  (documents, collection) => {
    return collection.map((id) => documents.find((document) => document.id === id)!);
  }
);
