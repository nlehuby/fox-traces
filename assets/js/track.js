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
    console.log(current_track)
}

function display_error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
}

function end_track() {
    stop_gps_tracking()
    //convertTrack("gpx")
    saveTrack();

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

function convertTrack(aTargetFormat) {
  var out = "";
  switch (aTargetFormat) {
    case "gpx":
      out += '<?xml version="1.0" encoding="UTF-8" ?>' + "\n\n";
      out += '<gpx version="1.0" creator="Jungle Tracker" xmlns="http://www.topografix.com/GPX/1/0">' + "\n";
      if (track_info) {
          out += `
          <metadata>
            <desc>${track_info.mode || ""} - ${track_info.ref || ""} - ${track_info.destination || ""}</desc>
          </metadata> \n
          `
      }
      if (track_stops.length){
          for (var i = 0; i < track_stops.length; i++) {
              out += `
              <wpt lat="${track_stops[i].position.coords.latitude}" lon="${track_stops[i].position.coords.longitude}">
                    <time>${ makeISOString(track_stops[i].position.time)}</time>
                    <name>${track_stops[i].name || ''}</name>
                    <extensions>
                        <passenger_up>${track_stops[i].passenger_up || ''}</passenger_up>
                        <passenger_down>${track_stops[i].passenger_down || ''}</passenger_down>
                        <passenger_total>${track_stops[i].passenger_total || ''}</passenger_total>
                    </extensions>
              </wpt> \n
              `
          }
      }

      if (current_track.length) {
        out += '  <trk>' + "\n";
        out += '    <trkseg>' + "\n";
        for (var i = 0; i < current_track.length; i++) {
          if (current_track[i].beginSegment && i > 0) {
            out += '    </trkseg>' + "\n";
            out += '    <trkseg>' + "\n";
          }
          out += '      <trkpt lat="' + current_track[i].coords.latitude + '" lon="' +
                                        current_track[i].coords.longitude + '">' + "\n";
          if (current_track[i].coords.altitude) {
            out += '        <ele>' + current_track[i].coords.altitude + '</ele>' + "\n";
          }
          out += '        <time>' + makeISOString(current_track[i].time) + '</time>' + "\n";
          out += '      </trkpt>' + "\n";
        }
        out += '    </trkseg>' + "\n";
        out += '  </trk>' + "\n";
      }
      out += '</gpx>' + "\n";
      break;
    case "json":
      out = JSON.stringify(current_track);
      break;
    default:
      break;
  }
  console.log(out)
  return out;
}

function makeISOString(aTimestamp) {
  // ISO time format is YYYY-MM-DDTHH:mm:ssZ
  var tsDate = new Date(aTimestamp);
  // Note that .getUTCMonth() returns a number between 0 and 11 (0 for January)!
  return tsDate.getUTCFullYear() + "-" +
         (tsDate.getUTCMonth() < 9 ? "0" : "") + (tsDate.getUTCMonth() + 1 ) + "-" +
         (tsDate.getUTCDate() < 10 ? "0" : "") + tsDate.getUTCDate() + "T" +
         (tsDate.getUTCHours() < 10 ? "0" : "") + tsDate.getUTCHours() + ":" +
         (tsDate.getUTCMinutes() < 10 ? "0" : "") + tsDate.getUTCMinutes() + ":" +
         (tsDate.getUTCSeconds() < 10 ? "0" : "") + tsDate.getUTCSeconds() + "Z";
}

function saveTrack() {
  if (current_track.length) {
    var outDataURI = "data:application/gpx+xml," +
                     encodeURIComponent(convertTrack("gpx"));
    window.open(outDataURI, 'GPX Track');
  }
}
