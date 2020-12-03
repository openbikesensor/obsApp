import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { TrackData } from '../models';
import { map } from 'rxjs/operators';


@Injectable()
export class TrackDataService {
    private trackData: TrackData;
  constructor (
    private apiService: ApiService
  ) {}

  getAll(slug): Observable<TrackData> {
    return this.apiService.get(`/tracks/${slug}/data`).pipe(map(data => data.trackData));
  }
  getTrackData(slug): TrackData {
    this.apiService.get(`/tracks/${slug}/data`).pipe(map(data => data.trackData)).subscribe(trackData => this.trackData = trackData);
    return this.trackData;
  }

}
