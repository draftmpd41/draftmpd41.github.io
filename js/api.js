// api.js - for all citizens inputs related functions

// if (window.location.host =="localhost:8000") APIpath = 'http://localhost:5610/API/';

function fetchInputs() {
    var payload = {};
    $('#fetchInputs_status').html("Loading Citizens Inputs..");
    $.ajax({
        url : `${APIpath}listInputs`,
        // xhrFields: {
        //     withCredentials: true
        // },
        type : 'POST',
        data : JSON.stringify(payload),
        cache: false,
        processData: false,    // tell jQuery not to process the data
        contentType: false,    // tell jQuery not to set contentType
        success : function(returndata) {
            // console.log(returndata);
            var data = JSON.parse(returndata);
            mapInputs(data);

        },
        error: function(jqXHR, exception) {
            console.log('error:',jqXHR.responseText);
            var response = JSON.parse(jqXHR.responseText);
            $(".submitStatus").html(response.message);
        }
    });
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

