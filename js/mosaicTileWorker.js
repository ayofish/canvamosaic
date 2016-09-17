//This worker file handles the retrieval of the svg from the server
//It works faster this way and we use multiple threads

/**
 * Recursively gets the svg url from the server one at a time to avoid the insufficient resources error
 * @param  {Object} mosaicTile      Mosaic Tile data
 * @param  {[type]} currIndex       The current index used as the iterator
 * @param  {[type]} mosaic          [description]
 */
function getSvgUrlRecursive(mosaicTile, currIndex, mosaic) {
    //the current tile
    if (typeof mosaic[currIndex] === "undefined") {
        // this._onTileSVGURLLoaded();
        self.postMessage(mosaic);
        close();
    } else {
        httpGet("/color/" + mosaicTile.hex).then(function(response) {
            currIndex++;
            mosaicTile.svgTextXml = response;
            getSvgUrlRecursive(mosaic[currIndex], currIndex, mosaic);
        }).catch(function(err){
            self.postMessage(err);
        });
    }
}

/**
 * The function to make an ajax request
 * @param  {string} url
 * @return {Object}      The promise object
 */
function httpGet(url) {
    var promise = new Promise(function(resolve, reject) {
        //create an instance of the xmlhttprequest object
        var xhr = new XMLHttpRequest();
        //open the request with a get request
        xhr.open('GET', url);
        //send the request
        xhr.send(null);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
    });
    return promise;
}
//the event listener for the worker to start working
self.addEventListener('message', function(ev) {
    //apply the arguments that we recieve from the caller
    getSvgUrlRecursive.apply(self, ev.data);
}, false);
