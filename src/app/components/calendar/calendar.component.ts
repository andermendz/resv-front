import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        <div class="view-selector">
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
        <div class="view-container month-view" [class.active]="currentView === 'month'">
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
        <div class="view-container week-view" [class.active]="currentView === 'week'">
          <div class="time-grid">
            <div class="week-header">
              <div class="time-cell"></div>
              <div 
                class="day-column-header" 
                *ngFor="let day of currentWeek"
                [class.today]="isToday(day.date)">
                <div class="day-name">{{ getSpanishWeekDayShort(day.date) }}</div>
                <div class="day-number">{{ day.date | date:'d' }}</div>
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
    }

    .calendar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--gray-200);
      background: white;
      position: sticky;
      top: 0;
      z-index: 3;
      flex-shrink: 0;
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        min-width: 200px;
        text-align: center;
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

    .month-view {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: auto;
        background: var(--gray-50);
        flex: 1;
      }
    }

    .week-view {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      max-height: 700px;

      .time-grid {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: white;
      }

      .week-header {
        display: flex;
        border-bottom: 2px solid var(--gray-200);
        background: white;
        position: sticky;
        top: 0;
        z-index: 2;
        height: 60px;
        flex-shrink: 0;
      }

      .scrollable-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .time-body {
        flex: 1;
        display: flex;
        overflow: auto;
        position: relative;
        min-height: 0;
        background: white;
        height: 900px;
      }
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
      min-height: 100px;
      cursor: pointer;
      transition: all 0.2s;

      &.other-month {
        background: var(--gray-50);
        color: var(--gray-400);
      }

      &.current-month {
        color: var(--gray-800);
      }

      &.has-events {
        background: var(--gray-50);
      }

      &.today {
        background: var(--primary);
        color: white;

        .event-indicator {
          background: white;
          color: var(--primary);
        }

        .more-events {
          color: white;
          opacity: 0.9;
        }
      }

      &:hover:not(.other-month) {
        background: var(--gray-100);
      }
    }

    .day-number {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .event-indicator {
      padding: 0.25rem 0.5rem;
      background: var(--primary);
      color: white;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .more-events {
      font-size: 0.75rem;
      color: var(--gray-600);
      text-align: center;
      margin-top: 0.25rem;
    }

    .time-grid {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: white;
    }

    .time-header {
      display: flex;
      border-bottom: 2px solid var(--gray-200);
      background: white;
      position: sticky;
      top: 0;
      z-index: 2;
      height: 60px;
      flex-shrink: 0;
    }

    .time-cell {
      width: 60px;
      flex-shrink: 0;
      border-right: 1px solid var(--gray-200);
      background: white;
    }

    .day-column-header {
      flex: 1;
      min-width: 120px;
      padding: 0.5rem;
      text-align: center;
      border-right: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.25rem;
      background: white;

      &.today {
        background: var(--primary-50);
        color: var(--primary);
      }

      &:last-child {
        border-right: none;
      }
    }

    .time-body {
      flex: 1;
      display: flex;
      overflow: auto;
      position: relative;
      min-height: 0;
      background: white;
      height: 900px;
    }

    .time-column {
      width: 60px;
      flex-shrink: 0;
      border-right: 1px solid var(--gray-200);
      background: white;
      position: sticky;
      left: 0;
      z-index: 2;
    }

    .time-slot-label {
      height: 60px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      color: var(--gray-600);
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      position: relative;
      background: white;
    }

    .day-columns {
      flex: 1;
      display: flex;
      min-width: min-content;
    }

    .day-column {
      flex: 1;
      min-width: 120px;
      border-right: 1px solid var(--gray-200);
      position: relative;

      &:last-child {
        border-right: none;
      }
    }

    .hour-slots {
      position: relative;
      height: 900px;
    }

    .hour-slot {
      height: 60px;
      border-bottom: 1px solid var(--gray-200);
      position: relative;

      &:nth-child(even) {
        background: var(--gray-50);
      }
    }

    .event-block {
      position: absolute;
      left: 4px;
      right: 4px;
      background: var(--primary);
      color: white;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.75rem;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      min-height: 45px;

      &:hover {
        transform: scale(1.02);
        z-index: 2;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }

    .event-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      justify-content: center;
    }

    .event-time {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8rem;
    }

    .event-user {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      i {
        font-size: 0.75rem;
      }
    }

    .icon-button {
      background: transparent;
      color: var(--gray-600);
      padding: 0.75rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: var(--gray-100);
        color: var(--gray-800);
      }

      i {
        font-size: 1.25rem;
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

  constructor(private reservationService: ReservationService) {}

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.reservationService.getReservations(this.spaceId).subscribe(reservations => {
      this.reservations = reservations;
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
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    
    this.calendarDays = [];

    // agregar días del mes anterior
    const previousMonth = new Date(firstDay);
    previousMonth.setDate(0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(previousMonth);
      date.setDate(previousMonth.getDate() - i);
      this.calendarDays.push(this.createCalendarDay(date, false));
    }

    // agregar días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(firstDay);
      date.setDate(i);
      this.calendarDays.push(this.createCalendarDay(date, true));
    }

    // agregar días del mes siguiente
    const remainingDays = 42 - (this.calendarDays.length % 7);
    if (remainingDays < 7) {
      const nextMonth = new Date(lastDay);
      for (let i = 1; i <= remainingDays; i++) {
        nextMonth.setDate(nextMonth.getDate() + 1);
        this.calendarDays.push(this.createCalendarDay(new Date(nextMonth), false));
      }
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
    const dayReservations = this.reservations.filter(reservation => {
      const resDate = new Date(reservation.startTime);
      return resDate.getDate() === date.getDate() &&
             resDate.getMonth() === date.getMonth() &&
             resDate.getFullYear() === date.getFullYear();
    });

    return {
      date,
      isCurrentMonth,
      hasReservations: dayReservations.length > 0,
      reservations: dayReservations
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
    return (endMinutes - startMinutes);
  }

  getEventTop(reservation: Reservation): number {
    const startTime = new Date(reservation.startTime);
    const hours = startTime.getUTCHours();
    const minutes = startTime.getUTCMinutes();
    return ((hours - 8) * 60) + minutes;
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
    const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const hours = dateObj.getUTCHours().toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getReservationTitle(reservation: Reservation): string {
    return `Reservante: ${reservation.cedula} - ${this.getFormattedTime(reservation.startTime)} - ${this.getFormattedTime(reservation.endTime)}`;
  }
} 