import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM, { ATTRIBUTION } from 'ol/source/OSM';
import { transform } from 'ol/proj.js';
import { LineString, Point, Polygon } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { TileJSON, Vector as VectorSource } from 'ol/source';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import colormap from 'colormap';
import { fromLonLat } from 'ol/proj';
import Renderer from 'ol/renderer/webgl/PointsLayer';
import { clamp } from 'ol/math';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import { map } from 'rxjs/operators';


import { ApiService } from '../core/services/api.service';
import {
  Track,
  TracksService,
  TrackData,
  TrackDataService,
  Comment,
  CommentsService,
  User,
  UserService
} from '../core';



proj4.defs('projLayer1', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');

register(proj4);
const color = [0.3, 0.3, 1, 0.5];


export class CustomLayer extends VectorLayer {
  constuctor(opt_options) {
    return VectorLayer.call(this, opt_options) || this;
  }
  createRenderer() {
    return new Renderer(this, {
      colorCallback: function (feature, vertex, component) {
        return color[component];
      },
      sizeCallback: function (feature) {
        return 18 * clamp(feature.get('d1') / 3, 0, 1) + 8;
      }
    });
  }
}



@Component({
  selector: 'app-track-page',
  templateUrl: './track.component.html'
})


export class TrackComponent implements OnInit {
  track: Track;
  trackData: TrackData;
  currentUser: User;
  canModify: boolean;
  comments: Comment[];
  commentControl = new FormControl();
  commentFormErrors = {};
  isSubmitting = false;
  isDeleting = false;
  layers = [];

  constructor(
    private route: ActivatedRoute,
    private tracksService: TracksService,
    private commentsService: CommentsService,
    private trackDataService: TrackDataService,
    private router: Router,
    private userService: UserService,
    private apiService: ApiService,
  ) { }

  ngOnInit() {
    // Retreive the prefetched track
    this.route.data.subscribe(
      (data: { track: Track }) => {
        this.track = data.track;
      }
    );
    // Load the current user's data
    this.userService.currentUser.subscribe(
      (userData: User) => {
        this.currentUser = userData;
        this.canModify = (this.currentUser.username === this.track.author.username); });
    this.populateComments();
    this.populateTrackData();
  }
  createMap()
  {
    console.log(this.track.description);
    console.log(this.track.slug);
    console.log(this.trackData.points.length);
    let lat = 48.7784;
    let long = 9.1797;
    let i = 0;
    if (this.trackData) {
      while (i < this.trackData.points.length) {
        lat = this.trackData.points[i].latitude;
        long = this.trackData.points[i].longitude;
        if (lat !== 0.0 && long !== 0.0) {
          break;
        }
        i++;
      }
    }

    this.layers.push(
      new TileLayer({
        source: new OSM(/*{
     attributions: [
        'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
        ATTRIBUTION
      ],
      url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
          '?apikey=25763459938a4e9d9bec8bde3481f682'
    }*/)
      })
    );

    const trackPoints = [];
    const trackLines = [];
    const points = [];
    if (this.trackData) {
      while (i < this.trackData.points.length) {
        lat = this.trackData.points[i].latitude;
        long = this.trackData.points[i].longitude;
        if (lat !== 0.0 && long !== 0.0) {
          const p = fromLonLat([long, lat]);
          // var p = transform([long, lat], 'EPSG:4326', 'EPSG:3857');
          points.push(p);
          trackPoints.push(
            new Feature({
              flag: this.trackData.points[i].flag,
              d1: this.trackData.points[i].d1,
              d2: this.trackData.points[i].d2,
              geometry: new Point(p)
            })
          );
          if (this.trackData.points[i].flag === 1) {
            // L.marker([lat, long]).addTo(trackMapView);
          }
          //console.log(this.trackData.points[i].d2);
        }
        i++;
      }
      trackLines.push(
        new Feature(
          new LineString(points)
        )
      );
    }

    const trackLayer =
      new VectorLayer({
        visible: true,
        updateWhileAnimating: false,
        updateWhileInteracting: false,
        source: new VectorSource({
          projection: 'EPSG:3857',
          features: trackLines
        }),
        style: new Style({
          stroke: new Stroke({
            width: 3,
            color: [5, 5, 5, 1]
          })
        })

      });

    this.layers.push(trackLayer);
    const oldColor = 'rgba(255,0,0,0.61)';
    const newColor = 'rgba(0,255,0,0.61)';
    const style = {
      variables: {
        minYear: 1850,
        maxYear: 2015
      },
      symbol: {
        symbolType: 'circle',
        size: ['*',
          ['interpolate', ['linear'], ['get', 'd1'], 255, 8, 0, 26],
          1.0],
        color: ['interpolate',
          ['linear'],
          ['get', 'd2'],
          255, newColor,
          0, oldColor
        ],
        opacity: 0.5
      }
    };
    const pointLayer =
      new WebGLPointsLayer(
        {
          visible: true,
          style: style,
          source: new VectorSource({
            projection: 'EPSG:3857',
            features: trackPoints
          }),

        });
    this.layers.push(pointLayer);
    const olMap = new Map({
      layers: this.layers,
      target: 'trackMapView',
      view: new View({
        maxZoom: 22,
        center: transform([long, lat], 'EPSG:4326', 'EPSG:3857'),
        zoom: 15
      })
    });

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

  populateTrackData() {
    // this.trackData = this.trackDataService.getTrackData(this.track.slug);
    this.trackDataService.getAll(this.track.slug)
      .subscribe(trackData => {this.trackData = trackData; this.createMap(); });
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
