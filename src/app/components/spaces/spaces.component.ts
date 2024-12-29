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
          <div class="form-header">
            <i class="fas fa-plus-circle"></i>
            <h3>Crear Nuevo Espacio</h3>
          </div>
          <form class="space-form" (ngSubmit)="createSpace()">
            <div class="form-group">
              <label for="name">
                <i class="fas fa-tag"></i>
                Nombre del Espacio
              </label>
              <input 
                id="name"
                [(ngModel)]="newSpace.name" 
                name="name"
                placeholder="Ej: Sala de Reuniones A" 
                required
                [class.error]="hasError('name')"
                (input)="validateForm()">
              <div class="error-message" *ngIf="getError('name')">
                <i class="fas fa-exclamation-circle"></i>
                {{ getError('name') }}
              </div>
            </div>

            <div class="form-group">
              <label for="description">
                <i class="fas fa-align-left"></i>
                Descripción
              </label>
              <textarea 
                id="description"
                [(ngModel)]="newSpace.description" 
                name="description"
                placeholder="Describe las características del espacio..."
                [class.error]="hasError('description')"
                (input)="validateForm()"></textarea>
              <div class="error-message" *ngIf="getError('description')">
                <i class="fas fa-exclamation-circle"></i>
                {{ getError('description') }}
              </div>
            </div>

            <button 
              type="submit"
              class="submit-button"
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
                <div class="icon-wrapper">
                  <i class="fas fa-building"></i>
                </div>
                <h4>{{ space.name }}</h4>
              </div>
              <div class="space-actions" (click)="$event.stopPropagation()">
                <button 
                  class="action-button view-button"
                  (click)="viewSpace(space)"
                  title="Ver Calendario">
                  <i class="fas fa-calendar-alt"></i>
                  <span>Ver Calendario</span>
                </button>
                <button 
                  class="action-button delete-button"
                  (click)="confirmDelete(space)"
                  title="Eliminar Espacio">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <p class="space-description">{{ space.description }}</p>
            <div class="card-overlay">
              <span>Click para ver detalles</span>
            </div>
          </div>

          <div *ngIf="spaces.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-building"></i>
            </div>
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
      grid-template-columns: 380px 1fr;
      margin: 0 auto;
      max-width: 1600px;
      padding: 0 1rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .page-header {
      margin-bottom: 2rem;
      text-align: center;

      h2 {
        color: var(--gray-800);
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--gray-600);
        font-size: 1.1rem;
      }
    }

    .create-form {
      position: sticky;
      top: 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                  0 10px 15px -3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      i {
        font-size: 1.5rem;
        color: var(--primary);
      }

      h3 {
        color: var(--gray-800);
        margin: 0;
      }
    }

    .space-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: var(--gray-700);

        i {
          color: var(--primary);
          font-size: 0.875rem;
        }
      }

      input, textarea {
        padding: 0.875rem;
        border: 2px solid var(--gray-200);
        border-radius: 0.75rem;
        font-size: 0.95rem;
        transition: all 0.2s;

        &::placeholder {
          color: var(--gray-400);
        }

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        &.error {
          border-color: var(--danger);
        }
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }
    }

    .submit-button {
      background: var(--primary);
      color: white;
      padding: 1rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      margin-top: 1rem;

      &:hover:not(:disabled) {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      i {
        font-size: 1rem;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--danger);
      font-size: 0.875rem;
      margin-top: -0.25rem;

      i {
        font-size: 0.875rem;
      }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .space-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
      min-height: 200px;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
        border-color: var(--primary);

        .card-overlay {
          opacity: 1;
        }

        .space-actions {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    .space-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .space-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        background: var(--primary);
        border-radius: 0.75rem;
        color: white;
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      h4 {
        margin: 0;
        color: var(--gray-800);
        font-size: 1.25rem;
        line-height: 1.4;
        flex: 1;
      }
    }

    .space-description {
      color: var(--gray-600);
      font-size: 1rem;
      line-height: 1.6;
      margin-top: 0.5rem;
      flex-grow: 1;
    }

    .space-actions {
      display: flex;
      gap: 0.75rem;
      opacity: 0.95;
      transition: all 0.3s;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &.view-button {
        background: var(--primary);
        color: white;
        min-width: 160px;

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }
      }

      &.delete-button {
        background: var(--gray-100);
        color: var(--danger);
        padding: 0.75rem;
        width: 42px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: var(--danger);
          color: white;
          transform: translateY(-2px);
        }

        i {
          font-size: 1rem;
        }
      }
    }

    .card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1.5rem;
      background: linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0));
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: all 0.3s;

      span {
        background: var(--primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 2rem;
        font-size: 0.9375rem;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      text-align: center;

      .empty-icon {
        width: 4rem;
        height: 4rem;
        background: var(--gray-100);
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;

        i {
          font-size: 2rem;
          color: var(--gray-400);
        }
      }

      h4 {
        color: var(--gray-800);
        margin-bottom: 0.75rem;
      }

      p {
        color: var(--gray-600);
        max-width: 300px;
        margin: 0 auto;
      }
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
