var gGPSWakeLock;
var gGeoWatchID;
var last_recorded_position;
var current_track = [];
var track_stops = [];
var track_info = {
    "mode": "",
    "ref": "",
    "origin": "",
    "destination": "",
    "operator": "",
    "network": "",
    "fare": "",
    "comment": "",
    "duration": "",
    "frequency":""
};
var passenger_count = 0;

var tracking_status_div = document.getElementById("tracking_status");

var geoloc_options = {
    //enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

start_gps_tracking();

function on_geoloc_success(position) {
    if (tracking_status_div.textContent) {
        tracking_status_div.textContent = "Recording";
    }
    // Coords spec: https://developer.mozilla.org/en/XPCOM_Interface_Reference/NsIDOMGeoPositionCoords
    var tPoint = {
        time: position.timestamp,
        coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            //altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            //altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
        }
    };
    if (current_track.length > 1) {
        var duration = Math.round((tPoint.time - current_track[0].time) / 1000);
        if (duration < 60) {
            tracking_status_div.textContent += " for  " + duration + " s";
        } else {
            tracking_status_div.textContent += " for  " + Math.round(duration / 60) + " min";
        }
    }
    tracking_status_div.textContent += " (accuracy:  " +Math.round( tPoint.coords.accuracy) + " )";
    // Only add point to track is accuracy is good enough.
    if (tPoint.coords.accuracy < 100000) { //TODO (100 ?)
        current_track.push(tPoint);
    }
    last_recorded_position = tPoint;



}

function start_gps_tracking() {
    if (navigator.geolocation) {
        tracking_status_div.textContent = "Establishing Position";
        if (navigator.requestWakeLock) {
            gGPSWakeLock = navigator.requestWakeLock("gps");
        }
        gGeoWatchID = navigator.geolocation.watchPosition(on_geoloc_success, display_error, geoloc_options);
    }
}

function stop_gps_tracking() {
    if (tracking_status_div.textContent) {
        tracking_status_div.textContent = "Tracking ended";
    }
    if (navigator.requestWakeLock && gGPSWakeLock) {
        gGPSWakeLock.unlock();
    } else {
        console.error("no WakeLock")
    }
    navigator.geolocation.clearWatch(gGeoWatchID);
    var duration = (current_track[current_track.length-1].time - current_track[0].time) / 1000;
    track_info["duration"] = Math.round(duration / 60);
}

function display_error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
}

function end_track() {
    stop_gps_tracking();
    persist_track();

    window.location.href = "index.html";

}

function edit_track_info() {
    //fill modal
    document.getElementById('track_ref').value = track_info['ref'];
    document.getElementById('track_origin').value = track_info['origin'];
    document.getElementById('track_destination').value = track_info['destination'];
    document.getElementById('track_operator').value = track_info['operator'];
    document.getElementById('track_network').value = track_info['network'];
    document.getElementById('track_fare').value = track_info['fare'];
    document.getElementById('track_frequency').value = track_info['frequency'];
    document.getElementById('track_comment').value = track_info['comment'];

    //display modal
    $('#TrackInfoModal').modal('show');
}

function save_track_info() {
    track_info['mode'] = document.getElementById('track_mode').value;
    track_info['ref'] = document.getElementById('track_ref').value;
    track_info['origin'] = document.getElementById('track_origin').value;
    track_info['destination'] = document.getElementById('track_destination').value;
    track_info['operator'] = document.getElementById('track_operator').value;
    track_info['network'] = document.getElementById('track_network').value;
    track_info['fare'] = document.getElementById('track_fare').value;
    track_info['frequency'] = document.getElementById('track_frequency').value;
    track_info['comment'] = document.getElementById('track_comment').value;

    // display track name in main window
    var track_name = document.getElementById("track_name");
    track_name.innerHTML = ` <transport-thumbnail
    data-transport-mode="${track_info['mode'] }" data-transport-network="${track_info['network'] }" data-transport-line-code="${track_info['ref'] }" data-transport-line-color="red" data-transport-destination="${track_info['destination'] }">
</transport-thumbnail>`
}

function add_stop() {
    document.getElementById('stop_name').value = "";
    document.getElementById('stop_passenger_up').value = 0;
    document.getElementById('stop_passenger_total').value = passenger_count;
    document.getElementById('stop_passenger_down').value = 0;
    var stop_types = document.getElementById('form_for_stop_types')
    if (track_info['mode'] == "bus") {
        stop_types.style.display = "block";
    } else {
        stop_types.style.display = "none";
    }
    $('#StopModal').modal('show');
}

function save_stop_info() {
    new_stop = {}
    new_stop['position'] = last_recorded_position;

    new_stop['name'] = document.getElementById('stop_name').value;
    if (document.getElementById("inlineRadio1").checked) {
        new_stop['name'] += " ( simple pole )"
    }
    if (document.getElementById("inlineRadio2").checked) {
        new_stop['name'] += " ( with shelter )"
    }
    if (document.getElementById("inlineRadio3").checked) {
        new_stop['name'] += " ( no signage )"
    }

    new_stop['passenger_up'] = document.getElementById('stop_passenger_up').value;
    new_stop['passenger_down'] = document.getElementById('stop_passenger_down').value;
    passenger_count += new_stop['passenger_up'] - new_stop['passenger_down'];
    new_stop['passenger_total'] = passenger_count;

    document.getElementById('passengers_count').textContent = passenger_count;

    track_stops.push(new_stop);
}

function add_incident() {
    add_stop() //TODO
}

function persist_track() {
    var full_track = {
        "info": track_info,
        "coords": current_track,
        "stops": track_stops
    }
    if (!localStorage["traces"]) {
        localStorage.setItem("traces", "[]");
    }
    var traces = JSON.parse(localStorage['traces']);
    traces.push(full_track);
    localStorage.setItem("traces", JSON.stringify(traces));
}
