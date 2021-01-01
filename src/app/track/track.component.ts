import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {Geometry, LineString, Point} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';
import {Fill, Stroke, Style, Text} from 'ol/style';
import Feature from 'ol/Feature';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {fromLonLat} from 'ol/proj';
import LayerSwitcher, {BaseLayerOptions, GroupLayerOptions} from 'ol-layerswitcher';


import {ApiService} from '../core/services';
import {Comment, CommentsService, Track, TrackData, TrackDataService, TracksService, User, UserService} from '../core';
import {Coordinate} from 'ol/coordinate';
import VectorLayer from "ol/layer/Vector";

import CircleStyle from "ol/style/Circle";
import Group from "ol/layer/Group";
import {AppSettings} from "../AppSettings";


proj4.defs('projLayer1', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');

register(proj4);
const color = [0.3, 0.3, 1, 0.5];


@Component({
    selector: 'app-track-page',
    templateUrl: './track.component.html',
    styleUrls: ['track.component.css']
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
    isExporting = false;

    constructor(
        private route: ActivatedRoute,
        private tracksService: TracksService,
        private commentsService: CommentsService,
        private trackDataService: TrackDataService,
        private router: Router,
        private userService: UserService,
        private apiService: ApiService,
    ) {
    }

    ngOnInit() {
        // Retrieve the prefetched track
        this.route.data.subscribe(
            (data: { track: Track }) => {
                this.track = data.track;
            }
        );
        // Load the current user's data
        this.userService.currentUser.subscribe(
            (userData: User) => {
                this.currentUser = userData;
                this.canModify = (this.currentUser.username === this.track.author.username);
            });
        this.populateComments();
        this.populateTrackData();
    }

    createMap() {
        const tileLayer = new TileLayer({
            source: new OSM(/*{
      attributions: [
        'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
        ATTRIBUTION
      ],
      url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=25763459938a4e9d9bec8bde3481f682',
    }*/)
        });


        const trackPointsD1: Feature<Geometry>[] = [];
        const trackPointsD2: Feature<Geometry>[] = [];
        const trackPointsUntaggedD1: Feature<Geometry>[] = [];
        const trackPointsUntaggedD2: Feature<Geometry>[] = [];
        const points: Coordinate[] = [];

        if (this.trackData && this.trackData.filteredPoints) {
            for (let i = 0; i < this.trackData.filteredPoints.length; i++) {
                let dataPoint = this.trackData.filteredPoints[i];
                if (dataPoint.latitude && dataPoint.longitude) {
                    const p = fromLonLat([dataPoint.longitude, dataPoint.latitude]);
                    points.push(p);


                    if (dataPoint.flag) {
                        if (dataPoint.d1) {
                            trackPointsD1.push(
                                new Feature({
                                    distance: dataPoint.d1,
                                    geometry: new Point(p)
                                })
                            )
                        }

                        if (dataPoint.d2) {
                            trackPointsD2.push(
                                new Feature({
                                    distance: dataPoint.d2,
                                    geometry: new Point(p)
                                })
                            );
                        }
                    } else {
                        if (dataPoint.d1) {
                            trackPointsUntaggedD1.push(
                                new Feature({
                                    distance: dataPoint.d1,
                                    geometry: new Point(p)
                                })
                            )
                        }

                        if (dataPoint.d2) {
                            trackPointsUntaggedD2.push(
                                new Feature({
                                    distance: dataPoint.d2,
                                    geometry: new Point(p)
                                })
                            );
                        }
                    }
                }
            }
        }

        //Simplify to 1 point per 2 meter
        const trackVectorSource = new VectorSource({
            features: [
                new Feature(new LineString(points).simplify(2))
            ]
        });

        const trackLayer =
            new VectorLayer({
                visible: true,
                updateWhileAnimating: false,
                updateWhileInteracting: false,

                source: trackVectorSource,
                style: new Style({
                    stroke: new Stroke({
                        width: 3,
                        color: 'rgb(30,144,255)'
                    })
                })

            });


        const olMap = new Map({
            layers: [
                tileLayer,
                trackLayer,
                new Group({
                    title: 'Tagged Points',
                    layers: [
                        getPointLayer(trackPointsD1, "Left", true),
                        getPointLayer(trackPointsD2, "Right", false),

                    ]
                } as GroupLayerOptions),
                new Group({
                    title: 'Untagged Points',
                    fold: 'close',
                    visible: false,
                    layers: [
                        getPointLayer(trackPointsUntaggedD1, "Left Untagged", false),
                        getPointLayer(trackPointsUntaggedD2, "Right Untagged", false),

                    ]
                } as GroupLayerOptions)
            ],
            target: 'trackMapView',
            view: new View({
                maxZoom: 22,
                center: points[0] || fromLonLat([9.1797, 48.7784]),
                zoom: 15
            })
        });

        function getPointLayer(trackPoints : Feature<Geometry>[], title, visible) {
            return new VectorLayer(
                {
                    title: title,
                    visible: visible,
                    style: pointStyleFunction,
                    source: new VectorSource({
                        features: trackPoints
                    }),

                } as BaseLayerOptions);
        }

        const layerSwitcher = new LayerSwitcher({
            groupSelectStyle: 'children',
            startActive: true,
            activationMode: 'click',
            reverse: false,


        });
        olMap.addControl(layerSwitcher);


        function pointStyleFunction(feature, resolution) {
            let distance = feature.get("distance");
            let radius = 200 / resolution;

            return new Style({
                image: new CircleStyle({
                    radius: radius < 20 ? radius : 20,
                    fill: evaluateDistanceForFillColor(distance),
                    stroke: evaluateDistanceForStrokeColor(distance)
                }),
                text: createTextStyle(distance, resolution),
            });
        }


        const evaluateDistanceForFillColor = function (distance) {
            const redFill = new Fill({color: 'rgba(255, 0, 0, 0.2)'})
            const orangeFill = new Fill({color: 'rgba(245,134,0,0.2)'})
            const greenFill = new Fill({color: 'rgba(50, 205, 50, 0.2)'})

            switch (evaluateDistanceColor(distance)) {
                case 'red':
                    return redFill
                case 'orange':
                    return orangeFill
                case 'green':
                    return greenFill
            }
        }

        const evaluateDistanceForStrokeColor = function (distance) {
            const redStroke = new Stroke({color: 'rgb(255, 0, 0)'})
            const orangeStroke = new Stroke({color: 'rgb(245,134,0)'})
            const greenStroke = new Stroke({color: 'rgb(50, 205, 50)'})

            switch (evaluateDistanceColor(distance)) {
                case 'red':
                    return redStroke
                case 'orange':
                    return orangeStroke
                case 'green':
                    return greenStroke
            }
        }

        const evaluateDistanceColor = function (distance) {
            if (distance < AppSettings.MIN_DISTANCE) {
                return 'red'
            } else if (distance < AppSettings.WARN_DISTANCE) {
                return 'orange'
            } else {
                return 'green'
            }
        }

        const createTextStyle = function (distance, resolution) {
            return new Text({
                textAlign: 'center',
                textBaseline: 'middle',
                font: 'normal 18px/1 Arial',
                text: resolution < 6 ? "" + distance : "",
                fill: new Fill({color: evaluateDistanceColor(distance)}),
                stroke: new Stroke({color: 'white', width: 2}),
                offsetX: 0,
                offsetY: 0
            });
        };


        olMap.getView().fit(trackVectorSource.getExtent());

    }

    matchRoute() {

    }


    exportGPX() {
        this.isExporting = true;
        let fileContents = '<?xml version="1.0"?>\n' +
            '<gpx version="1.1" creator="openbikesensor.hlrs.de">\n';
        fileContents += '<trk>\n';
        fileContents += '<trkseg>\n';
        let nameCounter = 1;
        for (const p of this.trackData.points) {
            fileContents += '<trkpt  lat="' + p.latitude + '" lon="' + p.longitude + '">\n' +
                '<name>' + nameCounter + '</name>\n';
            if (p.flag != null && p.flag > 0) {
                fileContents += '<sym>Flag</sym>\n';
            }
            fileContents += '<cmt> d1="' + p.d1 + '" d2="' + p.d2 + '" </cmt>\n';
            fileContents += '</trkpt>\n';
            nameCounter++;
        }
        fileContents += '</trkseg>\n';
        fileContents += '</trk>\n';
        fileContents += '</gpx>';
        const filename = 'track.gpx';
        const filetype = 'text/plain';
        const a = document.createElement('a');
        const dataURI = 'data:' + filetype +
            ';base64,' + btoa(fileContents);
        a.href = dataURI;
        a['download'] = filename;
        const e = document.createEvent('MouseEvents');
        // Use of deprecated function to satisfy TypeScript.
        e.initMouseEvent('click', true, false,
            document.defaultView ?? window, 0, 0, 0, 0, 0,
            false, false, false, false, 0, null);
        a.dispatchEvent(e);
        a.remove();
        this.isExporting = false;
    }

    exportCSV() {
        this.isExporting = true;
        let fileContents = 'Date;Time;Latitude;Longitude;Course;Speed;Right;Left;Confirmed;insidePrivacyArea\n';
        for (const p of this.trackData.points) {
            fileContents += [p.date, p.time, p.latitude, p.longitude, p.course, p.speed, p.d1, p.d2, p.flag, p.private].map(
                (value) => {
                    if (value == null) {
                        return '';
                    } else if (typeof value === 'number') {
                        return String(value);
                    } else if (typeof value === 'boolean') {
                        return value ? '1' : '0';
                    } else if (typeof value === 'string' && /[^a-zA-Z0-9_.,: -]/.test(value)) {
                        // properly escape strings that contain quotes, semicolons, or
                        // anything else that is weird
                        return JSON.stringify(value);
                    } else {
                        // unproblematic string can be returned as-is
                        return value;
                    }
                }
            ).join(';') + ';\n';
        }
        const filename = 'track.csv';
        const filetype = 'text/plain';
        const a = document.createElement('a');
        const dataURI = 'data:' + filetype +
            ';base64,' + btoa(fileContents);
        a.href = dataURI;
        a['download'] = filename;
        const e = document.createEvent('MouseEvents');
        // Use of deprecated function to satisfy TypeScript.
        e.initMouseEvent('click', true, false,
            document.defaultView ?? window, 0, 0, 0, 0, 0,
            false, false, false, false, 0, null);
        a.dispatchEvent(e);
        a.remove();
        this.isExporting = false;
    }

    populateComments() {
        this.commentsService.getAll(this.track.slug)
            .subscribe(comments => this.comments = comments);
    }

    populateTrackData() {
        this.trackDataService.getAll(this.track.slug)
            .subscribe(trackData => {
                this.trackData = trackData;
                // != undefined checks for null and undefined
                this.trackData.filteredPoints = trackData.points.filter(point => point.latitude != undefined && point.longitude != undefined)
                this.createMap();
            });
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
