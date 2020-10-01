import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { TrackListConfig, Profile } from '../core';

@Component({
  selector: 'app-profile-tracks',
  templateUrl: './profile-tracks.component.html'
})
export class ProfileTracksComponent {
  public readonly profile$: Observable<Profile | undefined> =
    this.route.parent?.data.pipe(pluck('profile')) ?? of(undefined);

  public readonly tracksConfig$: Observable<TrackListConfig | undefined> =
    this.route.parent?.data.pipe(
      pluck('profile'),
      map((profile: Profile) => {
        return {
          type: 'all',
          filters: {
            author: profile.username
          }
        };
      })
    ) ?? of(undefined);

  constructor(private readonly route: ActivatedRoute) { }
}
