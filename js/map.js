// map.js
// started 14.6.19

// ######################################
/* 1. GLOBAL VARIABLES */
const STARTLOCATION = [28.6, 77.1];

var planLayer = new L.layerGroup();
var inputsLayer = new L.layerGroup();

var simTreeData = [];
var gLoadedFiles = new Set();
var gVisibleLayers = new Set();
var gCollection = {};
var firstRunDone = false; // for preventing 3-time calling of mapStops() on startup.

// ######################################
// Initiate Leaflet MAP
// background layers, using Leaflet-providers plugin. See https://github.com/leaflet-extras/leaflet-providers
var OSM = L.tileLayer.provider('OpenStreetMap.Mapnik');
var cartoVoyager = L.tileLayer.provider('CartoDB.VoyagerLabelsUnder');
var cartoPositron = L.tileLayer.provider('CartoDB.Positron');
var cartoDark = L.tileLayer.provider('CartoDB.DarkMatter');
var esriWorld = L.tileLayer.provider('Esri.WorldImagery');
var gStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var gHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});

var baseLayers = { "CartoDB Voyager":cartoVoyager, "OpenStreetMap.org" : OSM, "CartoDB Light": cartoPositron, "CartoDB Dark": cartoDark, "ESRI Satellite": esriWorld, "gStreets": gStreets, "gHybrid": gHybrid };

var map = new L.Map('map', {
	center: STARTLOCATION,
	zoom: 10,
	layers: [cartoPositron],
	scrollWheelZoom: true,
	maxZoom: 20
});

var sidebar = L.control.sidebar('sidebar').addTo(map);

$('.leaflet-container').css('cursor','crosshair'); // from https://stackoverflow.com/a/28724847/4355695 Changing mouse cursor to crosshairs

L.control.scale({metric:true, imperial:false}).addTo(map);

// SVG renderer
var myRenderer = L.canvas({ padding: 0.5 });

var overlays = {
	"Draft Plan": planLayer,
	"Inputs": inputsLayer
};
planLayer.addTo(map);
inputsLayer.addTo(map);

var layerControl = L.control.layers(baseLayers, overlays, {collapsed: true, autoZIndex:false}).addTo(map); 

// ######################################
// RUN ON PAGE LOAD

$(document).ready(function() {
    
	setTimeout(function () {
		sidebar.open('home');
	}, 2000);
	loadCSV();

});

// ######################################
// FUNCTIONS

function loadCSV() {
	csvFile = './config/draftmpd41_layers.csv';
	$('#status').html(`Loading..`);
	// papa parse load csv
	Papa.parse(csvFile, {
		download: true,
		header: true,
		skipEmptyLines: true,
		dynamicTyping: true, // this reads numbers as numerical; set false to read everything as string
		complete: function(results, file) {
			
			loadLayers(results.data);

		}, // end of complete
        error: function(err, file, inputElem, reason) {
            $('#status').html(`Could not load ${csvFile}`);
        },

	});

}

function loadLayers(data) {
	// console.log(data);
	var groupsList = [];
	simTreeData = [];
	data.forEach(r => {
		if(! groupsList.includes(r.group)) {
			simTreeData.push({
				"id": r.group,
                "pid": "",
                "name": r.group,
                "type": 'grouping'
            });
            groupsList.push(r.group);
		}
		row = {
            "id": r.shapefile,
            "pid": r.group,
            "name": `${r.name}`,
            "shapefile": r.shapefile,
            "color": r.color,
            "type": r.type
        };
        simTreeData.push(row);
	}); // end of forEach loop
	// console.log(simTreeData);
	// now, lauch simTree:
    simTree({
        el: '#tree',
        check: true,
        linkParent: true,
        data: simTreeData,
        onClick: function (item) {
            //console.log(item);
        },
        onChange: function (item) {
            //console.log(item);
            updateMapLayers(item);
        }
    });
    $('#status').html(`Loaded layers`);
}

function updateMapLayers(selectedLayers) {
	// filtering out group names
	var newSelection = new Set();
	selectedLayers.forEach(r => {
		if(r.type=='grouping') return;
		console.log(r.shapefile);
		newSelection.add(r);
	});
	console.log('newSelection', newSelection);
	
	newSelection.forEach(r => {
		// console.log(r.shapefile, 'in newSelection');
		// check if geojson has already been loaded
		if (gLoadedFiles.has(r)) {
			console.log(r.shapefile,"already loaded.");

			if( !gVisibleLayers.has(r)) {
				// geojson is already loaded, but not visible. Now that it's enabled, make it visible
				planLayer.addLayer(gCollection[r.shapefile]);
				console.log(`making ${r.shapefile} visible`);
				gVisibleLayers.add(r);
			}
		} else {
			loadGeojson(r); // make it visible also
		}

	});

	// make unselected layers invisible
	var removeLayersSet = new Set([...gVisibleLayers].filter( x => !newSelection.has(x) ));
	removeLayersSet.forEach(r => {
		console.log('Have to remove from visible:',r.shapefile);
		planLayer.removeLayer(gCollection[r.shapefile]);
		gVisibleLayers.delete(r);
	});

}

function loadGeojson(r) {
	console.log("loading geojson:",r.shapefile);
	gLoadedFiles.add(r);
	var filename = `data/${r.shapefile}`;
	// https://stackoverflow.com/a/5048056/4355695
	$.get(filename)
    .done(function(result) {
	    var geo = JSON.parse(result); 
    	// console.log(geo);
    	if(r.type == 'Polygon' || r.type=='MultiPolygon') {
    		gCollection[r.shapefile] = L.geoJson(geo, {
			    style: function (feature) {
			        return {
			        	stroke: false,
			        	fillColor: r.color,
			        	fillOpacity: 0.6,
			        	renderer: myRenderer
			        };
			    }
			}).bindTooltip(`${r.name}`);

    	} else {
    		gCollection[r.shapefile] = L.geoJson(geo, {
			    style: function (feature) {
			        return {
			        	stroke: true,
			        	color: r.color,
			        	weight: 3,
			        	opacity: 0.6,
			        	renderer: myRenderer
			        };
			    }
			}).bindTooltip(`${r.name}`);
    	}
    	planLayer.addLayer(gCollection[r.shapefile]);
    	gLoadedFiles.add(r);
    	gVisibleLayers.add(r);
    })
    .fail(function(jqXHR, textStatus, errorThrown) { 
    	console.log(jqXHR);
    	console.log(textStatus);
    });
}


function tabulatorRedraw() {
	;
}