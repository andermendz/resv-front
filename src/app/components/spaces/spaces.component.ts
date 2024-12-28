import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpaceService } from '../../services/space.service';
import { ValidationService, ValidationError } from '../../services/validation.service';
import { Space } from '../../models/space';

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Gestión de Espacios</h2>
      <p class="subtitle">Crea y administra tus espacios disponibles</p>
    </div>

    <div class="content-layout">
      <aside class="sidebar">
        <div class="card create-form">
          <h3>Crear Nuevo Espacio</h3>
          <form class="space-form" (ngSubmit)="createSpace()">
            <div class="form-group">
              <label for="name">Nombre del Espacio</label>
              <input 
                id="name"
                [(ngModel)]="newSpace.name" 
                name="name"
                placeholder="Ingrese nombre del espacio" 
                required
                [class.error]="hasError('name')"
                (input)="validateForm()">
              <div class="error-message" *ngIf="getError('name')">
                {{ getError('name') }}
              </div>
            </div>

            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea 
                id="description"
                [(ngModel)]="newSpace.description" 
                name="description"
                placeholder="Ingrese descripción del espacio"
                [class.error]="hasError('description')"
                (input)="validateForm()"></textarea>
              <div class="error-message" *ngIf="getError('description')">
                {{ getError('description') }}
              </div>
            </div>

            <button 
              type="submit"
              class="primary-button"
              [disabled]="!isFormValid">
              <i class="fas fa-plus"></i>
              Crear Espacio
            </button>
          </form>
        </div>
      </aside>

      <main class="main-content">
        <div class="grid">
          <div *ngFor="let space of spaces" class="card space-card" (click)="viewSpace(space)">
            <div class="space-header">
              <div class="space-title">
                <i class="fas fa-building space-icon"></i>
                <h4>{{ space.name }}</h4>
              </div>
              <div class="space-actions" (click)="$event.stopPropagation()">
                <button 
                  class="action-button primary"
                  (click)="viewSpace(space)"
                  title="Ver Calendario">
                  <i class="fas fa-calendar-alt"></i>
                  Ver Calendario
                </button>
                <button 
                  class="action-button danger"
                  (click)="confirmDelete(space)"
                  title="Eliminar Espacio">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <p class="space-description">{{ space.description }}</p>
          </div>

          <div *ngIf="spaces.length === 0" class="empty-state card">
            <i class="fas fa-building empty-icon"></i>
            <h4>No Hay Espacios Disponibles</h4>
            <p>Crea tu primer espacio usando el formulario de la izquierda</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .content-layout {
      display: grid;
      gap: 2rem;
      grid-template-columns: 350px 1fr;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .create-form {
      position: sticky;
      top: 2rem;

      h3 {
        color: var(--gray-900);
        margin-bottom: 1.5rem;
      }
    }

    .space-form {
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

      input, textarea {
        padding: 0.75rem;
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        &.error {
          border-color: var(--red-500);
        }
      }

      textarea {
        min-height: 100px;
        resize: vertical;
      }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .space-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

        .space-actions {
          opacity: 1;
        }
      }
    }

    .space-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .space-title {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .space-icon {
        font-size: 1.5rem;
        color: var(--primary);
      }

      h4 {
        margin: 0;
        color: var(--gray-900);
      }
    }

    .space-actions {
      display: flex;
      gap: 0.5rem;
      opacity: 0.8;
      transition: all 0.2s;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &.primary {
        background: var(--primary);
        color: white;

        &:hover {
          background: var(--primary-dark);
        }
      }

      &.danger {
        background: var(--gray-100);
        color: var(--red-600);
        padding: 0.5rem;

        &:hover {
          background: var(--red-50);
          color: var(--red-700);
        }

        i {
          font-size: 1rem;
        }
      }
    }

    .space-description {
      color: var(--gray-600);
      flex: 1;
      margin: 0;
      line-height: 1.5;
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
        color: var(--gray-700);
      }
    }

    .primary-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 0.75rem;
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

    .error-message {
      font-size: 0.875rem;
      color: var(--red-600);
    }
  `]
})
export class SpacesComponent implements OnInit {
  spaces: Space[] = [];
  newSpace = { name: '', description: '' };
  validationErrors: ValidationError[] = [];
  isFormValid = false;

  constructor(
    private router: Router,
    private spaceService: SpaceService,
    private validationService: ValidationService
  ) {}

  ngOnInit() {
    this.loadSpaces();
  }

  loadSpaces() {
    this.spaceService.getSpaces().subscribe(spaces => {
      this.spaces = spaces;
    });
  }

  validateForm() {
    this.validationErrors = this.validationService.validateSpace(this.newSpace);
    this.isFormValid = this.validationErrors.length === 0;
  }

  hasError(field: string): boolean {
    return this.validationErrors.some(error => error.field === field);
  }

  getError(field: string): string | null {
    const error = this.validationErrors.find(error => error.field === field);
    return error ? error.message : null;
  }

  createSpace() {
    this.validateForm();
    if (this.isFormValid) {
      this.spaceService.createSpace(this.newSpace).subscribe(() => {
        this.loadSpaces();
        this.newSpace = { name: '', description: '' };
        this.validationErrors = [];
      });
    }
  }

  deleteSpace(id: number) {
    this.spaceService.deleteSpace(id).subscribe(() => {
      this.loadSpaces();
    });
  }

  viewSpace(space: Space) {
    this.router.navigate(['/spaces', space.id]);
  }

  confirmDelete(space: Space) {
    if (confirm(`¿Estás seguro que deseas eliminar el espacio "${space.name}"?`)) {
      this.deleteSpace(space.id);
    }
  }
}
