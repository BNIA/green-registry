import {Component,OnInit,OnChanges,SimpleChange} from '@angular/core';
import {Input} from '@angular/core';
import {GeoJSON,Map,FeatureGroup,LatLng} from 'leaflet'
import * as myTileLayers from '../../core/tile-layers';

@Component({
    selector:'map',
    template:`
    <div id="mymap">
    </div>
    `,
    styles:[`
    #mymap{
        height:100%;
        width:100%;
    `],
    directives:[]
})

export class MapComponent implements OnChanges, OnInit{
    @Input() boundary:GeoJSON
    @Input() layers:FeatureGroup<any>[]
    map:Map
    currentLayers:FeatureGroup<any>[]
    initialize(){
        this.map = new Map('mymap',{
            'center': new LatLng(39.2854197594374, -76.61796569824219),
            'zoom' : 12,
            minZoom: 0,
            maxZoom: 18,
            'zoomControl' : false,
            layers:[myTileLayers.cartodbPositron]
        })
    }
    ngOnInit(){
        //this is called when the component initializes
        this.initialize()
    }
    ngOnChanges(changes: {[ propName: string]: SimpleChange}){
        //this is called whenever the input value changes
        //watch out for immutables
        if(this.layers){
            if(this.currentLayers){
                _.forEach(this.currentLayers,(c) => {
                    this.map.removeLayer(c)
                })
            }
            _.forEach(this.layers,(l) => {
                l.addTo(this.map)
            })
            this.currentLayers = this.layers
        }

    }
}
