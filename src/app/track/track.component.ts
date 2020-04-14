import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

import {
  Track,
  TracksService,
  Comment,
  CommentsService,
  User,
  UserService
} from '../core';

@Component({
  selector: 'app-track-page',
  templateUrl: './track.component.html'
})
export class TrackComponent implements OnInit {
  track: Track;
  currentUser: User;
  canModify: boolean;
  comments: Comment[];
  commentControl = new FormControl();
  commentFormErrors = {};
  isSubmitting = false;
  isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private tracksService: TracksService,
    private commentsService: CommentsService,
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit() {
    // Retreive the prefetched track
    this.route.data.subscribe(
      (data: { track: Track }) => {
        this.track = data.track;

        // Load the comments on this track
        this.populateComments();
      }
    );
    let lat = 48.7784;
    let long = 9.1797;
    let i = 0;
    while ( i < this.track.points.length)
    {
      lat = this.track.points[i].latitude;
      long = this.track.points[i].longitude;
      if (lat != 0.0 && long != 0.0)
      {
         break;
      }
      i++;
    }
    const trackMapView = L.map('trackMapView').setView([lat, long], 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,\
    <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,\
       Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidXdldyIsImEiOiJjazh5ZmgybGYwMWVqM2tsN3k4ZmRsMzJiIn0.RplaQqYejNJe1MEhszvGIw'
}).addTo(trackMapView);
let points = [];
while ( i < this.track.points.length)
{
  lat = this.track.points[i].latitude;
  long = this.track.points[i].longitude;
  if (lat != 0.0 && long != 0.0)
  {
     points.push( [lat, long] );
     if(this.track.points[i].flag == 1)
     {
      var marker = L.marker([lat, long]).addTo(trackMapView);
     }
  }
  i++;
}
let tr = L.polyline(points).addTo(trackMapView);;
    // Load the current user's data
    this.userService.currentUser.subscribe(
      (userData: User) => {
        this.currentUser = userData;

        this.canModify = (this.currentUser.username === this.track.author.username);
      }
    );
  }

  onToggleFollowing(following: boolean) {
    this.track.author.following = following;
  }

  deleteTrack() {
    this.isDeleting = true;

    this.tracksService.destroy(this.track.slug)
      .subscribe(
        success => {
          this.router.navigateByUrl('/');
        }
      );
  }

  populateComments() {
    this.commentsService.getAll(this.track.slug)
      .subscribe(comments => this.comments = comments);
  }

  addComment() {
    this.isSubmitting = true;
    this.commentFormErrors = {};

    const commentBody = this.commentControl.value;
    this.commentsService
      .add(this.track.slug, commentBody)
      .subscribe(
        comment => {
          this.comments.unshift(comment);
          this.commentControl.reset('');
          this.isSubmitting = false;
        },
        errors => {
          this.isSubmitting = false;
          this.commentFormErrors = errors;
        }
      );
  }

  onDeleteComment(comment) {
    this.commentsService.destroy(comment.id, this.track.slug)
      .subscribe(
        success => {
          this.comments = this.comments.filter((item) => item !== comment);
        }
      );
  }

}
