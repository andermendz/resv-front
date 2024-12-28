import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="icon-button" (click)="close.emit()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-container {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--gray-200);

      h3 {
        margin: 0;
        color: var(--gray-800);
      }
    }

    .modal-content {
      flex: 1;
      overflow-y: auto;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .icon-button {
      padding: 0.5rem;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--gray-600);
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      
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
export class ModalComponent {
  @Input() title: string = '';
  @Output() close = new EventEmitter<void>();
} 