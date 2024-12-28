import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation } from '../models/reservation';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'https://resv-back-production.up.railway.app/api/reservations';

  constructor(private http: HttpClient) { }

  getReservations(spaceId?: number, cedula?: string, startDate?: Date, endDate?: Date): Observable<Reservation[]> {
    let params = new HttpParams();
    if (spaceId) params = params.set('spaceId', spaceId.toString());
    if (cedula) params = params.set('cedula', cedula);
    
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      params = params.set('startDate', startOfDay.toISOString());
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      params = params.set('endDate', endOfDay.toISOString());
    }

    return this.http.get<Reservation[]>(this.apiUrl, { params });
  }

  createReservation(reservation: { spaceId: number; cedula: string; startTime: Date; endTime: Date }): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
