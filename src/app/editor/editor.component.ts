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
  existing = false;
  isSubmitting = false;
  visibleInfoVisible = false;

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
      body: '',
      visible: false,
    });

    // Optional: subscribe to value changes on the form
    // this.trackForm.valueChanges.subscribe(value => this.updateTrack(value));
  }

  ngOnInit() {
    // If there's a tack prefetched, load it
    this.route.data.subscribe((data: { track: Track }) => {
      if (data.track) {
        // We're not adding the body back into the form here on purpose, so
        // that we don't edit it. We shall only upload a new body if it is
        // pasted in full. This is because some tracks don't contain the whole
        // body, only parts of it, due to a bug in the old API code. See
        // https://github.com/Friends-of-OpenBikeSensor/obsAPI/issues/20 for
        // more details.
        // TODO: Put body back in when obsAPI#20 is solved.
        this.track = {...data.track};
        this.track.body = null;
        this.trackForm.patchValue(this.track);
        this.existing = true;
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

  toggleVisibleInfo() {
    this.visibleInfoVisible  = !this.visibleInfoVisible ;
  }
}
