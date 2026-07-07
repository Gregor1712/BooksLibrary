import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Document } from './document.model';

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {
  constructor(private http: HttpClient) {}

  getBooks(): Observable<Array<Document>> {
    return this.http
      .get<{ items: Document[] }>(
        'https://www.googleapis.com/books/v1/volumes?maxResults=5&orderBy=relevance&q=oliver%20sacks'
      )
      .pipe(map((documents) => documents.items || []));
  }
}
