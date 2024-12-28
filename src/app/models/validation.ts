export interface ValidationRules {
  space: {
    name: {
      required: true;
      maxLength: 100;
    };
    description: {
      required: true;
      maxLength: 500;
    };
  };
  reservation: {
    spaceId: {
      required: true;
      mustExist: true;
    };
    cedula: {
      required: true;
      maxLength: 20;
    };
    time: {
      startTime: {
        required: true;
        mustBeBeforeEndTime: true;
        cannotBeInPast: true;
        maxAdvanceBooking: 180; // días
      };
      endTime: {
        required: true;
        mustBeAfterStartTime: true;
      };
      duration: {
        minimum: 30;  // minutos
        maximum: 480; // minutos (8 horas)
      };
    };
    conflicts: {
      noOverlappingSpaceReservations: true;
      noOverlappingUserReservations: true;
    };
  };
}

export const spaceErrors = {
  notFound: "Espacio con ID {spaceId} no encontrado",
  nameRequired: "El nombre es requerido",
  descriptionRequired: "La descripción es requerida",
  nameTooLong: "El nombre no puede exceder 100 caracteres",
  descriptionTooLong: "La descripción no puede exceder 500 caracteres"
};

export const reservationErrors = {
  spaceOverlap: "El espacio ya está reservado para el período seleccionado",
  userOverlap: "Ya tienes una reserva durante este período",
  pastDate: "No se pueden hacer reservas para fechas pasadas",
  invalidDuration: {
    tooShort: "La reserva debe ser de al menos 30 minutos",
    tooLong: "La reserva no puede exceder 8 horas"
  },
  advanceBooking: "No se pueden hacer reservas con más de 6 meses de anticipación",
  endBeforeStart: "La hora de finalización debe ser posterior a la hora de inicio",
  cedulaRequired: "La cédula es requerida",
  cedulaTooLong: "La cédula no puede exceder 20 caracteres"
}; 