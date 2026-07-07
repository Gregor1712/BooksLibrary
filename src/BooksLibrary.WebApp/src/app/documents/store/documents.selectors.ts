import { createSelector, createFeatureSelector } from '@ngrx/store';
import { Document } from '../document.model';

export const selectDocuments = createFeatureSelector<ReadonlyArray<Document>>('documents');
export const selectCollectionState = createFeatureSelector<ReadonlyArray<string>>('collection');

export const selectDocumentCollection = createSelector(
  selectDocuments,
  selectCollectionState,
  (documents, collection) => {
    return collection.map((id) => documents.find((document) => document.id === id)!);
  }
);
