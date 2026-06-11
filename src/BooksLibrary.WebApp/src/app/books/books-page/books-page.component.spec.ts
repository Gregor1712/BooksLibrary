import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { BooksPageActions } from '../store/books.actions';
import { BookVm, selectBooksVm } from '../store/books.selectors';
import { BooksPageComponent } from './books-page.component';

describe('BooksPageComponent', () => {
  let fixture: ComponentFixture<BooksPageComponent>;
  let store: MockStore;

  const vm: BookVm[] = [{
    id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
    year: 2008, categoryId: 3, isAvailable: true, categoryName: 'Programming',
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BooksPageComponent],
      imports: [TableModule, NoopAnimationsModule],
      providers: [
        provideMockStore({ selectors: [{ selector: selectBooksVm, value: vm }] }),
        ConfirmationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(BooksPageComponent);
    fixture.detectChanges();
  });

  it('dispatches opened on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(BooksPageActions.opened());
  });

  it('renders book rows with the category name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Clean Code');
    expect(text).toContain('Programming');
  });
});
