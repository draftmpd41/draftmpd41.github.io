// print.js
// adapted from https://github.com/WRI-Cities/payanam/blob/master/js/print.js
// live example: https://payanam.factly.in/print.html?route=BDG/117L.json

cartoPositron.on('loading', function (event) {
	console.log("tiles loading");
	$('#tileStatus').html("Tiles loading, pls wait..");
});

cartoPositron.on('load', function (event) {
	console.log("tiles loaded");
	$('#tileStatus').html("Ok to print.")
});

map.on('resize', function (event) {
	console.log("map resized");
});

map.on('baselayerchange', function (event) {
	$('#tileStatus').html("Layer changed, tiles loading, pls wait..");

	// Track tiles loading, loaded status from https://stackoverflow.com/a/27379032/4355695
	event.layer.on('loading', function (event) {
		console.log("tiles loading");
		$('#tileStatus').html("Tiles loading, pls wait..");
	});
	event.layer.on('load', function (event) {
		console.log("tiles loaded");
		$('#tileStatus').html("Ok to print.")
	});
});

function changeDimensions(reset=false) {

	var w = parseInt($(`.width`).val());
    var h = parseInt($(`.height`).val());
    if(reset) {
		w = ORIG_W;
		h = ORIG_H;
		$(`.width`).val(w);
		$(`.height`).val(h);
	}
    $(`.page`).css('width',`${w}px`);
    $(`.page`).css('height',`${h}px`);

    map.invalidateSize();
    // from https://stackoverflow.com/questions/24412325/resizing-a-leaflet-map-on-container-resize 
    //Checks if the map container size changed and updates the map if so — call it after you've changed the map size dynamically
    
}

function changeColor() {
	var color = $(`.color`).val();

}

function zoomFit(){
	map.fitBounds(planLayer.getBounds(), {padding:[5,5], maxZoom:17});
}
