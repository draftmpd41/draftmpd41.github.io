// map.js
// started 14.6.19

// ######################################
/* 1. GLOBAL VARIABLES */
const STARTLOCATION = [28.6, 77.1];

var planLayer = new L.layerGroup();
var inputsLayer = new L.layerGroup();

var simTreeData = [];
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
                "name": r.group
            });
            groupsList.push(r.group);
		}
		row = {
            "id": r.shapefile,
            "pid": r.group,
            "name": `${r.name}`,
            "jsonFile": r.shapefile,
            "color": r.color,
            "type": r.type
        };
        simTreeData.push(row);
	}); // end of forEach loop
	console.log(simTreeData);
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

function updateMapLayers(item) {
	console.log(item);
}
function tabulatorRedraw() {
	;
}