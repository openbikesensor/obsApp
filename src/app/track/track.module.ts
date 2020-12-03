import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LuxonModule } from 'luxon-angular';

import { TrackComponent } from './track.component';
import { TrackCommentComponent } from './track-comment.component';
import { TrackResolver } from './track-resolver.service';
import { MarkdownPipe } from './markdown.pipe';
import { SharedModule } from '../shared';
import { TrackRoutingModule } from './track-routing.module';

@NgModule({
  imports: [
    SharedModule,
    TrackRoutingModule,
    LuxonModule,
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
