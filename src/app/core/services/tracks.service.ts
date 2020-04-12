import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Track, TrackListConfig } from '../models';
import { map } from 'rxjs/operators';

@Injectable()
export class TracksService {
  constructor (
    private apiService: ApiService
  ) {}

  query(config: TrackListConfig): Observable<{tracks: Track[], tracksCount: number}> {
    // Convert any filters over to Angular's URLSearchParams
    const params = {};

    Object.keys(config.filters)
    .forEach((key) => {
      params[key] = config.filters[key];
    });

    return this.apiService
    .get(
      '/tracks' + ((config.type === 'feed') ? '/feed' : ''),
      new HttpParams({ fromObject: params })
    );
  }

  get(slug): Observable<Track> {
    return this.apiService.get('/tracks/' + slug)
      .pipe(map(data => data.track));
  }

  destroy(slug) {
    return this.apiService.delete('/tracks/' + slug);
  }

  save(track): Observable<Track> {
    // If we're updating an existing track
    if (track.slug) {
      return this.apiService.put('/tracks/' + track.slug, {track: track})
        .pipe(map(data => data.track));

    // Otherwise, create a new track
    } else {
      return this.apiService.post('/tracks/', {track: track})
        .pipe(map(data => data.track));
    }
  }

}
