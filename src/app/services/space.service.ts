import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Space } from '../models/space';

@Injectable({
  providedIn: 'root'
})
export class SpaceService {
  private apiUrl = 'http://localhost:5167/api/spaces'; // backend port

  constructor(private http: HttpClient) { }

  getSpaces(): Observable<Space[]> {
    return this.http.get<Space[]>(this.apiUrl);
  }

  getSpace(id: number): Observable<Space> {
    return this.http.get<Space>(`${this.apiUrl}/${id}`);
  }

  createSpace(space: { name: string; description: string }): Observable<Space> {
    return this.http.post<Space>(this.apiUrl, space);
  }

  updateSpace(id: number, space: { name: string; description: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, space);
  }

  deleteSpace(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
