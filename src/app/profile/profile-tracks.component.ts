import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TrackListConfig, Profile } from '../core';

@Component({
  selector: 'app-profile-tracks',
  templateUrl: './profile-tracks.component.html'
})
export class ProfileTracksComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  profile: Profile;
  tracksConfig: TrackListConfig = {
    type: 'all',
    filters: {}
  };

  ngOnInit() {
    this.route.parent.data.subscribe(
      (data: {profile: Profile}) => {
        this.profile = data.profile;
        this.tracksConfig = {
          type: 'all',
          filters: {}
        }; // Only method I found to refresh track load on swap
        this.tracksConfig.filters.author = this.profile.username;
      }
    );
  }

}
