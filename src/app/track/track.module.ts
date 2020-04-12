import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TrackComponent } from './track.component';
import { TrackCommentComponent } from './track-comment.component';
import { TrackResolver } from './track-resolver.service';
import { MarkdownPipe } from './markdown.pipe';
import { SharedModule } from '../shared';
import { TrackRoutingModule } from './track-routing.module';

@NgModule({
  imports: [
    SharedModule,
    TrackRoutingModule
  ],
  declarations: [
    TrackComponent,
    TrackCommentComponent,
    MarkdownPipe
  ],

  providers: [
    TrackResolver
  ]
})
export class TrackModule {}
