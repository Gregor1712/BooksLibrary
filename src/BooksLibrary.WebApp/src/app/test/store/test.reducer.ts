import { createReducer, on } from "@ngrx/store";
import { increment, decrement, reset } from "./test.action";

export const initialState = 0;

export const testReducer = createReducer(
  initialState,
  on(increment, (state) => state + 1),
  on(decrement, (state) => state - 1),
  on(reset,     () => 0)
);
