import { Component, Input } from '@angular/core';

import { Track } from '../../core';

@Component({
  selector: 'app-track-meta',
  templateUrl: './track-meta.component.html'
})
export class TrackMetaComponent {
  @Input() track: Track;
}
