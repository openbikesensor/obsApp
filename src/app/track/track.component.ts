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




import {ApiService} from '../core/services/api.service';
import {Comment, CommentsService, Track, TrackData, TrackDataService, TracksService, User, UserService} from '../core';
import {Coordinate} from 'ol/coordinate';
import LayerGroup from "ol/layer/Group";
import VectorLayer from "ol/layer/Vector";

import CircleStyle from "ol/style/Circle";
import Group from "ol/layer/Group";
import {tile} from "ol/loadingstrategy";


proj4.defs('projLayer1', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');

register(proj4);
const color = [0.3, 0.3, 1, 0.5];


@Component({
    selector: 'app-track-page',
    templateUrl: './track.component.html',
    styleUrls: ['./track.component.css']
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
        const trackLines: Feature[] = [];
        const points: Coordinate[] = [];

        if (this.trackData) {
            let filteredPoints = this.trackData.points.filter(point => point.latitude && point.longitude)

            for (let i = 0; i < filteredPoints.length; i++) {
                let dataPoint = filteredPoints[i];
                let nextDataPoint = filteredPoints[i + 50] ? filteredPoints[i + 50] : filteredPoints[i];
                if (dataPoint.latitude && dataPoint.longitude && nextDataPoint.latitude && nextDataPoint.longitude) {
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

            //Simplify to 1 point per 2 meter
            let lineString = new LineString(points);

            let simplifiedLineStringGeometry = lineString
                .simplify(2);

            trackLines.push(
                new Feature(
                    simplifiedLineStringGeometry
                )
            );
        }

        const trackVectorSource = new VectorSource({
            features: trackLines
        })

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



        const pointLayerTaqgedD1 =
            new VectorLayer(
                {
                    title: "Left",
                    visible: true,
                    style: pointStyleFunction,
                    source: new VectorSource({
                        features: trackPointsD1
                    }),

                } as BaseLayerOptions);


        const pointLayerTaggedD2 =
            new VectorLayer(
                {
                    startActive: false,
                    title: "Right",
                    visible: false,
                    style: pointStyleFunction,
                    source: new VectorSource({
                        features: trackPointsD2
                    }),

                } as BaseLayerOptions);



        const pointLayerUntaggedD1 =
            new VectorLayer(
                {
                    startActive: false,
                    title: "Left Untagged",
                    visible: false,
                    style: pointStyleFunction,
                    source: new VectorSource({
                        features: trackPointsUntaggedD1
                    }),

                } as BaseLayerOptions);


        const pointLayerUntaggedD2 =
            new VectorLayer(
                {
                    startActive: false,
                    title: "Right Untagged",
                    visible: false,
                    style: pointStyleFunction,
                    source: new VectorSource({
                        features: trackPointsUntaggedD2
                    }),

                } as BaseLayerOptions);



        const olMap = new Map({
            layers:  [
                tileLayer,
                trackLayer,
                new Group({
                    title: 'Tagged Points',
                    layers: [
                        pointLayerTaqgedD1,
                        pointLayerTaggedD2

                    ]
                } as GroupLayerOptions),
                new Group({
                    title: 'Untagged Points',
                    fold: 'close',
                    visible: false,
                    layers: [
                        pointLayerUntaggedD1,
                        pointLayerUntaggedD2

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

        const layerSwitcher = new LayerSwitcher({
            groupSelectStyle: 'children',
            startActive: true,
            activationMode: 'click',
            reverse: false,


        });
        olMap.addControl(layerSwitcher);


        const distanceLimit = 150


        function pointStyleFunction(feature, resolution) {
            let distance = feature.get("distance");

            let redStroke = new Stroke({color: 'rgb(255, 0, 0)'})
            let yellowStroke = new Stroke({color: 'rgb(255,233,87)'})
            let greenStroke = new Stroke({color: 'rgb(50, 205, 50)'})
            let redFill = new Fill({color: 'rgba(255, 0, 0, 0.2)'})
            let yellowFill = new Fill({color: 'rgba(255,233,87,0.2)'})
            let greenFill = new Fill({color: 'rgba(50, 205, 50, 0.2)'})

            let radius = 200 / resolution;
            return new Style({
                image: new CircleStyle({
                    radius: radius < 20 ? radius : 20,
                    fill: distance < distanceLimit ? redFill : greenFill,
                    stroke: distance < distanceLimit ? redStroke : greenStroke,
                }),
                text: createTextStyle(distance, resolution),
            });
        }

        const createTextStyle = function (distance, resolution) {
            let redFill = new Fill({color: 'red'})
            let greenFill = new Fill({color: 'green'})

            return new Text({
                textAlign: 'center',
                textBaseline: 'middle',
                font: 'normal 18px/1 Arial',
                text: resolution < 6 ? "" + distance : "",
                fill: distance < distanceLimit ? redFill : greenFill,
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
        // this.trackData = this.trackDataService.getTrackData(this.track.slug);
        this.trackDataService.getAll(this.track.slug)
            .subscribe(trackData => {
                this.trackData = trackData;
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
