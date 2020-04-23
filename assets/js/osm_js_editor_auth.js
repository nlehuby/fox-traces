function basic_auth(){
        return "Basic " + btoa("nickname" + ":" + "you-will-never-guess");
}

var auth = osmAuth({
    oauth_secret: 'fDsGn1eoIN5ZMBEtByqhLSk9SWqdlYiXZOj7EDov',
    oauth_consumer_key: 'cmF6HPd3zZnjep7y3FiOIZQ9Pbk8MsMWAKArKcgI',
    landing: 'land.html',
    url: 'https://www.openstreetmap.org'
});

