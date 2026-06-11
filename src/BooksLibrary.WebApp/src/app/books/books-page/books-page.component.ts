import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { Book } from '../../core/models/book';
import { BooksPageActions } from '../store/books.actions';
import { selectBooksVm } from '../store/books.selectors';

@Component({
  selector: 'app-books-page',
  templateUrl: './books-page.component.html',
})
export class BooksPageComponent implements OnInit {
  vm$ = this.store.select(selectBooksVm);

  constructor(
    private store: Store,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(BooksPageActions.opened());
  }

  onNew(): void {
    this.store.dispatch(BooksPageActions.openCreateDialog());
  }

  onEdit(book: Book): void {
    this.store.dispatch(BooksPageActions.openEditDialog({ book }));
  }

  onDelete(book: Book): void {
    this.confirmationService.confirm({
      message: `Delete "${book.title}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(BooksPageActions.delete({ id: book.id })),
    });
  }
}
