import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { of, Observable, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
//import { Document } from './document.model';
import {BooksApiService} from "../core/services/books-api.service";
import {Book} from "../core/models/book";

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {

  constructor(
    private http: HttpClient,
    private booksApi: BooksApiService
  ) {}


  getBooks(): Observable<Book[]> {
    return this.booksApi.getAll().pipe(
      map(books => books.slice(0, 10))
    );
  }

  // getBooks(): Observable<Array<Document>> {
  //   return this.http
  //     .get<{ items: Document[] }>(
  //       'https://www.googleapis.com/books/v1/volumes?maxResults=5&orderBy=relevance&q=oliver%20sacks'
  //     )
  //     .pipe(
  //       retry({ count: 2, delay: (_error, retryCount) => timer(retryCount * 2000) }),
  //       map((documents) => documents.items || []),
  //       catchError(() => {
  //         console.warn('Google Books API unavailable (rate limited), using mock data');
  //         return of(MOCK_DOCUMENTS);
  //       })
  //     );
  // }


}
