// map.js
// started 14.6.19

// ######################################
/* 1. GLOBAL VARIABLES */
const STARTLOCATION = [28.6, 77.1];
const BOUNDS = [[27.7,75.5], [29.5,78.5]];

// map crosshair size etc:
const crosshairPath = 'lib/focus-black.svg';
const crosshairSize = 30;


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

var baseLayers = { 
    "CartoDB Light": cartoPositron, 
    "CartoDB Dark": cartoDark, 
    "OpenStreetMap.org" : OSM, 
    "CartoDB Voyager":cartoVoyager, 
    "ESRI Satellite": esriWorld, 
    "gStreets": gStreets, 
    "gHybrid": gHybrid };

var map = new L.Map('map', {
    center: STARTLOCATION,
    zoom: 10,
    layers: [cartoPositron],
    scrollWheelZoom: true,
    maxZoom: 20,
    minZoom: 10,
    maxBounds: BOUNDS,
    maxBoundsViscosity: 0.5
});

var sidebar = L.control.sidebar('sidebar').addTo(map);

$('.leaflet-container').css('cursor','crosshair'); // from https://stackoverflow.com/a/28724847/4355695 Changing mouse cursor to crosshairs

L.control.scale({metric:true, imperial:false}).addTo(map);


// map panes
map.createPane('planPane'); map.getPane('planPane').style.zIndex = 540;
map.createPane('linePane'); map.getPane('linePane').style.zIndex = 550;
map.createPane('submittedPane'); map.getPane('submittedPane').style.zIndex = 610;
map.createPane('approvedPane'); map.getPane('approvedPane').style.zIndex = 620;

// layers
var planLayer = new L.layerGroup(null, {pane: 'planPane'});
var submittedLayer = new L.layerGroup(null, {pane: 'submittedPane'});
var approvedLayer = new L.layerGroup(null, {pane: 'approvedPane'});

// SVG renderer
var myRenderer = L.canvas({ padding: 0.5, pane: 'planPane' });
// var myRendererLine = L.canvas({ padding: 0.5, pane: 'linePane' });


var overlays = {
    "Draft Plan": planLayer,
    "Submitted Inputs": submittedLayer,
    "Approved Inputs": approvedLayer
};
planLayer.addTo(map);

var layerControl = L.control.layers(baseLayers, overlays, {collapsed: true, autoZIndex:false}).addTo(map); 

// Add in a crosshair for the map. From https://gis.stackexchange.com/a/90230/44746
var crosshairIcon = L.icon({
    iconUrl: crosshairPath,
    iconSize:     [crosshairSize, crosshairSize], // size of the icon
    iconAnchor:   [crosshairSize/2, crosshairSize/2], // point of the icon which will correspond to marker's location
});
crosshair = new L.marker(map.getCenter(), {icon: crosshairIcon, interactive:false});
crosshair.addTo(map);
// Move the crosshair to the center of the map when the user pans
map.on('move', function(e) {
    var currentLocation = map.getCenter();
    crosshair.setLatLng(currentLocation);
    if(map.getZoom() <= 13) {
        $('#latlong').html(`Zoom in for a proper location`);
        document.getElementById('submitButton').disabled = true;    
    } else {
        $('#latlong').html(`${currentLocation.lat.toFixed(4)},${currentLocation.lng.toFixed(4)}`);
        document.getElementById('submitButton').disabled = false;
    }
});

// lat, long in url
var hash = new L.Hash(map);


// ######################################
// RUN ON PAGE LOAD

$(document).ready(function() {
    
    setTimeout(function () {
        sidebar.open('home');
    }, 500);
    resetForm();
    loadCSV();
    fetchInputs();

});

// ######################################
// FUNCTIONS

function loadCSV() {
    csvFile = './config/draftmpd41_layers.csv';
    // $('#status').html(`Loading..`);
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
            // $('#status').html(`Could not load ${csvFile}`);
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
            "name": `${r.name} <span style="background-color: ${r.color}; float: left; width: 20px; height: 80%; margin: 5px; "></span>`,
            "shapefile": r.shapefile,
            "color": r.color,
            "type": r.type,
            "origname": r.name
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

    // Auto-select one layer
    setTimeout(function () {
        autoSelected = ['Recreational -1'];
        // autoSelected = ['Government','Recreational -1','Residential'];
        data.forEach(r => {
            if( autoSelected.includes(r.name) ) {
                document.querySelectorAll(`[data-id="${r.shapefile}"] > a`)[0].click();
            }
        });
    }, 1000);
    
    // $('#status').html(`Loaded layers`);
}

function updateMapLayers(selectedLayers) {
    // filtering out group names
    var newSelection = new Set();
    selectedLayers.forEach(r => {
        if(r.type=='grouping') return;
        console.log(r.shapefile);
        newSelection.add(r);
    });
    // console.log('newSelection', newSelection);
    
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
    $.getJSON(filename)
    .done(function(geo) {
        // var geo = JSON.parse(result); 
        // console.log(geo);
        if(r.type == 'Polygon' || r.type=='MultiPolygon') {
            gCollection[r.shapefile] = L.geoJson(geo, {
                style: function (feature) {
                    return {
                        stroke: true,
						color: '#000000',
						opacity: 0.5,
						weight: 0.5,
                        fillColor: r.color,
                        fillOpacity: 0.6,
                        renderer: myRenderer
                    };
                }
            }).bindTooltip(`${r.origname}`, {sticky:true, opacity:0.5})
            .bindPopup(`${r.origname}<br>Group: ${r.pid}`, {sticky:true, opacity:0.5});

        } else {
            gCollection[r.shapefile] = L.geoJson(geo, {
                style: function (feature) {
                    return {
                        stroke: true,
                        color: r.color,
                        weight: 3,
                        opacity: 0.6
                        // renderer: myRendererLine
                    };
                }
            }).bindTooltip(`${r.origname}`, {sticky:true, opacity:0.5})
            .bindPopup(`${r.origname}<br>Group: ${r.pid}`, {sticky:true, opacity:0.5});
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


function mapInputs(data) {
    
    $('#approvedNum').html(data.approved.length);
    $('#submittedNum').html(data.submitted.length + data.approved.length);

    var circleMarkerOptions_submit = {
        // renderer: myRenderer,
        radius: 5,
        fillColor: 'yellow',
        color: 'gray',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'submittedPane'
    };

    data.submitted.forEach(r => {
        let lat = parseFloat(r.lat);
        let lon = parseFloat(r.lon);
        let tooltipContent = `${r.category} | ${r.name}`;
        var marker = L.circleMarker([lat,lon], circleMarkerOptions_submit)
            .bindTooltip(tooltipContent, {direction:'top', offset: [0,-5]});
        marker.properties = r;
        marker.addTo(submittedLayer);
        marker.on('click', function() {
            var content = `<p>Category: <b>${r.category}</b></br>
            <div class="alert alert-secondary">${r.message}</div>
            Shared by: <b>${r.name}</b><br>
            <small>Shared on ${r.created_on}</b><br>
            Location: ${lat},${lon} <small><button class="btn btn-link" onclick="map.panTo([${lat},${lon}])">go there</button></small><br>
            ID: ${r.mid}<br><br>
            <span class="alert alert-warning">Not approved yet</span>
            </small></p>
            `;
            $('#displayMessage').html(content);

            map.panTo([lat,lon]);
            sidebar.open('messages');
        });

    });
    if (!map.hasLayer(submittedLayer)) map.addLayer(submittedLayer);

    var circleMarkerOptions_approved = {
        // renderer: myRenderer,
        radius: 5,
        fillColor: 'blue',
        color: 'gray',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'approvedPane'
    };

    data.approved.forEach(r => {
        let lat = parseFloat(r.lat);
        let lon = parseFloat(r.lon);
        let tooltipContent = `${r.category} | ${r.name}`;
        var marker = L.circleMarker([lat,lon], circleMarkerOptions_approved)
            .bindTooltip(tooltipContent, {direction:'top', offset: [0,-5]});
        marker.properties = r;
        marker.addTo(approvedLayer);
        marker.on('click', function() {
            var content = `<p>Category: <b>${r.category}</b></br>
            <div class="alert alert-secondary">${r.message}</div>
            Shared by: <b>${r.name}</b><br>
            <small>Shared on ${r.created_on}</b><br>
            Location: ${lat},${lon} <small><button class="btn btn-link" onclick="map.panTo([${lat},${lon}])">go there</button></small><br>
            ID: ${r.mid}<br><br>
            <span class="alert alert-success">Approved by mods</span>
            </small></p>
            `;
            $('#displayMessage').html(content);

            map.panTo([lat,lon]);
            sidebar.open('messages');
        });

    });
    if (!map.hasLayer(approvedLayer)) map.addLayer(approvedLayer);


    $('#fetchInputs_status').html(`Citizens Inputs loaded.`);
}
