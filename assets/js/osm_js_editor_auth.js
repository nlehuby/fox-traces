function basic_auth(){
        return "Basic " + btoa("nickname" + ":" + "you-will-never-guess");
}

var auth = osmAuth({
    oauth_secret: '86Qk3kX42MOM6IPmx1tz1VpkgIAfnhRQRBIyDbc2',
    oauth_consumer_key: 'reniJXFiuqbRLg8lCjtLD60aMlXB8WjCdMCtd60q',
    landing: 'land.html',
    url: 'https://www.openstreetmap.org'
});
