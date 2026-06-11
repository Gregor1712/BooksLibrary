import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member } from '../models/member';

@Injectable({ providedIn: 'root' })
export class MembersApiService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(`${environment.apiUrl}/Members`);
  }
}