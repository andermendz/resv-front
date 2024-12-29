import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceService } from '../../services/space.service';
import { ReservationService } from '../../services/reservation.service';
import { ValidationService, ValidationError } from '../../services/validation.service';
import { Space } from '../../models/space';
import { CalendarComponent } from '../calendar/calendar.component';

interface TimeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-space-details',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" (click)="goBack()">
          <i class="fas fa-arrow-left"></i>
          Volver
        </button>
        <div class="space-title">
          <h2>{{ space?.name }}</h2>
          <p class="subtitle">{{ space?.description }}</p>
        </div>
      </div>
    </div>

    <div class="content-layout">
      <div class="calendar-section">
        <div class="section-header">
          <h3>{{ isCreatingReservation ? 'Nueva Reserva' : 'Calendario de Reservas' }}</h3>
          <button class="primary-button" (click)="startNewReservation()" *ngIf="!isCreatingReservation">
            <i class="fas fa-plus"></i>
            Nueva Reserva
          </button>
        </div>
        
        <app-calendar [spaceId]="spaceId" *ngIf="!isCreatingReservation"></app-calendar>

        <div class="reservation-list" *ngIf="!isCreatingReservation">
          <div class="section-header">
            <h3>Lista de Reservas</h3>
            <div class="filter-controls">
              <div class="date-filter">
                <div class="input-group">
                  <i class="fas fa-calendar"></i>
                  <input 
                    type="date" 
                    [(ngModel)]="filterStartDate"
                    (change)="filterReservations()"
                    placeholder="Fecha inicio">
                </div>
                <span class="date-separator">-</span>
                <div class="input-group">
                  <i class="fas fa-calendar"></i>
                  <input 
                    type="date" 
                    [(ngModel)]="filterEndDate"
                    (change)="filterReservations()"
                    placeholder="Fecha fin">
                </div>
              </div>
              <div class="input-group search">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  [(ngModel)]="filterCedula"
                  (input)="filterReservations()"
                  placeholder="Buscar por cédula">
              </div>
            </div>
          </div>

          <div class="reservations-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Cédula</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let reservation of filteredReservations">
                  <td>{{ reservation.startTime | date:'dd/MM/yyyy' }}</td>
                  <td>{{ reservation.startTime | date:'HH:mm':'UTC' }} - {{ reservation.endTime | date:'HH:mm':'UTC' }}</td>
                  <td>{{ reservation.cedula }}</td>
                  <td>
                    <button 
                      class="delete-button"
                      (click)="confirmDeleteReservation(reservation)"
                      title="Cancelar Reserva">
                      <i class="fas fa-trash"></i>
                      <span>Cancelar</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredReservations.length === 0">
                  <td colspan="4" class="empty-message">
                    No hay reservas que coincidan con los filtros
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="reservation-form" *ngIf="isCreatingReservation">
          <div class="section-header">
            <button class="icon-button" (click)="cancelReservation()" title="Cancelar">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form (ngSubmit)="createReservation()">
            <div class="alert error" *ngIf="reservationError">
              <i class="fas fa-exclamation-circle"></i>
              {{ reservationError }}
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

            <div class="form-actions">
              <button 
                type="button" 
                class="secondary-button"
                (click)="cancelReservation()">
                Cancelar
              </button>
              <button 
                type="submit"
                class="primary-button"
                [disabled]="!isFormValid">
                <i class="fas fa-calendar-plus"></i>
                Crear Reserva
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--gray-100);
      color: var(--gray-600);
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--gray-200);
        color: var(--gray-800);
      }

      i {
        font-size: 1.25rem;
      }
    }

    .space-title {
      flex: 1;

      h2 {
        margin: 0;
        color: var(--gray-900);
      }

      .subtitle {
        margin: 0.5rem 0 0;
        color: var(--gray-600);
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h3 {
        margin: 0;
        color: var(--gray-800);
      }
    }

    .calendar-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .reservation-form {
      form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 800px;
        margin: 0 auto;
      }
    }

    .time-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .helper-text {
      font-size: 0.875rem;
      color: var(--gray-600);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: var(--primary);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .primary-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-dark);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      i {
        font-size: 1rem;
      }
    }

    .secondary-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--gray-100);
      color: var(--gray-600);
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        background: var(--gray-200);
      }
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

    .reservation-list {
      margin-top: 2rem;
      border-top: 1px solid var(--gray-200);
      padding-top: 2rem;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .date-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-separator {
      color: var(--gray-400);
      font-weight: 500;
    }

    .input-group {
      position: relative;
      display: flex;
      align-items: center;

      i {
        position: absolute;
        left: 0.75rem;
        color: var(--gray-400);
        font-size: 0.875rem;
      }

      input {
        padding: 0.625rem 0.75rem 0.625rem 2.25rem;
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        min-width: 150px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }
      }

      &.search {
        flex: 1;
        min-width: 200px;

        input {
          width: 100%;
        }
      }
    }

    .delete-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 0.375rem;
      background: var(--red-50);
      color: var(--red-600);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      i {
        font-size: 0.875rem;
      }

      &:hover {
        background: var(--red-100);
        color: var(--red-700);
      }
    }

    .reservations-table {
      margin-top: 1rem;
      border: 1px solid var(--gray-200);
      border-radius: 0.75rem;
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: var(--gray-50);
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: var(--gray-700);
        font-size: 0.875rem;
        border-bottom: 1px solid var(--gray-200);
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--gray-100);
        color: var(--gray-600);
        font-size: 0.875rem;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover {
        background: var(--gray-50);
      }
    }

    .empty-message {
      text-align: center;
      color: var(--gray-500);
      padding: 2rem !important;
    }

    .icon-button {
      padding: 0.5rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;

      &.danger {
        color: var(--red-600);

        &:hover {
          background: var(--red-50);
          color: var(--red-700);
        }
      }

      i {
        font-size: 1rem;
      }
    }

    .alert {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;

      &.error {
        background-color: var(--red-50);
        color: var(--red-700);
        border: 1px solid var(--red-100);
      }

      i {
        font-size: 1.25rem;
      }
    }
  `]
})
export class SpaceDetailsComponent implements OnInit {
  spaceId!: number;
  space: Space | null = null;
  isCreatingReservation = false;
  selectedDate: string = '';
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  startTimeOptions: TimeOption[] = [];
  endTimeOptions: TimeOption[] = [];
  minDate: string;
  maxDate: string;
  validationErrors: ValidationError[] = [];
  isFormValid = false;

  newReservation = {
    spaceId: '',
    cedula: '',
    startTime: '',
    endTime: ''
  };

  filterStartDate: string = '';
  filterEndDate: string = '';
  filterCedula: string = '';
  allReservations: any[] = [];
  filteredReservations: any[] = [];
  reservationError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spaceService: SpaceService,
    private reservationService: ReservationService,
    private validationService: ValidationService
  ) {
    // establecer fecha mínima a hoy
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // establecer fecha máxima a 6 meses desde ahora
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    this.maxDate = sixMonthsFromNow.toISOString().split('T')[0];

    // generar opciones de horario
    this.generateTimeOptions();

    // establecer filtro de fecha inicial al mes actual
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.filterStartDate = firstDay.toISOString().split('T')[0];
    this.filterEndDate = lastDay.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.spaceId = +params['id'];
      this.loadSpace();
      this.loadReservations();
    });
  }

  loadSpace() {
    this.spaceService.getSpace(this.spaceId).subscribe(space => {
      this.space = space;
    });
  }

  goBack() {
    this.router.navigate(['/spaces']);
  }

  startNewReservation() {
    this.isCreatingReservation = true;
    this.reservationError = null;
    this.resetForm();
  }

  cancelReservation() {
    this.isCreatingReservation = false;
    this.reservationError = null;
    this.resetForm();
  }

  resetForm() {
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
    this.isFormValid = false;
  }

  generateTimeOptions() {
    const startHour = 8; // 8 de la mañana
    const endHour = 22; // 10 de la noche
    const interval = 15; // intervalo de 15 minutos

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
    const endHour = 22; // 10 de la noche
    const interval = 15; // intervalo de 15 minutos
    const minDuration = 30; // duración mínima de 30 minutos

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
      this.newReservation.startTime = `${this.selectedDate}T${this.selectedStartTime}:00`;
      this.newReservation.endTime = `${this.selectedDate}T${this.selectedEndTime}:00`;
    }
  }

  validateForm() {
    this.updateReservationTimes();
    const reservationData = {
      spaceId: this.spaceId,
      cedula: this.newReservation.cedula,
      startTime: this.newReservation.startTime ? new Date(this.newReservation.startTime) : undefined,
      endTime: this.newReservation.endTime ? new Date(this.newReservation.endTime) : undefined
    };

    this.validationErrors = this.validationService.validateReservation(reservationData, []);
    this.isFormValid = this.validationErrors.length === 0;
  }

  hasError(field: string): boolean {
    return this.validationErrors.some(error => error.field === field);
  }

  getError(field: string): string | null {
    const error = this.validationErrors.find(error => error.field === field);
    return error ? error.message : null;
  }

  loadReservations() {
    this.reservationService.getReservations(this.spaceId).subscribe(reservations => {
      this.allReservations = reservations;
      this.filterReservations();
    });
  }

  filterReservations() {
    let startDate = this.filterStartDate ? new Date(this.filterStartDate) : undefined;
    let endDate = this.filterEndDate ? new Date(this.filterEndDate) : undefined;

    // reiniciar las partes de tiempo para asegurar días completos
    if (startDate) {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
    }
    if (endDate) {
      endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
    }

    this.reservationService.getReservations(
      this.spaceId,
      this.filterCedula,
      startDate,
      endDate
    ).subscribe(reservations => {
      this.filteredReservations = reservations;
    });
  }

  confirmDeleteReservation(reservation: any) {
    if (confirm(`¿Estás seguro que deseas cancelar esta reserva?`)) {
      this.reservationService.deleteReservation(reservation.id).subscribe(() => {
        this.loadReservations();
      });
    }
  }

  createReservation() {
    if (!this.isFormValid) return;

      const reservation = {
        spaceId: this.spaceId,
        cedula: this.newReservation.cedula,
        startTime: this.getDateTime(this.selectedDate, this.selectedStartTime),
        endTime: this.getDateTime(this.selectedDate, this.selectedEndTime)
      };

    this.reservationService.createReservation(reservation).subscribe({
      next: () => {
        this.cancelReservation();
        this.loadReservations();
      },
      error: (error) => {
      if (error.error === "The space is already reserved for the selected time period") {
        this.reservationError = 'El espacio ya está reservado para el período seleccionado';
      } else {
        console.error('Error creating reservation:', error);
        this.reservationError = 'Error al crear la reserva. Por favor, intente nuevamente.';
      }
    }
    });
  }

  private getDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':');
    const [year, month, day] = date.split('-').map(num => parseInt(num));
    
    // Create date in UTC
    return new Date(Date.UTC(year, month - 1, day, parseInt(hours), parseInt(minutes), 0));
  }
} 