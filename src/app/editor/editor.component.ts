import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Track, TracksService } from '../core';

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.component.html'
})
export class EditorComponent implements OnInit {
  track: Track = {} as Track;
  trackForm: FormGroup;
  errors: Object = {};
  isSubmitting = false;

  constructor(
    private tracksService: TracksService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // use the FormBuilder to create a form group
    this.trackForm = this.fb.group({
      title: '',
      description: '',
      body: ''
    });

    // Optional: subscribe to value changes on the form
    // this.trackForm.valueChanges.subscribe(value => this.updateTrack(value));
  }

  ngOnInit() {
    // If there's a tack prefetched, load it
    this.route.data.subscribe((data: { track: Track }) => {
      if (data.track) {
        this.track = data.track;
        this.trackForm.patchValue(data.track);
      }
    });
  }

  submitForm() {
    this.isSubmitting = true;

    // update the model
    this.updateTrack(this.trackForm.value);

    // post the changes
    this.tracksService.save(this.track).subscribe(
      track => this.router.navigateByUrl('/track/' + track.slug),
      err => {
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  updateTrack(values: Object) {
    Object.assign(this.track, values);
  }
}
