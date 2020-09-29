import { Component, Input } from '@angular/core';

import { Track, TrackListConfig, TracksService } from '../../core';
@Component({
  selector: 'app-track-list',
  styleUrls: ['track-list.component.css'],
  templateUrl: './track-list.component.html'
})
export class TrackListComponent {
  constructor(
    private tracksService: TracksService
  ) { }

  @Input() limit: number;
  @Input()
  set config(config: TrackListConfig | undefined) {
    if (config) {
      this.query = config;
      this.currentPage = 1;
      this.runQuery();
    }
  }

  query: TrackListConfig;
  results: Track[];
  loading = false;
  currentPage = 1;
  totalPages: Array<number> = [1];

  setPageTo(pageNumber) {
    this.currentPage = pageNumber;
    this.runQuery();
  }

  runQuery() {
    this.loading = true;
    this.results = [];

    // Create limit and offset filter (if necessary)
    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = (this.limit * (this.currentPage - 1));
    }

    this.tracksService.query(this.query)
      .subscribe(data => {
        this.loading = false;
        this.results = data.tracks;

        // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
        this.totalPages = Array.from(new Array(Math.ceil(data.tracksCount / this.limit)), (val, index) => index + 1);
      });
  }
}
