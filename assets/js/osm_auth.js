var osm_authentication = (function() {
    /*
        handle osm authentication with basic auth and localStorage.
    */
    if (!localStorage["osm"]) {
       localStorage.setItem("osm", "{}");
    }
    var osm_authenticate = JSON.parse(localStorage['osm']);

    return {
        login: function(user, pswd){
            osm_authenticate["token"]= btoa(`${user}:${pswd}`);
            osm_authenticate["user_name"]=user;
            console.log(osm_authenticate)
            localStorage.setItem("osm", JSON.stringify(osm_authenticate));
        },
        logout: function() {
            delete osm_authenticate["token"];
            localStorage.setItem("osm", JSON.stringify(osm_authenticate));
        },
        get_user_name: function() {
            return osm_authenticate["user_name"];
        },
        get_authorization: function() {
            return 'Basic ' + osm_authenticate["token"];
        },
        status: async function() {
            if (!osm_authenticate["token"]){
                return {"is_authenticated": false}
            }
            try {
                var response = await fetch('https://api.openstreetmap.org//api/0.6/user/details', {
                    method: 'GET',
                    headers: {"Authorization": `Basic ${osm_authenticate["token"]}`},
                  });
              
                var result = await response.text();
                if (result == "Couldn't authenticate you") {
                    return {"error": "Wrong user or password", "is_authenticated": false}
                }
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(result, "text/xml");
                var user = xmlDoc.getElementsByTagName('user')[0];
                var user_name = user.getAttribute('display_name');
                return {"user_name":user_name, "is_authenticated": true}
            } catch(err) {
                return {"error":err, "is_authenticated": false}
            }
        },
    }
}());
