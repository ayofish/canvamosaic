function getSvgUrlRecursive(mosaicTile, currIndex, totalTilesCount, mosaic, rowIndex) {
    //the current tile
    if (currIndex === totalTilesCount) {
        // this._onTileSVGURLLoaded();
        self.postMessage(mosaic);
        close();
    } else {
        httpGet("/color/" + mosaicTile.hex).then(function(response) {
            currIndex++;
            mosaicTile.svgTextXml = response;
            // mosaicTile.svgUrl = getSvgUrl(response);
            getSvgUrlRecursive(mosaic[currIndex], currIndex, totalTilesCount, mosaic, rowIndex);
        }).catch(function(err){
            self.postMessage(err);
        });
    }
}

// function getSvgUrl(svgtext) {
//     var blob = new Blob([svgtext], { type: 'image/svg+xml;charset=utf-8' });
//     svgUrl = URL.createObjectURL(blob);
//     return svgUrl;
// }

function httpGet(url, data) {
    var promise = new Promise(function(resolve, reject) {
        //create an instance of the xmlhttprequest object
        var xhr = new XMLHttpRequest();
        //open the request with a get request
        xhr.open('GET', url);
        //send the request
        xhr.send(null);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                // Performs the function "resolve" when this.status is equal to 2xx
                resolve(xhr.response, data);
            } else {
                // Performs the function "reject" when this.status is different than 2xx
                reject(xhr.statusText, data);
            }
        };
    });
    return promise;
}

self.addEventListener('message', function(ev) {

    getSvgUrlRecursive.apply(self, ev.data);


    // self.postMessage(ev.data);
}, false);
