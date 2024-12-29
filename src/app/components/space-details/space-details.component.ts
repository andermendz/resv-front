import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceService } from '../../services/space.service';
import { ReservationService } from '../../services/reservation.service';
import { ValidationService, ValidationError } from '../../services/validation.service';
import { Space } from '../../models/space';
import { CalendarComponent } from '../calendar/calendar.component';
import { ModalComponent } from '../modal/modal.component';

interface TimeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-space-details',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent, ModalComponent],
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

        <div class="reservation-list card" *ngIf="!isCreatingReservation">
          <div class="section-header">
            <div class="header-title">
              <i class="fas fa-list"></i>
              <h3>Lista de Reservas</h3>
            </div>
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
                  <td>
                    <div class="cedula-cell">
                      <i class="fas fa-user"></i>
                      {{ reservation.cedula }}
                    </div>
                  </td>
                  <td>
                    <button 
                      class="action-button delete-button"
                      (click)="showDeleteConfirmation(reservation)"
                      title="Cancelar Reserva">
                      <i class="fas fa-trash"></i>
                      <span>Cancelar</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredReservations.length === 0">
                  <td colspan="4" class="empty-message">
                    <div class="empty-state">
                      <i class="fas fa-calendar-xmark"></i>
                      <p>No hay reservas que coincidan con los filtros</p>
                    </div>
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
                (input)="validateForm()"
                (keypress)="onlyCedulaNumbers($event)"
                pattern="[0-9]*">
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

    <app-modal *ngIf="showDeleteModal" [title]="'Confirmar Cancelación'" (close)="hideDeleteModal()">
      <div class="confirmation-content">
        <div class="confirmation-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>¿Estás seguro que deseas cancelar esta reserva?</p>
          <div class="reservation-details">
            <div class="detail-item">
              <span class="label">Fecha:</span>
              <span>{{ selectedReservation?.startTime | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Hora:</span>
              <span>{{ selectedReservation?.startTime | date:'HH:mm':'UTC' }} - {{ selectedReservation?.endTime | date:'HH:mm':'UTC' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Cédula:</span>
              <span>{{ selectedReservation?.cedula }}</span>
            </div>
          </div>
        </div>
        <div class="confirmation-actions">
          <button class="secondary-button" (click)="hideDeleteModal()">
            Cancelar
          </button>
          <button class="delete-button" (click)="deleteReservation()">
            <i class="fas fa-trash"></i>
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    /* Add responsive breakpoints at the top */
    :host {
      --mobile-breakpoint: 768px;
      --small-mobile-breakpoint: 480px;
    }

    .page-header {
      margin-bottom: 2rem;
      padding: 1rem;

      @media (max-width: 768px) {
        margin-bottom: 1rem;
      }
    }

    .header-content {
      display: flex;
      gap: 2rem;
      align-items: flex-start;

      @media (max-width: 768px) {
        gap: 1rem;
        flex-direction: column;
      }
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
      flex-wrap: wrap;
      gap: 1rem;

      @media (max-width: 768px) {
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0;
        color: var(--gray-800);

        @media (max-width: 768px) {
          font-size: 1.125rem;
        }
      }

      .primary-button {
        @media (max-width: 768px) {
          width: 100%;
          justify-content: center;
        }
      }
    }

    .calendar-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      @media (max-width: 768px) {
        padding: 1rem;
        border-radius: 0.5rem;
      }
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

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
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

      @media (max-width: 768px) {
        flex-direction: column-reverse;
        
        button {
          width: 100%;
          justify-content: center;
        }
      }
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

      @media (max-width: 768px) {
        padding: 0.875rem 1rem;
        font-size: 0.938rem;
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

      @media (max-width: 768px) {
        padding: 0.875rem 1rem;
        font-size: 0.938rem;
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

      input, select {
        @media (max-width: 768px) {
          padding: 0.75rem;
          font-size: 1rem;
        }
      }
    }

    .reservation-list {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-top: 2rem;
      overflow: hidden;
    }

    .section-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      @media (min-width: 1024px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          font-size: 1.25rem;
          color: var(--primary);
        }

        h3 {
          margin: 0;
          color: var(--gray-800);
          font-size: 1.25rem;
        }
      }
    }

    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        width: auto;
      }
    }

    .date-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;

      .date-separator {
        color: var(--gray-400);
        padding: 0 0.25rem;
      }
    }

    .input-group {
      position: relative;
      flex: 1;

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--gray-400);
        pointer-events: none;
      }

      input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        &::placeholder {
          color: var(--gray-400);
        }
      }

      &.search {
        min-width: 240px;
      }
    }

    .reservations-table {
      overflow-x: auto;

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        th, td {
          padding: 1rem 1.5rem;
          text-align: left;
          border-bottom: 1px solid var(--gray-200);
          white-space: nowrap;
        }

        th {
          background: var(--gray-50);
          font-weight: 600;
          color: var(--gray-700);
          position: sticky;
          top: 0;
          z-index: 1;
        }

        tbody tr {
          transition: all 0.2s;

          &:hover {
            background: var(--gray-50);
          }
        }
      }
    }

    .cedula-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: var(--gray-400);
        font-size: 0.875rem;
      }
    }

    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &.delete-button {
        background: var(--danger);
        color: white;

        &:hover {
          background: var(--danger-dark);
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      i {
        font-size: 0.875rem;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem 1.5rem;
      color: var(--gray-500);

      i {
        font-size: 2.5rem;
        color: var(--gray-400);
      }

      p {
        margin: 0;
        text-align: center;
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

      @media (max-width: 768px) {
        padding: 0.875rem;
        font-size: 0.875rem;
      }
    }

    .confirmation-content {
      padding: 1.5rem;
    }

    .confirmation-message {
      text-align: center;
      margin-bottom: 2rem;

      i {
        font-size: 3rem;
        color: var(--danger);
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.125rem;
        color: var(--gray-800);
        margin: 0 0 1.5rem;
      }
    }

    .reservation-details {
      background: var(--gray-50);
      border-radius: 0.5rem;
      padding: 1rem;
      text-align: left;

      .detail-item {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: var(--gray-600);
          min-width: 60px;
        }
      }
    }

    .confirmation-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;

      @media (max-width: 768px) {
        flex-direction: column-reverse;
        
        button {
          width: 100%;
        }
      }

      .delete-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--danger);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        i {
          font-size: 1rem;
        }
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

  showDeleteModal = false;
  selectedReservation: any = null;

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

    // establecer filtro de fecha desde hoy hasta un mes después
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    this.filterStartDate = today.toISOString().split('T')[0];
    this.filterEndDate = oneMonthFromNow.toISOString().split('T')[0];
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

    // Reset time parts for proper date comparison
    if (startDate) {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
    }
    if (endDate) {
      endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
    }

    this.filteredReservations = this.allReservations.filter(reservation => {
      const reservationDate = new Date(reservation.startTime);
      
      // Filter by date range if specified
      if (startDate && reservationDate < startDate) return false;
      if (endDate && reservationDate > endDate) return false;
      
      // Filter by cedula if specified
      if (this.filterCedula && !reservation.cedula.includes(this.filterCedula)) return false;
      
      return true;
    });
  }

  showDeleteConfirmation(reservation: any) {
    this.selectedReservation = reservation;
    this.showDeleteModal = true;
  }

  hideDeleteModal() {
    this.showDeleteModal = false;
    this.selectedReservation = null;
  }

  deleteReservation() {
    if (this.selectedReservation) {
      this.reservationService.deleteReservation(this.selectedReservation.id).subscribe(() => {
        this.hideDeleteModal();
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

  onlyCedulaNumbers(event: KeyboardEvent): boolean {
    // Allow only number keys and control keys (backspace, delete, etc)
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
} 