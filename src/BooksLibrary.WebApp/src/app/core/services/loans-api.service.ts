import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateLoanRequest, LoanDetail } from '../models/loan';

@Injectable({ providedIn: 'root' })
export class LoansApiService {
  private readonly url = `${environment.apiUrl}/Loans`;

  constructor(private http: HttpClient) {}

  getDetailAll(): Observable<LoanDetail[]> {
    return this.http.get<LoanDetail[]>(`${environment.apiUrl}/LoansDetail`);
  }

  create(request: CreateLoanRequest): Observable<number> {
    return this.http.post<number>(this.url, request);
  }

  returnBook(id: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/return`, null);
  }
}