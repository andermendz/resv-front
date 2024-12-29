# Sistema de Reserva de Espacios

## Descripción
Sistema web para la gestión y reserva de espacios. Permite a los usuarios ver la disponibilidad de espacios, realizar reservas y administrar las reservaciones existentes a través de una interfaz intuitiva y moderna.

## Características Principales
- 📅 Calendario interactivo con vistas mensual y semanal
- 🔍 Búsqueda y filtrado de reservas por fecha y cédula
- ⚡ Interfaz responsive adaptada a dispositivos móviles
- 🕒 Gestión de horarios de 8:00 AM a 10:00 PM
- 📱 Vista optimizada para dispositivos móviles
- 🔄 Actualización en tiempo real de disponibilidad

## Requisitos Técnicos
- Node.js (versión 18 o superior)
- Angular CLI (versión 17 o superior)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias:
```bash
cd SpaceReservation.Frontend
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
ng serve
```

4. Abrir el navegador en `http://localhost:4200`

## Uso

### Vista de Espacios
- Visualización de todos los espacios disponibles
- Información detallada de cada espacio
- Estado actual de ocupación

### Reservas
- Creación de nuevas reservas
- Selección de fecha y hora
- Validación de disponibilidad en tiempo real
- Gestión de reservas existentes

### Filtros y Búsqueda
- Filtrado por rango de fechas
- Búsqueda por número de cédula
- Vista de calendario mensual y semanal

## Estructura del Proyecto
```
src/
├── app/
│   ├── components/      # Componentes de la aplicación
│   ├── services/        # Servicios para la lógica de negocio
│   ├── models/          # Interfaces y modelos de datos
│   └── ...
├── assets/             # Recursos estáticos
└── styles/            # Estilos globales
```

## Tecnologías Utilizadas
- Angular 17
- TypeScript
- SCSS
- Angular CLI
- Font Awesome (iconos)

## Contribución
1. Fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia
Este proyecto está bajo la Licencia [TIPO_DE_LICENCIA].
