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
    "comment": ""
};
var passenger_count = 0;

var tracking_status_div = document.getElementById("tracking_status");

var geoloc_options = {
    enableHighAccuracy: true,
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
    tracking_status_div.textContent += " (accuracy:  " + position.coords.accuracy + " )";
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
    track_info['comment'] = document.getElementById('track_comment').value;

    //add info to local_storage ? TODO

    // display track name in main window
    var track_name = document.getElementById("track_name");
    track_name.textContent = `${track_info['mode'] } - ${track_info['ref'] }`

}

function add_stop() {
    document.getElementById('stop_name').value = "";
    document.getElementById('stop_passenger_up').value = 0;
    document.getElementById('stop_passenger_total').value = passenger_count;
    document.getElementById('stop_passenger_down').value = 0;
    document.getElementById('stop_type').value = "";
    $('#StopModal').modal('show');
}

function save_stop_info() {
    new_stop = {}
    new_stop['position'] = last_recorded_position;

    new_stop['name'] = document.getElementById('stop_name').value;
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
