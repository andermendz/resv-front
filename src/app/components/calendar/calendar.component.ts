import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../models/reservation';
import { ReservationService } from '../../services/reservation.service';
import { SpaceService } from '../../services/space.service';
import { ModalComponent } from '../../components/modal/modal.component';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasReservations: boolean;
  reservations: Reservation[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button 
            class="icon-button" 
            (click)="navigate('prev')" 
            [disabled]="isPrevDisabled()"
            [class.disabled]="isPrevDisabled()"
            title="Anterior">
            <i class="fas fa-chevron-left"></i>
          </button>
          <h3>
            <ng-container [ngSwitch]="currentView">
              <ng-container *ngSwitchCase="'month'">
                {{ getSpanishMonth(currentDate) }} {{ currentDate.getFullYear() }}
              </ng-container>
              <ng-container *ngSwitchCase="'week'">
                {{ getWeekRange() }}
              </ng-container>
            </ng-container>
          </h3>
          <button class="icon-button" (click)="navigate('next')" title="Siguiente">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="view-selector desktop-only">
          <button 
            class="view-button" 
            [class.active]="currentView === 'month'"
            (click)="setView('month')"
            title="Vista Mensual">
            <i class="fas fa-calendar-alt"></i>
            Mes
          </button>
          <button 
            class="view-button" 
            [class.active]="currentView === 'week'"
            (click)="setView('week')"
            title="Vista Semanal">
            <i class="fas fa-calendar-week"></i>
            Semana
          </button>
        </div>
      </div>

      <div class="calendar-views">
        <!-- Month View -->
        <div class="view-container month-view desktop-only" [class.active]="currentView === 'month'">
          <div class="calendar-grid">
            <div class="weekday-header" *ngFor="let day of weekDays">{{ day }}</div>
            <div 
              *ngFor="let day of calendarDays" 
              class="calendar-day"
              [class.current-month]="day.isCurrentMonth"
              [class.other-month]="!day.isCurrentMonth"
              [class.has-events]="day.hasReservations"
              [class.today]="isToday(day.date)"
              (click)="selectWeek(day)">
              <span class="day-number">{{ day.date | date:'d' }}</span>
              <div class="day-events" *ngIf="day.hasReservations">
                <div 
                  class="event-indicator" 
                  *ngFor="let reservation of day.reservations | slice:0:3"
                  (click)="showReservationDetails($event, reservation)"
                  [title]="getReservationTitle(reservation)">
                  <span class="event-time">{{ getFormattedTime(reservation.startTime) }}</span>
                </div>
                <div class="more-events" *ngIf="day.reservations.length > 3">
                  +{{ day.reservations.length - 3 }} más
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week View -->
        <div class="view-container week-view" [class.active]="currentView === 'week' || isMobile">
          <div class="time-grid">
            <div class="week-header">
              <div class="time-cell"></div>
              <div 
                class="day-column-header" 
                *ngFor="let day of currentWeek"
                [class.today]="isToday(day.date)">
                <div class="day-name">{{ getSpanishWeekDayShort(day.date) }}</div>
                <div class="day-number">{{ day.date | date:'d' }}</div>
                <div class="month-label">{{ getSpanishMonthShort(day.date) }}</div>
              </div>
            </div>
            <div class="scrollable-content">
              <div class="time-body">
                <div class="time-column">
                  <div class="time-slot-label" *ngFor="let hour of hours">
                    {{ hour | number:'2.0-0' }}:00
                  </div>
                </div>
                <div class="day-columns">
                  <div class="day-column" *ngFor="let day of currentWeek">
                    <div class="hour-slots">
                      <div class="hour-slot" *ngFor="let hour of hours">
                      </div>
                      <ng-container *ngFor="let reservation of day.reservations">
                        <div 
                          class="event-block"
                          [style.height.px]="getEventHeight(reservation)"
                          [style.top.px]="getEventTop(reservation)"
                          (click)="showReservationDetails($event, reservation)"
                          [title]="getReservationTitle(reservation)">
                          <div class="event-content">
                            <div class="event-time">
                              {{ getFormattedTime(reservation.startTime) }} - {{ getFormattedTime(reservation.endTime) }}
                            </div>
                            <div class="event-user">
                              <i class="fas fa-user"></i>
                              {{ reservation.cedula }}
                            </div>
                          </div>
                        </div>
                      </ng-container>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Space Delete Confirmation Modal -->
    <app-modal *ngIf="selectedSpace" [title]="'Confirmar Eliminación'" (close)="closeSpaceDeleteConfirmation()">
      <div class="confirmation-modal">
        <div class="modal-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="modal-content">
          <h3>¿Estás seguro que deseas eliminar este espacio?</h3>
          <div class="warning-message">
            <p>Esta acción eliminará permanentemente el espacio y todas sus reservaciones asociadas.</p>
          </div>
          <div class="space-info">
            <div class="info-item">
              <i class="fas fa-building"></i>
              <div class="info-content">
                <label>Espacio</label>
                <span>{{ selectedSpace.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeSpaceDeleteConfirmation()">
            Cancelar
          </button>
          <button class="btn-danger" (click)="deleteSpace()">
            <i class="fas fa-trash-alt"></i>
            Confirmar
          </button>
        </div>
      </div>
    </app-modal>

    <!-- Reservation Details Modal -->
    <app-modal *ngIf="selectedReservation" [title]="'Detalles de la Reserva'" (close)="closeReservationDetails()">
      <div class="reservation-details-modal">
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-building"></i>
              ESPACIO
            </div>
            <div class="info-value">{{ selectedReservation.spaceName }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-id-card"></i>
              CÉDULA
            </div>
            <div class="info-value">{{ selectedReservation.cedula }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-calendar"></i>
              FECHA
            </div>
            <div class="info-value capitalize">{{ getFormattedDate(selectedReservation.startTime) }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-clock"></i>
              HORA INICIO
            </div>
            <div class="info-value">{{ getFormattedTime(selectedReservation.startTime) }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-clock"></i>
              HORA FIN
            </div>
            <div class="info-value">{{ getFormattedTime(selectedReservation.endTime) }}</div>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .calendar-container {
      background: white;
      border-radius: 0.75rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .calendar-header {
      padding: 1rem;
      border-bottom: 1px solid var(--gray-200);
      background: white;
      position: sticky;
      top: 0;
      z-index: 3;
      flex-shrink: 0;
      width: 100%;
      overflow: hidden;

      @media (min-width: 768px) {
        padding: 1.5rem;
      }
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 0.5rem;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        text-align: center;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;

        @media (min-width: 768px) {
          font-size: 1.25rem;
          min-width: 200px;
        }
      }
    }

    .icon-button {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gray-100);
      border: none;
      border-radius: 0.5rem;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(.disabled) {
        background: var(--gray-200);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      i {
        font-size: 0.875rem;
      }
    }

    .desktop-only {
      @media (max-width: 767px) {
        display: none !important;
      }
    }

    .view-selector {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .view-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--gray-100);
      color: var(--gray-600);
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      font-weight: 500;

      i {
        font-size: 1rem;
      }

      &:hover {
        background: var(--gray-200);
      }

      &.active {
        background: var(--primary);
        color: white;
      }
    }

    .calendar-views {
      position: relative;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .view-container {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;

      &.active {
        opacity: 1;
        pointer-events: auto;
        position: relative;
      }
    }

    .week-view {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: auto;
      -webkit-overflow-scrolling: touch;

      .time-grid {
        display: flex;
        flex-direction: column;
        min-width: fit-content;
      }

      .week-header {
        display: grid;
        grid-template-columns: 60px repeat(7, minmax(120px, 1fr));
        background: white;
        z-index: 2;
        border-bottom: 1px solid var(--gray-200);
        position: sticky;
        top: 0;

        @media (max-width: 768px) {
          grid-template-columns: 50px repeat(7, minmax(120px, 1fr));
        }

        .time-cell {
          padding: 0.75rem 0.5rem;
          border-right: 1px solid var(--gray-200);
          background: var(--gray-50);
          position: sticky;
          left: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;

          @media (max-width: 768px) {
            padding: 0.5rem 0.25rem;
          }
        }

        .day-column-header {
          padding: 0.75rem 0.5rem;
          text-align: center;
          border-right: 1px solid var(--gray-200);
          background: var(--gray-50);

          @media (max-width: 768px) {
            padding: 0.5rem 0.25rem;
          }

          &.today {
            background: var(--primary-50);
            color: var(--primary);
            font-weight: 500;
          }

          .day-name {
            font-weight: 500;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;

            @media (max-width: 768px) {
              font-size: 0.75rem;
            }
          }

          .day-number {
            font-size: 1.125rem;
            font-weight: 600;
            line-height: 1;
            margin-bottom: 0.25rem;

            @media (max-width: 768px) {
              font-size: 1rem;
            }
          }

          .month-label {
            font-size: 0.75rem;
            color: var(--gray-500);

            @media (max-width: 768px) {
              font-size: 0.688rem;
            }
          }
        }
      }

      .scrollable-content {
        flex: 1;
        position: relative;
      }

      .time-body {
        display: flex;
      }

      .time-column {
        width: 60px;
        flex-shrink: 0;
        border-right: 1px solid var(--gray-200);
        background: var(--gray-50);
        position: sticky;
        left: 0;
        z-index: 1;

        @media (max-width: 768px) {
          width: 50px;
        }
      }

      .time-slot-label {
        height: 60px;
        padding: 0.5rem;
        text-align: center;
        font-size: 0.875rem;
        color: var(--gray-600);
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        align-items: center;
        justify-content: center;

        @media (max-width: 768px) {
          height: 50px;
          font-size: 0.75rem;
          padding: 0.25rem;
        }
      }

      .day-columns {
        display: grid;
        grid-template-columns: repeat(7, minmax(120px, 1fr));
        flex: 1;
      }

      .day-column {
        border-right: 1px solid var(--gray-200);
        position: relative;

        &:last-child {
          border-right: none;
        }
      }

      .hour-slots {
        position: relative;
      }

      .hour-slot {
        height: 60px;
        border-bottom: 1px solid var(--gray-200);

        @media (max-width: 768px) {
          height: 50px;
        }
      }

      .event-block {
        position: absolute;
        left: 4px;
        right: 4px;
        margin: 2px 0;
        padding: 2px 0;
        background: var(--primary);
        border-radius: 0.375rem;
        color: white;
        font-size: 0.75rem;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

        @media (max-width: 768px) {
          left: 2px;
          right: 2px;
          font-size: 0.688rem;
        }

        &:hover {
          transform: scale(1.02);
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .event-content {
          padding: 0.375rem 0.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: linear-gradient(to right, rgba(0, 0, 0, 0.05), transparent);

          @media (max-width: 768px) {
            padding: 0.25rem 0.375rem;
          }
        }

        .event-time {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-user {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.9;

          i {
            font-size: 0.75rem;
            opacity: 0.8;
          }
        }
      }
    }

    .month-view {
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: var(--gray-200);
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        overflow: hidden;
      }

      .weekday-header {
        padding: 1rem;
        text-align: center;
        font-weight: 600;
        color: var(--gray-700);
        background: var(--gray-50);
        font-size: 0.875rem;
      }

      .calendar-day {
        aspect-ratio: 1;
        padding: 0.75rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;

        &:hover:not(.other-month) {
          background: var(--gray-50);
        }

        &.other-month {
          background: var(--gray-50);
          color: var(--gray-400);
        }

        &.today {
          background: var(--primary-50);

          .day-number {
            background: var(--primary);
            color: white;
          }
        }

        .day-number {
          font-weight: 600;
          font-size: 0.875rem;
          height: 24px;
          width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }

        .day-events {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow: hidden;
        }

        .event-indicator {
          padding: 0.25rem 0.5rem;
          background: var(--primary);
          color: white;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .more-events {
          font-size: 0.75rem;
          color: var(--gray-600);
          text-align: center;
          padding: 0.25rem;
          background: var(--gray-100);
          border-radius: 0.25rem;
          margin-top: auto;
        }
      }
    }

    .confirmation-modal {
      padding: 1.5rem;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;

      .modal-icon {
        color: var(--danger);
        margin-bottom: 1rem;

        i {
          font-size: 3rem;
        }
      }

      .modal-content {
        h3 {
          color: var(--gray-800);
          font-size: 1.125rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .warning-message {
          background: var(--danger-50);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;

          p {
            color: var(--danger-700);
            font-size: 0.875rem;
            margin: 0;
          }
        }
      }

      .space-info {
        background: var(--gray-50);
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        text-align: left;

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;

          i {
            color: var(--primary);
            font-size: 1rem;
            margin-top: 0.125rem;
          }

          .info-content {
            flex: 1;
            min-width: 0;

            label {
              display: block;
              font-size: 0.75rem;
              color: var(--gray-600);
              margin-bottom: 0.25rem;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.025em;
            }

            span {
              display: block;
              color: var(--gray-800);
              font-size: 0.875rem;
              font-weight: 500;
            }
          }
        }
      }

      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;

        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;

          i {
            font-size: 0.875rem;
          }
        }

        .btn-secondary {
          background: var(--gray-100);
          color: var(--gray-700);

          &:hover {
            background: var(--gray-200);
          }
        }

        .btn-danger {
          background: var(--danger);
          color: white;

          &:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
        }

        @media (max-width: 500px) {
          flex-direction: column;
          
          button {
            width: 100%;
          }
        }
      }
    }

    .reservation-details-modal {
      padding: 1rem;
      max-width: 500px;
      margin: 0 auto;

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .info-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background: var(--gray-50);
        border-radius: 0.5rem;

        .info-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-600);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.025em;

          i {
            color: var(--primary);
            font-size: 1rem;
          }
        }

        .info-value {
          color: var(--gray-800);
          font-size: 0.9375rem;
          font-weight: 500;
          padding-left: 1.5rem;

          &.capitalize {
            text-transform: capitalize;
          }
        }
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  @Input() spaceId!: number;
  spaceName: string = '';
  weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  hours = Array.from({ length: 15 }, (_, i) => i + 8);
  currentDate = new Date();
  currentView: 'month' | 'week' = 'month';
  calendarDays: CalendarDay[] = [];
  currentWeek: CalendarDay[] = [];
  reservations: Reservation[] = [];
  isMobile = false;
  selectedSpace: any = null;
  private isBrowser: boolean;
  selectedReservation: Reservation | null = null;

  constructor(
    private reservationService: ReservationService,
    private spaceService: SpaceService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Initialize mobile detection
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        this.currentView = 'week';
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) {
          this.currentView = 'week';
        }
      });
    }
    
    this.loadReservations();
  }

  loadReservations() {
    this.reservationService.getReservations(this.spaceId).subscribe(reservations => {
      // Ensure all dates are properly handled as Date objects
      this.reservations = reservations.map(reservation => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }));
      
      this.generateCalendarDays();
      if (this.currentView === 'week') {
        this.generateWeekDays();
      }
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  generateCalendarDays() {
    // Get first day of the month
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    // Get last day of the month
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
    // Get the first day to display (last days of previous month if needed)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Get the last day to display (first days of next month if needed)
    const endDate = new Date(lastDay);
    const remainingDays = 6 - endDate.getDay();
    endDate.setDate(endDate.getDate() + remainingDays);
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      this.calendarDays.push(this.createCalendarDay(
        new Date(currentDate),
        currentDate.getMonth() === this.currentDate.getMonth()
      ));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  generateWeekDays() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    this.currentWeek = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      this.currentWeek.push(this.createCalendarDay(date, true));
    }
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    // Set the time to midnight for date-only comparison
    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const dayReservations = this.reservations.filter(reservation => {
      // Get just the date part of the reservation start time
      const resDate = new Date(reservation.startTime);
      const reservationDate = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate());
      
      // Compare dates only (ignoring time)
      return dayDate.getTime() === reservationDate.getTime();
    });

    return {
      date: dayDate,
      isCurrentMonth,
      hasReservations: dayReservations.length > 0,
      reservations: dayReservations.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    };
  }

  navigate(direction: 'prev' | 'next') {
    if (direction === 'prev' && this.isPrevDisabled()) {
      return;
    }

    switch (this.currentView) {
      case 'month':
        const monthDelta = direction === 'prev' ? -1 : 1;
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + monthDelta, 1);
        this.generateCalendarDays();
        break;
      
      case 'week':
        const weekDelta = direction === 'prev' ? -7 : 7;
        this.currentDate = new Date(this.currentDate.getTime() + weekDelta * 24 * 60 * 60 * 1000);
        this.generateWeekDays();
        break;
    }
  }

  isPrevDisabled(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.currentView === 'month') {
      // For month view, check if current month is current month or future
      const currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return currentMonth <= thisMonth;
    } else {
      // For week view, check if start of week is before or equal to today
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return startOfWeek <= today;
    }
  }

  getWeekRange(): string {
    const startDate = this.currentWeek[0].date;
    const endDate = this.currentWeek[6].date;
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getDate()} - ${endDate.getDate()} de ${this.getSpanishMonth(startDate)} ${startDate.getFullYear()}`;
    } else {
      return `${startDate.getDate()} de ${this.getSpanishMonth(startDate)} - ${endDate.getDate()} de ${this.getSpanishMonth(endDate)} ${startDate.getFullYear()}`;
    }
  }

  getSpanishMonth(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[date.getMonth()];
  }

  setView(view: 'month' | 'week') {
    this.currentView = view;
    if (view === 'week') {
      this.generateWeekDays();
    }
  }

  hasReservationAtTime(day: CalendarDay, hour: number): boolean {
    return day.reservations.some(reservation => {
      const startHour = new Date(reservation.startTime).getHours();
      const endHour = new Date(reservation.endTime).getHours();
      return startHour <= hour && endHour > hour;
    });
  }

  getReservationsForHour(day: CalendarDay, hour: number): Reservation[] {
    return day.reservations.filter(reservation => {
      const startHour = new Date(reservation.startTime).getHours();
      const endHour = new Date(reservation.endTime).getHours();
      return startHour <= hour && endHour > hour;
    });
  }

  getEventHeight(reservation: Reservation): number {
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
    return (endMinutes - startMinutes) - 4;
  }

  getEventTop(reservation: Reservation): number {
    const startTime = new Date(reservation.startTime);
    const hours = startTime.getUTCHours();
    const minutes = startTime.getUTCMinutes();
    return ((hours - 8) * 60) + minutes + 2;
  }

  selectWeek(day: CalendarDay) {
    this.currentDate = new Date(day.date);
    this.setView('week');
  }

  isFirstOrLastDayOfWeek(day: CalendarDay): boolean {
    if (!this.currentWeek.length) return false;
    return day === this.currentWeek[0] || day === this.currentWeek[6];
  }

  getSpanishWeekDayShort(date: Date): string {
    const shortDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return shortDays[date.getDay()];
  }

  getSpanishMonthShort(date: Date): string {
    const shortMonths = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return shortMonths[date.getMonth()];
  }

  getFormattedTime(dateStr: string | Date): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false
    });
  }

  getReservationTitle(reservation: Reservation): string {
    return `Reservante: ${reservation.cedula} - ${this.getFormattedTime(reservation.startTime)} - ${this.getFormattedTime(reservation.endTime)}`;
  }

  showSpaceDeleteConfirmation(event: Event, space: any) {
    event.stopPropagation();
    this.selectedSpace = space;
  }

  closeSpaceDeleteConfirmation() {
    this.selectedSpace = null;
  }

  deleteSpace() {
    if (this.selectedSpace) {
      this.spaceService.deleteSpace(this.selectedSpace.id).subscribe({
        next: () => {
          this.closeSpaceDeleteConfirmation();
          // Optionally refresh the spaces list or emit an event
        },
        error: (error) => {
          console.error('Error deleting space:', error);
        }
      });
    }
  }

  showReservationDetails(event: Event, reservation: Reservation) {
    event.stopPropagation();
    // Ensure dates are properly handled
    this.selectedReservation = {
      ...reservation,
      startTime: new Date(reservation.startTime),
      endTime: new Date(reservation.endTime)
    };
  }

  closeReservationDetails() {
    this.selectedReservation = null;
  }

  getFormattedDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const weekDay = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'long' });
    const year = d.getFullYear();
    return `${weekDay}, ${day} de ${month} ${year}`;
  }
} 