import { RenderMode, ServerRoute } from '@angular/ssr';
import { SpaceService } from './services/space.service';
import { inject } from '@angular/core';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'spaces/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const spaceService = inject(SpaceService);
      try {
        const spaces = await spaceService.getSpaces().toPromise();
        return spaces?.map(space => ({ id: space.id.toString() })) ?? [];
      } catch (error) {
        console.error('Failed to fetch spaces for prerendering:', error);
        return [];
      }
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
