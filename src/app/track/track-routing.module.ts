import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TrackComponent } from './track.component';
import { TrackResolver } from './track-resolver.service';

const routes: Routes = [
  {
    path: ':slug',
    component: TrackComponent,
    resolve: {
      track: TrackResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrackRoutingModule {}
