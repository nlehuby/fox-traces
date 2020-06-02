function open_new_track_page() {
    window.location.href = "track.html";
}


if (!localStorage["traces"]) {
    localStorage.setItem("traces", "[]");
}
var traces = JSON.parse(localStorage['traces']);
traces = traces.reverse()
display_traces_list()

update_auth_visual_return()


function display_traces_list() {
    document.getElementById('traces_list').innerHTML = "";

    for (var i = 0; i < traces.length; ++i) {
        var track = traces[i];
        var content = `
        <div class="w3-panel w3-white w3-card w3-display-container">
            <h4> <transport-thumbnail data-transport-mode="${track['info']['mode'] }" data-transport-network="${track['info']['network'] }" data-transport-line-code="${track['info']['ref'] }" data-transport-line-color="red" data-transport-destination="${track['info']['destination'] }">
             </transport-thumbnail></h4>
            <p>~ ${track['info']['duration'] } min - ${track['stops'].length } stops 🚏</p>
            <button class="w3-button w3-blue" onclick="download_a_track('${i}')">Download</button>
            `
            if (track["osm_status"]){
                
                content += `<a class="w3-button w3-blue" href="${track['osm_status']['track_url']}" target="_blank">See on OSM.org</a> `
            } else {
                content += `<button class="w3-button w3-blue" onclick="send_a_track_to_osm('${i}')">Send to OSM</button>`

            }
            content += `<a href="#" onclick="delete_a_track('${i}')">Delete</a>
            <p></p>
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

async function send_a_track_to_osm(track_id) {
    var track = traces[track_id];
    if (track['coords']) {
        const formData = new FormData();
        var blob = new Blob([save_track_as_gpx(track)], { type: "text/xml"});
        formData.append('file', blob);
        var description = `${track['info']['mode']} ${track['info']['ref']}${(track['info']['destination'] ? ' to ' + track['info']['destination'] : ' ')}`;      
        formData.append('description', description);
        formData.append('tags', `fox-traces, ${track['info']['mode']} route`);
        formData.append('visibility', 'identifiable');

        let response = await fetch('https://api.openstreetmap.org/api/0.6/gpx/create', {
            method: 'POST',
            headers: {"Authorization": `${osm_authentication.get_authorization()}`},
            body: formData
          });
      
        let result = await response.text();

        if (isNaN(parseInt(result))){
            alert("upload fail")
            console.error(result)
        } else {
              alert("Your track has been sent to OSM, you will receive an email when the processing will be done")
              var user = osm_authentication.get_user_name();
              var track_url = `https://www.openstreetmap.org/user/${user}/traces/${result}`;
              track["osm_status"] = {"sent":true, "track_url": track_url}
              localStorage.setItem("traces", JSON.stringify(traces));
              display_traces_list()
        }
    }
}

function delete_a_track(track_id) {
    traces.splice(track_id, 1)
    localStorage.setItem("traces", JSON.stringify(traces));
    display_traces_list()
}

function save_track_as_gpx(track) {
    var out = "";
    out += '<?xml version="1.0" encoding="UTF-8" ?>' + "\n\n";
    out += '<gpx version="1.0" creator="Fox traces" xmlns="http://www.topografix.com/GPX/1/0">' + "\n";
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
        //add a fake stop with other metadata
        var i = track.stops.length - 1
        out += `
  <wpt lat="${track.stops[i].position.coords.latitude}" lon="${track.stops[i].position.coords.longitude}">
        <time>${ convert_timestamp(track.stops[i].position.time)}</time>
        <name>Metadata: ${track.info.mode || ""} ${track.info.ref || ""} - ${track.info.origin || ""} -${track.info.destination || ""} - frequency :${track.info.frequency || ""} - price: ${track.info.fare || ""} </name>

  </wpt> \n
  `
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


// handle osm authentication
function close_logout_modal() {
    document.getElementById('OSM_auth_modal').style.display = 'none';
}

document.getElementById('OSM_authenticate').onclick = function() {
    document.getElementById('OSM_auth_modal').style.display = 'block';
};

document.getElementById('OSM_logout').onclick = function() {
    osm_authentication.logout();
    close_logout_modal();
    update_auth_visual_return()
};
document.getElementById('OSM_login').onclick = function() {
    handle_osm_login_form();
    update_auth_visual_return()
};

async function update_auth_visual_return() {
    var is_osm_authenticated_result = await osm_authentication.status();
    if (is_osm_authenticated_result["is_authenticated"]) {
        document.getElementById('alert_no_auth').style.display = 'none';
        document.getElementById('alert_auth').style.display = 'block';
        document.getElementById('osm_login_form').style.display = 'none';
        document.getElementById('osm_logout_form').style.display = 'block';
        document.getElementById('OSM_user').innerHTML = is_osm_authenticated_result["user_name"];
    } else {
        document.getElementById('alert_auth').style.display = 'none';
        document.getElementById('alert_no_auth').style.display = 'block';
        document.getElementById('osm_logout_form').style.display = 'none';
        document.getElementById('osm_login_form').style.display = 'block';
        if (is_osm_authenticated_result["error"]){
            console.error(is_osm_authenticated_result["error"])
        }    
    }
}

function handle_osm_login_form(){
    var osm_user = document.getElementById('osm_username_input').value;
    var osm_pswd = document.getElementById('osm_pswd_input').value;
    osm_authentication.login(osm_user,osm_pswd);
    close_logout_modal();
}
