// api.js - for all citizens inputs related functions

var APIpath = 'https://server2.nikhilvj.co.in/draftmpd41_backend/API/';

// if (window.location.host =="localhost:8000") APIpath = 'http://localhost:5610/API/';

function submitInput() {
    // declaration check
    if(! $("#declaration")[0].checked ) {
        alert('Please check On the declaration first.');
        return;
    }
    var currentLocation = map.getCenter();
    var payload = {
        "lat": parseFloat(currentLocation.lat.toFixed(6)),
        "lon": parseFloat(currentLocation.lng.toFixed(6)),
        "category": $('#category').val(),
        "message": $('#message').val(),
        "name": $('#name').val(),
        "email": $('#email').val(),
        "mobile": $('#mobile').val(),
        "consent": $("#consent")[0].checked
    };
    console.log(payload);

    $(".submitStatus").html("Saving to DB..");

    $.ajax({
        url : `${APIpath}addInput`,
        // xhrFields: {
        //     withCredentials: true
        // },
        type : 'POST',
        data : JSON.stringify(payload),
        cache: false,
        processData: false,    // tell jQuery not to process the data
        contentType: false,    // tell jQuery not to set contentType
        success : function(returndata) {
            console.log(returndata);
            var data = JSON.parse(returndata);
            $(".submitStatus").html(data.message);

            // reset stuff
            resetForm();
        },
        error: function(jqXHR, exception) {
            console.log('error:',jqXHR.responseText);
            var response = JSON.parse(jqXHR.responseText);
            $(".submitStatus").html(response.message);
        }
    });
}

function resetForm() {
    $('#category').val('');
    $('#message').val('');
    $('#name').val('');
    $('#email').val('');
    $('#mobile').val('');
    $('#category').val('');
    $("#declaration")[0].checked = false;
    $("#consent")[0].checked = false;
}

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

