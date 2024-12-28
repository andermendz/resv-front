import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">
      <header class="header">
        <div class="container header-content">
          <h1 class="logo">Reserva de Espacios</h1>
          <nav class="nav">
            <a routerLink="/spaces" routerLinkActive="active" class="nav-link">
              <i class="fas fa-building"></i>
              Espacios
            </a>
          </nav>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      background-color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      padding-bottom: 1rem;

      @media (max-width: 640px) {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .logo {
      color: var(--primary);
      font-size: 1.5rem;
      margin: 0;
    }

    .nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      color: var(--gray-600);
      text-decoration: none;
      border-radius: 0.5rem;
      transition: all 0.2s;

      i {
        font-size: 1.25rem;
      }

      &:hover {
        color: var(--primary);
        background-color: var(--gray-50);
      }

      &.active {
        color: var(--primary);
        background-color: var(--gray-100);
      }
    }

    .main {
      flex: 1;
      padding: 2rem 0;
    }
  `]
})
export class AppComponent {}
