# Sistema de Reserva de Espacios

## Descripción
Sistema web para la gestión y reserva de espacios. Permite a los usuarios ver la disponibilidad de espacios, realizar reservas y gestionar las reservas existentes a través de una interfaz intuitiva y moderna.

## Características Principales
- 📅 Calendario interactivo con vistas mensuales y semanales
- 🔍 Búsqueda y filtrado de reservas por fecha e ID
- ⚡ Interfaz responsiva adaptada para dispositivos móviles
- 🕒 Gestión de horarios de 8:00 AM a 10:00 PM
- 📱 Vista optimizada para móviles
- 🔄 Actualizaciones de disponibilidad en tiempo real

## Requisitos Técnicos
- Node.js (versión 18 o superior)
- Angular CLI (versión 17 o superior)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## Instalación

1. Clonar el repositorio:
```bash
git clone [REPOSITORY_URL]
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
- Ver todos los espacios disponibles
- Información detallada de cada espacio
- Estado actual de ocupación

### Reservas
- Crear nuevas reservas
- Selección de fecha y hora
- Validación de disponibilidad en tiempo real
- Gestionar reservas existentes

### Filtros y Búsqueda
- Filtrar por rango de fechas
- Buscar por número de ID
- Vistas de calendario mensual y semanal

## Estructura del Proyecto
```
src/
├── app/
│   ├── components/      # Componentes de la aplicación
│   ├── services/        # Servicios de lógica de negocio
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
1. Haz un fork del repositorio
2. Crea tu rama de características (`git checkout -b feature/CaracteristicaIncreible`)
3. Realiza tus cambios (`git commit -m 'Añadir alguna CaracteristicaIncreible'`)
4. Sube la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abre un Pull Request

## Licencia
Este proyecto está licenciado bajo [LICENSE_TYPE].
