import { Injectable } from '@angular/core';
import { spaceErrors, reservationErrors } from '../models/validation';
import { Space } from '../models/space';
import { Reservation } from '../models/reservation';

export interface ValidationError {
  field: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  validateSpace(space: Partial<Space>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Name validations
    if (!space.name?.trim()) {
      errors.push({ field: 'name', message: spaceErrors.nameRequired });
    } else if (space.name.length > 100) {
      errors.push({ field: 'name', message: spaceErrors.nameTooLong });
    }

    // Description validations
    if (!space.description?.trim()) {
      errors.push({ field: 'description', message: spaceErrors.descriptionRequired });
    } else if (space.description.length > 500) {
      errors.push({ field: 'description', message: spaceErrors.descriptionTooLong });
    }

    return errors;
  }

  validateReservation(reservation: Partial<Reservation>, existingReservations: Reservation[] = []): ValidationError[] {
    const errors: ValidationError[] = [];

    // SpaceId validation
    if (!reservation.spaceId) {
      errors.push({ field: 'spaceId', message: 'Space selection is required' });
    }

    // Cedula validations
    if (!reservation.cedula?.trim()) {
      errors.push({ field: 'cedula', message: reservationErrors.cedulaRequired });
    } else if (reservation.cedula.length > 20) {
      errors.push({ field: 'cedula', message: reservationErrors.cedulaTooLong });
    }

    // Time validations
    const now = new Date();
    const startTime = reservation.startTime ? new Date(reservation.startTime) : null;
    const endTime = reservation.endTime ? new Date(reservation.endTime) : null;

    if (!startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    }
    if (!endTime) {
      errors.push({ field: 'endTime', message: 'End time is required' });
    }

    if (startTime && endTime) {
      // Past date validation
      if (startTime < now) {
        errors.push({ field: 'startTime', message: reservationErrors.pastDate });
      }

      // Start/End time order validation
      if (endTime <= startTime) {
        errors.push({ field: 'endTime', message: reservationErrors.endBeforeStart });
      }

      // Duration validations
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (durationMinutes < 30) {
        errors.push({ field: 'duration', message: reservationErrors.invalidDuration.tooShort });
      }
      if (durationMinutes > 480) {
        errors.push({ field: 'duration', message: reservationErrors.invalidDuration.tooLong });
      }

      // Advance booking validation
      const maxAdvanceDate = new Date();
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 180);
      if (startTime > maxAdvanceDate) {
        errors.push({ field: 'startTime', message: reservationErrors.advanceBooking });
      }

      // Overlap validations
      const hasSpaceOverlap = existingReservations.some(existing => 
        existing.spaceId === reservation.spaceId &&
        startTime < new Date(existing.endTime) && 
        endTime > new Date(existing.startTime)
      );
      if (hasSpaceOverlap) {
        errors.push({ field: 'time', message: reservationErrors.spaceOverlap });
      }

      const hasUserOverlap = existingReservations.some(existing => 
        existing.cedula === reservation.cedula &&
        startTime < new Date(existing.endTime) && 
        endTime > new Date(existing.startTime)
      );
      if (hasUserOverlap) {
        errors.push({ field: 'time', message: reservationErrors.userOverlap });
      }
    }

    return errors;
  }
} 