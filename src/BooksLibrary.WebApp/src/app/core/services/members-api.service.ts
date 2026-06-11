import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member } from '../models/member';

@Injectable({ providedIn: 'root' })
export class MembersApiService {
  private readonly url = `${environment.apiUrl}/Members`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(this.url);
  }
}