import { createFeatureSelector } from "@ngrx/store";

export const selectTest = createFeatureSelector<number>('test');
