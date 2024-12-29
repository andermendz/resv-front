import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { SpaceService } from '../../services/space.service';
import { ValidationService, ValidationError } from '../../services/validation.service';
import { Reservation } from '../../models/reservation';
import { Space } from '../../models/space';

interface TimeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Reservas</h2>
      <p class="subtitle">Reserva y administra tus espacios</p>
    </div>
    
    <div class="content-layout">
      <aside class="sidebar">
        <div class="card">
          <h3>Crear Nueva Reserva</h3>
          <form class="reservation-form" (ngSubmit)="createReservation()">
            <div class="form-group">
              <label for="space">Seleccionar Espacio</label>
              <select 
                id="space"
                [(ngModel)]="newReservation.spaceId"
                name="spaceId"
                [class.error]="hasError('spaceId')"
                (change)="validateForm()">
                <option value="">Elige un espacio</option>
                <option *ngFor="let space of spaces" [value]="space.id">
                  {{space.name}}
                </option>
              </select>
              <div class="error-message" *ngIf="getError('spaceId')">
                {{ getError('spaceId') }}
              </div>
            </div>

            <div class="form-group">
              <label for="cedula">Cédula del Reservante</label>
              <input 
                id="cedula"
                type="text" 
                [(ngModel)]="newReservation.cedula" 
                name="cedula"
                placeholder="Ingresa cédula del reservante"
                [class.error]="hasError('cedula')"
                (input)="validateForm()">
              <div class="error-message" *ngIf="getError('cedula')">
                {{ getError('cedula') }}
              </div>
            </div>

            <div class="form-group">
              <label for="date">Fecha</label>
              <input 
                id="date"
                type="date" 
                [(ngModel)]="selectedDate"
                name="date"
                [min]="minDate"
                [max]="maxDate"
                [class.error]="hasError('startTime') || hasError('endTime')"
                (change)="updateReservationTimes(); validateForm()">
            </div>

            <div class="time-inputs">
              <div class="form-group">
                <label for="startTime">Hora de Inicio</label>
                <select 
                  id="startTime"
                  [(ngModel)]="selectedStartTime"
                  name="startTime"
                  [class.error]="hasError('startTime')"
                  (change)="updateEndTimeOptions(); validateForm()">
                  <option value="">Seleccionar hora</option>
                  <option 
                    *ngFor="let time of startTimeOptions" 
                    [value]="time.value">
                    {{time.label}}
                  </option>
                </select>
                <div class="error-message" *ngIf="getError('startTime')">
                  {{ getError('startTime') }}
                </div>
              </div>

              <div class="form-group">
                <label for="endTime">Hora de Finalización</label>
                <select 
                  id="endTime"
                  [(ngModel)]="selectedEndTime"
                  name="endTime"
                  [class.error]="hasError('endTime')"
                  (change)="validateForm()">
                  <option value="">Seleccionar hora</option>
                  <option 
                    *ngFor="let time of endTimeOptions" 
                    [value]="time.value">
                    {{time.label}}
                  </option>
                </select>
                <div class="error-message" *ngIf="getError('endTime')">
                  {{ getError('endTime') }}
                </div>
              </div>
            </div>

            <div class="helper-text">
              <i class="fas fa-info-circle"></i>
              Horario de atención: 8:00 AM - 10:00 PM
            </div>

            <div class="error-message" *ngIf="getError('time')">
              {{ getError('time') }}
            </div>
            <div class="error-message" *ngIf="getError('duration')">
              {{ getError('duration') }}
            </div>

            <button 
              type="submit"
              [disabled]="!isFormValid">
              <i class="fas fa-calendar-plus"></i>
              Crear Reserva
            </button>
          </form>
        </div>
      </aside>

      <main class="main-content">
        <div class="reservations-header">
          <h3>Reservas Actuales</h3>
          <div class="view-options">
            <button class="view-button active">
              <i class="fas fa-list"></i>
              Lista
            </button>
            <button class="view-button" disabled title="Vista de calendario próximamente">
              <i class="fas fa-calendar-week"></i>
              Calendario
            </button>
          </div>
        </div>

        <div class="grid">
          <div *ngFor="let reservation of reservations" class="card reservation-card">
            <div class="reservation-header">
              <div class="space-info">
                <i class="fas fa-building"></i>
                <h4>{{reservation.spaceName}}</h4>
              </div>
              <button class="icon-button danger" (click)="deleteReservation(reservation.id)" title="Cancelar Reserva">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="reservation-details">
              <div class="detail-item">
                <i class="fas fa-id-card"></i>
                <span>{{reservation.cedula}}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>{{reservation.startTime | date:'MMM d, y, h:mm a'}} - {{reservation.endTime | date:'h:mm a'}}</span>
              </div>
            </div>
          </div>

          <div *ngIf="reservations.length === 0" class="empty-state card">
            <i class="fas fa-calendar empty-icon"></i>
            <h4>No Hay Reservas</h4>
            <p>Crea tu primera reserva usando el formulario de la izquierda</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 2rem;
    }

    .subtitle {
      color: var(--gray-600);
      margin-top: -1rem;
    }

    .content-layout {
      display: grid;
      gap: 2rem;
      grid-template-columns: 500px 1fr;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .reservation-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--gray-700);
      }
    }

    .reservations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h3 {
        margin: 0;
      }
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
    }

    .view-button {
      background-color: var(--gray-100);
      color: var(--gray-600);
      padding: 0.5rem 1rem;

      &.active {
        background-color: var(--primary);
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      i {
        margin-right: 0.5rem;
      }
    }

    .reservation-card {
      height: 100%;
    }

    .reservation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .space-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--gray-700);

      i {
        font-size: 1.25rem;
        color: var(--primary);
      }

      h4 {
        margin: 0;
      }
    }

    .reservation-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--gray-600);

      i {
        width: 1rem;
        color: var(--gray-400);
      }
    }

    .icon-button {
      padding: 0.5rem;
      border-radius: 0.375rem;
      
      i {
        font-size: 1rem;
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--gray-600);

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: var(--gray-400);
      }

      h4 {
        margin-bottom: 0.5rem;
      }
    }

    .time-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%234B5563' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2.5rem;
    }

    .helper-text {
      font-size: 0.875rem;
      color: var(--gray-600);
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: var(--primary);
      }
    }
  `]
})
export class ReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  spaces: Space[] = [];
  validationErrors: ValidationError[] = [];
  isFormValid = false;
  minDate: string;
  maxDate: string;
  startTimeOptions: TimeOption[] = [];
  endTimeOptions: TimeOption[] = [];

  selectedDate: string = '';
  selectedStartTime: string = '';
  selectedEndTime: string = '';

  newReservation = {
    spaceId: '',
    cedula: '',
    startTime: '',
    endTime: ''
  };

  constructor(
    private reservationService: ReservationService,
    private spaceService: SpaceService,
    private validationService: ValidationService
  ) {
    // Set min date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // Set max date to 6 months from now
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    this.maxDate = sixMonthsFromNow.toISOString().split('T')[0];

    // Generate time options
    this.generateTimeOptions();
  }

  ngOnInit() {
    this.loadReservations();
    this.loadSpaces();
  }

  loadReservations() {
    this.reservationService.getReservations().subscribe(reservations => {
      this.reservations = reservations;
    });
  }

  loadSpaces() {
    this.spaceService.getSpaces().subscribe(spaces => {
      this.spaces = spaces;
    });
  }

  generateTimeOptions() {
    const startHour = 8; // 8 AM
    const endHour = 22; // 10 PM
    const interval = 15; // 15 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = this.formatTimeLabel(hour, minute);
        this.startTimeOptions.push({ value: time, label });
      }
    }
  }

  formatTimeLabel(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  updateEndTimeOptions() {
    if (!this.selectedStartTime) {
      this.endTimeOptions = [];
      return;
    }

    const [hours, minutes] = this.selectedStartTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endHour = 22; // 10 PM
    const interval = 15; // 15 minutes
    const minDuration = 30; // 30 minutes minimum

    this.endTimeOptions = [];
    let currentMinutes = startMinutes + minDuration;
    const endMinutes = endHour * 60;

    while (currentMinutes <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = this.formatTimeLabel(hour, minute);
      this.endTimeOptions.push({ value: time, label });
      currentMinutes += interval;
    }
  }

  updateReservationTimes() {
    if (this.selectedDate && this.selectedStartTime && this.selectedEndTime) {
      // Parse the selected times
      const [startHours, startMinutes] = this.selectedStartTime.split(':').map(Number);
      const [endHours, endMinutes] = this.selectedEndTime.split(':').map(Number);
      
      // Create UTC dates using the selected date
      const [year, month, day] = this.selectedDate.split('-').map(Number);
      
      // Create the dates directly in UTC
      this.newReservation.startTime = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes, 0)).toISOString();
      this.newReservation.endTime = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes, 0)).toISOString();
    }
  }

  validateForm() {
    this.updateReservationTimes();
    const reservationData = {
      spaceId: this.newReservation.spaceId ? parseInt(this.newReservation.spaceId) : undefined,
      cedula: this.newReservation.cedula,
      startTime: this.newReservation.startTime ? new Date(this.newReservation.startTime) : undefined,
      endTime: this.newReservation.endTime ? new Date(this.newReservation.endTime) : undefined
    };

    this.validationErrors = this.validationService.validateReservation(reservationData, this.reservations);
    this.isFormValid = this.validationErrors.length === 0;
  }

  hasError(field: string): boolean {
    return this.validationErrors.some(error => error.field === field);
  }

  getError(field: string): string | null {
    const error = this.validationErrors.find(error => error.field === field);
    return error ? error.message : null;
  }

  createReservation() {
    this.validateForm();
    if (this.isFormValid) {
      this.reservationService.createReservation({
        spaceId: parseInt(this.newReservation.spaceId),
        cedula: this.newReservation.cedula,
        startTime: new Date(this.newReservation.startTime),
        endTime: new Date(this.newReservation.endTime)
      }).subscribe(() => {
        this.loadReservations();
        this.newReservation = {
          spaceId: '',
          cedula: '',
          startTime: '',
          endTime: ''
        };
        this.selectedDate = '';
        this.selectedStartTime = '';
        this.selectedEndTime = '';
        this.validationErrors = [];
      });
    }
  }

  deleteReservation(id: number) {
    this.reservationService.deleteReservation(id).subscribe(() => {
      this.loadReservations();
    });
  }
}
