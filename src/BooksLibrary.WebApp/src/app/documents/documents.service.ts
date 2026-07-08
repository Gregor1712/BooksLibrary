import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { of, Observable, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
//import { Document } from './document.model';
import {BooksApiService} from "../core/services/books-api.service";
import {Book} from "../core/models/book";

// const MOCK_DOCUMENTS: Array<Document> = [
//   { id: 'mock-1', volumeInfo: { title: 'The Man Who Mistook His Wife for a Hat', authors: ['Oliver Sacks'] } },
//   { id: 'mock-2', volumeInfo: { title: 'Musicophilia', authors: ['Oliver Sacks'] } },
//   { id: 'mock-3', volumeInfo: { title: 'Awakenings', authors: ['Oliver Sacks'] } },
//   { id: 'mock-4', volumeInfo: { title: 'An Anthropologist on Mars', authors: ['Oliver Sacks'] } },
//   { id: 'mock-5', volumeInfo: { title: 'On the Move: A Life', authors: ['Oliver Sacks'] } },
// ];

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {

  constructor(
    private http: HttpClient,
    private booksApi: BooksApiService
  ) {}


  getBooks(): Observable<Book[]> {

    const response = this.booksApi.getAll();

    return response;
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
