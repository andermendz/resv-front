import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../models/reservation';
import { ReservationService } from '../../services/reservation.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasReservations: boolean;
  reservations: Reservation[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="icon-button" (click)="navigate('prev')" title="Anterior">
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
      padding: 1.5rem 1rem;
      border-bottom: 1px solid var(--gray-200);
      background: white;
      position: sticky;
      top: 0;
      z-index: 3;
      flex-shrink: 0;

      @media (min-width: 768px) {
        padding: 1.5rem;
      }
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        min-width: 180px;
        text-align: center;

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

      &:hover {
        background: var(--gray-200);
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

      .time-grid {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      .week-header {
        display: grid;
        grid-template-columns: 50px repeat(7, 1fr);
        background: white;
        border-bottom: 1px solid var(--gray-200);
        position: sticky;
        top: 0;
        z-index: 2;

        @media (max-width: 767px) {
          grid-template-columns: 40px repeat(7, 1fr);
        }
      }

      .day-column-header {
        padding: 0.75rem 0.5rem;
        text-align: center;
        font-size: 0.875rem;
        border-left: 1px solid var(--gray-200);
        background: white;

        &.today {
          background: var(--primary-50);
          font-weight: 500;

          .day-number {
            background: var(--primary);
            color: white;
          }
        }

        .day-name {
          font-weight: 500;
          color: var(--gray-700);
          margin-bottom: 0.25rem;

          @media (max-width: 767px) {
            font-size: 0.75rem;
          }
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-bottom: 0.25rem;

          @media (max-width: 767px) {
            width: 20px;
            height: 20px;
            font-size: 0.875rem;
          }
        }

        .month-label {
          font-size: 0.75rem;
          color: var(--gray-500);

          @media (max-width: 767px) {
            font-size: 0.6875rem;
          }
        }
      }

      .scrollable-content {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .time-body {
        display: grid;
        grid-template-columns: 50px 1fr;
        min-height: 100%;

        @media (max-width: 767px) {
          grid-template-columns: 40px 1fr;
        }
      }

      .time-column {
        .time-slot-label {
          height: 60px;
          padding: 0.25rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--gray-500);
          border-right: 1px solid var(--gray-200);

          @media (max-width: 767px) {
            font-size: 0.6875rem;
          }
        }
      }

      .day-columns {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
      }

      .day-column {
        position: relative;
        border-right: 1px solid var(--gray-200);

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

        @media (max-width: 767px) {
          font-size: 0.6875rem;
          left: 2px;
          right: 2px;
          padding: 1px 0;
        }

        &:hover {
          transform: scale(1.02);
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        &:not(:last-child) {
          margin-bottom: 4px;
        }
      }

      .event-content {
        padding: 0.375rem 0.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.05), transparent);

        @media (max-width: 767px) {
          padding: 0.25rem 0.375rem;
        }
      }

      .event-time {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.8125rem;

        @media (max-width: 767px) {
          font-size: 0.75rem;
        }
      }

      .event-user {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0.9;
        font-size: 0.75rem;

        @media (max-width: 767px) {
          font-size: 0.6875rem;
        }

        i {
          font-size: 0.75rem;
          opacity: 0.8;
        }
      }
    }

    .month-view {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--gray-50);
        flex: 1;
      }

      .weekday-header {
        padding: 1rem;
        text-align: center;
        font-weight: 600;
        color: var(--gray-700);
        background: white;
        border-bottom: 1px solid var(--gray-200);
        font-size: 0.875rem;
        position: sticky;
        top: 0;
        z-index: 2;
      }

      .calendar-day {
        padding: 0.75rem;
        border-right: 1px solid var(--gray-200);
        border-bottom: 1px solid var(--gray-200);
        background: white;
        min-height: 120px;
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

          .event-indicator {
            opacity: 0.5;
          }
        }

        &.current-month {
          color: var(--gray-800);
        }

        &.has-events {
          background: var(--gray-50);
        }

        &.today {
          background: var(--primary-50);
          font-weight: 500;

          .day-number {
            background: var(--primary);
            color: white;
          }

          .event-indicator {
            background: var(--primary);
            color: white;
          }
        }
      }

      .day-number {
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        height: 24px;
        width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .day-events {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .event-indicator {
        padding: 0.375rem 0.5rem;
        background: var(--primary);
        color: white;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .event-time {
          font-weight: 500;
        }
      }

      .more-events {
        font-size: 0.75rem;
        color: var(--gray-600);
        text-align: center;
        margin-top: 0.25rem;
        padding: 0.25rem;
        background: var(--gray-100);
        border-radius: 0.25rem;
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  @Input() spaceId!: number;
  weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  hours = Array.from({ length: 15 }, (_, i) => i + 8);
  currentDate = new Date();
  currentView: 'month' | 'week' = 'month';
  calendarDays: CalendarDay[] = [];
  currentWeek: CalendarDay[] = [];
  reservations: Reservation[] = [];
  isMobile = false;
  private isBrowser: boolean;

  constructor(
    private reservationService: ReservationService,
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
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'UTC'
    });
  }

  getReservationTitle(reservation: Reservation): string {
    return `Reservante: ${reservation.cedula} - ${this.getFormattedTime(reservation.startTime)} - ${this.getFormattedTime(reservation.endTime)}`;
  }
} 