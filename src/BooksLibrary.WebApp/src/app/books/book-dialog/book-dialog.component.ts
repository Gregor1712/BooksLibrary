import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooksPageActions } from '../store/books.actions';
import {
  selectBookForm, selectCategories, selectDialogOpen, selectEditedId, selectSaving,
} from '../store/books.selectors';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
})
export class BookDialogComponent {
  open$ = this.store.select(selectDialogOpen);
  form$ = this.store.select(selectBookForm);
  saving$ = this.store.select(selectSaving);
  editedId$ = this.store.select(selectEditedId);
  categories$ = this.store.select(selectCategories);

  constructor(private store: Store) {}

  onSave(): void {
    this.store.dispatch(BooksPageActions.save());
  }

  onClose(): void {
    this.store.dispatch(BooksPageActions.closeDialog());
  }
}
