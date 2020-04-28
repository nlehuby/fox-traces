function open_new_track_page() {
    window.location.href = "track.html";
}

update_auth_visual_return()

if (!localStorage["traces"]) {
    localStorage.setItem("traces", "[]");
}
var traces = JSON.parse(localStorage['traces']);
traces = traces.reverse()
display_traces_list()




//connexion Oauth
document.getElementById('OSM_authenticate').onclick = function() {
    auth.authenticate(function() {
        console.log("authenfication terminée")
        update_auth_visual_return()
    });
};
document.getElementById('OSM_logout').onclick = function() {
    auth.logout();
    console.log("déconnexion en cours");
    update_auth_visual_return()
};


function display_traces_list() {
    document.getElementById('traces_list').innerHTML = "";

    for (var i = 0; i < traces.length; ++i) {
        var track = traces[i];
        var content = `
           <div class="card">
             <div class="card-header">
             <transport-thumbnail data-transport-mode="${track['info']['mode'] }" data-transport-network="${track['info']['network'] }" data-transport-line-code="${track['info']['ref'] }" data-transport-line-color="red" data-transport-destination="${track['info']['destination'] }">
             </transport-thumbnail>
             </div>
             <div class="card-body">
               <p class="card-text">${track['stops'].length } stops 🚏</p>
               <a href="#" class="btn btn-primary" onclick="download_a_track('${i}')">Download</a> <a href="#" class="btn btn-primary" onclick="send_a_track_to_osm('${i}')">Send to OSM</a><a href="#" onclick="delete_a_track('${i}')">Delete</a>
             </div>
           </div>
           `;

        document.getElementById('traces_list').innerHTML += content;
    }
}

function download_a_track(track_id) {
    var track = traces[track_id];
    if (track['coords']) {
        var outDataURI = "data:application/gpx+xml," +
            encodeURIComponent(save_track_as_gpx(track));
        window.open(outDataURI, 'GPX Track');
    }
}

function send_a_track_to_osm(track_id) {
    alert("not implemeted yet") // TODO
}

function delete_a_track(track_id) {
    traces.splice(track_id, 1)
    localStorage.setItem("traces", JSON.stringify(traces));
    display_traces_list()
}

function save_track_as_gpx(track) {
    var out = "";
    out += '<?xml version="1.0" encoding="UTF-8" ?>' + "\n\n";
    out += '<gpx version="1.0" creator="Jungle Tracker" xmlns="http://www.topografix.com/GPX/1/0">' + "\n";
    if (track.info) {
        out += `
  <metadata>
    <desc>${track.info.mode || ""} - ${track.info.ref || ""} - ${track.info.destination || ""}</desc>
  </metadata> \n
  `
    }
    if (track.stops.length) {
        for (var i = 0; i < track.stops.length; i++) {
            out += `
      <wpt lat="${track.stops[i].position.coords.latitude}" lon="${track.stops[i].position.coords.longitude}">
            <time>${ convert_timestamp(track.stops[i].position.time)}</time>
            <name>${track.stops[i].name || ''}</name>
            <extensions>
                <passenger_up>${track.stops[i].passenger_up || ''}</passenger_up>
                <passenger_down>${track.stops[i].passenger_down || ''}</passenger_down>
                <passenger_total>${track.stops[i].passenger_total || ''}</passenger_total>
            </extensions>
      </wpt> \n
      `
        }
    }

    if (track.coords.length) {
        out += '  <trk>' + "\n";
        out += '    <trkseg>' + "\n";
        for (var i = 0; i < track.coords.length; i++) {
            if (track.coords[i].beginSegment && i > 0) {
                out += '    </trkseg>' + "\n";
                out += '    <trkseg>' + "\n";
            }
            out += '      <trkpt lat="' + track.coords[i].coords.latitude + '" lon="' +
                track.coords[i].coords.longitude + '">' + "\n";
            if (track.coords[i].coords.altitude) {
                out += '        <ele>' + track.coords[i].coords.altitude + '</ele>' + "\n";
            }
            out += '        <time>' + convert_timestamp(track.coords[i].time) + '</time>' + "\n";
            out += '      </trkpt>' + "\n";
        }
        out += '    </trkseg>' + "\n";
        out += '  </trk>' + "\n";
    }
    out += '</gpx>' + "\n";
    return out;
}

function convert_timestamp(some_timestamp) {
    // ISO time format is YYYY-MM-DDTHH:mm:ssZ
    var tsDate = new Date(some_timestamp);
    // Note that .getUTCMonth() returns a number between 0 and 11 (0 for January)!
    return tsDate.getUTCFullYear() + "-" +
        (tsDate.getUTCMonth() < 9 ? "0" : "") + (tsDate.getUTCMonth() + 1) + "-" +
        (tsDate.getUTCDate() < 10 ? "0" : "") + tsDate.getUTCDate() + "T" +
        (tsDate.getUTCHours() < 10 ? "0" : "") + tsDate.getUTCHours() + ":" +
        (tsDate.getUTCMinutes() < 10 ? "0" : "") + tsDate.getUTCMinutes() + ":" +
        (tsDate.getUTCSeconds() < 10 ? "0" : "") + tsDate.getUTCSeconds() + "Z";
}

//affichage du login OSM si connecté
function show_OSM_username() {
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, OSM_user_name_done);
}

function OSM_user_name_done(err, res) {
    if (err) {
        console.log(err);
        alert("Échec autour de l'authentification OSM")
        return;
    }
    var u = res.getElementsByTagName('user')[0];
    document.getElementById('OSM_user').innerHTML = u.getAttribute('display_name');

}

function update_auth_visual_return() {
    //affichage des bandeaux d'avertissement
    if (auth.authenticated()) {
        document.getElementById('alert_no_auth').style.display = 'none';
        document.getElementById('alert_auth').style.display = 'block';
        show_OSM_username();
    } else {
        document.getElementById('alert_auth').style.display = 'none';
        document.getElementById('alert_no_auth').style.display = 'block';
    }
}
