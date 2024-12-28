import { Routes } from '@angular/router';
import { SpacesComponent } from './components/spaces/spaces.component';
import { SpaceDetailsComponent } from './components/space-details/space-details.component';

export const routes: Routes = [
  { path: '', redirectTo: '/spaces', pathMatch: 'full' },
  { path: 'spaces', component: SpacesComponent },
  { path: 'spaces/:id', component: SpaceDetailsComponent }
];
