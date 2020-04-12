import { Component, Input } from '@angular/core';

import { Track } from '../../core';

@Component({
  selector: 'app-track-preview',
  templateUrl: './track-preview.component.html'
})
export class TrackPreviewComponent {
  @Input() track: Track;

}
