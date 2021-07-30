// print.js

cartoPositron.on('loading', function (event) {
	console.log("tiles loading");
});

cartoPositron.on('load', function (event) {
	console.log("tiles loaded");
});

map.on('resize', function (event) {
	console.log("map resized");
});

function changeDimensions(reset=false) {
	var w = parseInt($(`.width`).val());
    var h = parseInt($(`.height`).val());
    console.log(w,h);
    $(`.page`).css('width',`${w}px`);
    $(`.page`).css('height',`${h}px`);

    map.invalidateSize();
    // from https://stackoverflow.com/questions/24412325/resizing-a-leaflet-map-on-container-resize 
    //Checks if the map container size changed and updates the map if so — call it after you've changed the map size dynamically
    
}

function changeColor() {

}

function zoomFit(){
	map.fitBounds(planLayer.getBounds(), {padding:[5,5], maxZoom:17});
}
