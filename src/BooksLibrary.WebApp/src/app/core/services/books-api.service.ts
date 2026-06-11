import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book, SaveBookRequest } from '../models/book';

@Injectable({ providedIn: 'root' })
export class BooksApiService {
  private readonly url = `${environment.apiUrl}/Books`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.url);
  }

  create(book: SaveBookRequest): Observable<number> {
    return this.http.post<number>(this.url, book);
  }

  update(id: number, book: SaveBookRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, book);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}