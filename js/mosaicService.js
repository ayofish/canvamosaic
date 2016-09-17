/**
 * The mosaic service package is a module, it uses the revealing module pattern.
 * In this case the return are the contents of the Mosaic service package.
 * This bundles together all the needed logic for setting up the mosaic data based on the input image.
 * This is purely data manipulation
 * @param  {Object} Utils      The global utility class that holds the miscellaneous functions shared all over the project
 * @param  {Object} Url        The URL object
 * @return {Object}            The public methods for this module
 */
//dependency injection
var mosaicService = (function(Utils, Url) {

    /**
     * Static utility object for the mosaic serive
     * @type {Object}
     */
    var MosaicUtils = {
        /**
         * Converts a number to hex since the values of rgb are numbers and we need the hexidecimal value
         * @param  {[type]} number [description]
         * @return {[type]}        [description]
         */
        convertToHex: function(number) {
            //conver to a string hexidecimal value
            var str = number.toString(16);
            //if the string length is 1 return 0 + the string else return the converted string
            return str.length == 1 ? "0" + str : str;
        },
        /**
         * [getSvgUrl description]
         * @param  {string} svgtext [description]
         * @return {blob}           The blob url of the svg
         */
        getSvgUrl: function(svgtext) {
            // convert the svg xml text to a blob url
            var blob = new Blob([svgtext], { type: 'image/svg+xml;charset=utf-8' });
            //create the url for the svg
            svgUrl = URL.createObjectURL(blob);
            return svgUrl;
        }
    };

    /**
     * Constructor for the Mosaic Tile class
     * @param {Object} tileImageData The array of the tile image data from the tile on the canvas
     * @param {[type]} xCoord        The x coordinate of the tile on the image
     * @param {[type]} yCoord        The y coordinate of the tile on the image
     * @param {[type]} tileIndex     The index of the tile in the overall image data
     */
    var MosaicTile = function(tileImageData, xCoord, yCoord, tileIndex) {
        //initialize the values, just like any constructor
        this.tileIndex = tileIndex;
        this.tileImageData = tileImageData;
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.hex = "";
        this.svgTextXml = "";
        this.svgUrl = "";
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        return this;
    };

    //the prototype for the MosaicTile object, where the methods are declared
    MosaicTile.prototype = {
        /**
         * Sets the value of the class attrivbutes of r g b
         */
        setAverageRGB: function() {
            //initialize the values
            var i = -4;
            var pixelInterval = 5;
            var count = 0;
            var length = this.tileImageData.length;
            //loop on the pixels on the tile image
            while ((i += pixelInterval * 4) < length) {
                //count the total pixels
                count++;
                //lets set these vaklues, we can skip the 4th value
                this.r += this.tileImageData[i];
                this.g += this.tileImageData[i + 1];
                this.b += this.tileImageData[i + 2];
            }

            //get the floor values of the result so as to give us a whole number all the time
            //the average of each color is the quotient of each value by the total number of pixels
            this.r = Math.floor(this.r / count);
            this.g = Math.floor(this.g / count);
            this.b = Math.floor(this.b / count);

        },
        /**
         * Set the value for the hex property in the class.
         * Convert each value of r g b to hexidecimal
         */
        setAverageHex: function() {
            //us the static function in the MosaicUtils object to convert this
            this.hex = MosaicUtils.convertToHex(this.r) + MosaicUtils.convertToHex(this.g) + MosaicUtils.convertToHex(this.b);
        },
        /**
         * Returns just the bare data needed from this class
         * We are using web workers so the methods are not used anymore
         * @return {Object} The class properties
         */
        getData: function() {
            return {
                tileIndex: this.tileIndex,
                hex: this.hex,
                svgUrl: this.svgUrl,
                svgTextXml: this.svgTextXml,
                xCoord: this.xCoord,
                yCoord: this.yCoord
            };
        }
    };

    /**
     * The constructor for the Mosaic Class
     * @param {Object} canvasContext The context from the preview canvas
     * @param {number} tileWidth     The tile width
     * @param {number} tileHeight    The tile height
     */
    var Mosaic = function(canvasContext, tileWidth, tileHeight) {
        //initialize the values
        this.canvasContext = canvasContext;
        this.imageData = null;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        //set the column tiles count based on the rounded value of the quotient between the tile width and the the canvas width
        this.columnTilesCount = Math.floor(this.canvasContext.canvas.width / this.tileWidth);
        //set the row tiles count based on the rounded value of the quotient between the tile height and the the canvas height
        this.rowTilesCount = Math.floor(this.canvasContext.canvas.height / this.tileHeight);
        //total tiles counter
        this.totalTiles = 0;
        //holds the mosaicData formatted for the uiHandler to render later as rows of the mosaic data
        this.mosaicData = [];
        //the raw mosaic data
        this.mosaic = [];
        return this;
    };

    //the prototype for the Mosaic object, where the methods are declared
    Mosaic.prototype = {
        /**
         * Get the image data from the canvas
         * @return {Object} array of image data of the colors in the canvas
         */
        _getImageData: function() {
            if (this.imageData === null) {
                this.imageData = this.canvasContext.getImageData(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
            }
            return this.imageData;
        },

        /**
         * [_getTileImageData description]
         * @param  {[type]} xCoord        [description]
         * @param  {[type]} yCoord        [description]
         * @param  {[type]} fullImageData [description]
         * @return {[type]}               [description]
         */
        _getTileImageData: function(xCoord, yCoord, fullImageData) {
            var data = [];
            var tileWidth = this.tileWidth;
            var tileHeight = this.tileHeight;
            for (var x = xCoord; x < (xCoord + tileWidth); x++) {
                var xPos = x * 4;
                for (var y = yCoord; y < (yCoord + tileHeight); y++) {
                    var yPos = y * this.canvasContext.canvas.width * 4;
                    data.push(
                        fullImageData.data[xPos + yPos + 0],
                        fullImageData.data[xPos + yPos + 1],
                        fullImageData.data[xPos + yPos + 2],
                        fullImageData.data[xPos + yPos + 3]
                    );
                }
            }

            return data;
        },

        /**
         * [getMosaicData description]
         * @param  {[type]} callBack [description]
         * @return {[type]}          [description]
         */
        getMosaicData: function(callBack) {
            //reference to the current object instance
            var that = this;
            //get the values and store as local values to avoid too much lookup on the object itself
            var mosaic = [];
            var imageData = this._getImageData();
            var rowTilesCount = this.rowTilesCount;
            var columnTilesCount = this.columnTilesCount;
            var tileHeight = this.tileHeight;
            var tileWidth = this.tileWidth;
            //create a promise so as to return a response to the call and make it async
            var getMosaicDataPromise = new Promise(function(resolve, reject) {
                //loop on the number of rows to get the y coordinates
                for (var a = 0; a < rowTilesCount; a++) {
                    //loop at the number of column tiles to get the x coordinates
                    for (var b = 0; b < columnTilesCount; b++) {
                        //multiply the x and y coordinates by the tile height and width
                        var yCoord = a * tileHeight;
                        var xCoord = b * tileWidth;
                        //get the image data per tile
                        var tileImageData = that._getTileImageData(xCoord, yCoord, imageData);
                        //instanciate a mosaic tile object instance
                        var mosaicTile = new MosaicTile(tileImageData, xCoord, yCoord, that.totalTiles);
                        //set the rgb values
                        mosaicTile.setAverageRGB();
                        //set the hex value
                        mosaicTile.setAverageHex();
                        //count the total tiles, we'll need that later to resolve this promise
                        that.totalTiles++;
                        //push the mosaicTile object data, just the bare data into an array
                        //We don't need the methods or some of the properties anymore, just the bare data for the worker
                        mosaic.push(mosaicTile.getData());
                    }
                }

                that.mosaic = mosaic;
                that._setTilesSvgUrl(resolve);
            });

            return getMosaicDataPromise;
        },

        /**
         * Creates the workers and retrieves the svg from the server
         * @param {function} callBack The callBack function, in this case the resolve callback from the promise
         */
        _setTilesSvgUrl: function(callBack) {
            //reference to the current class instance
            var that = this;
            //create an array to store the workers
            var workers = [];
            //a local total tiles counter to match with the total tiles class attribute
            var totalTiles = 0;
            //Determines the total number of workers to be created
            //In my debug by using the timeline function in the developer tools, 3 is a good number, not much diff from 4, or 10 workers
            //we don't want too many
            var numWorkers = 3;
            //The number of tiles each worker will be working on, let's round it up just because it's safer with a round up than a round down in this case
            var tilesPerWorker = Math.ceil(this.mosaic.length / numWorkers);
            //local variable holding the mosaic tiles
            var mosaicTiles = this.mosaic;
            //the iterator for the worker allocation later
            var iter = 0;
            //let's create the workers
            for (var z = 0; z < numWorkers; z++) {
                workers.push(new Worker("js/mosaicTileWorker.js"));
            }
            //loop through the mosaic tiles and distribute the allocated tiles to the workers as chunks of the array
            for (var i = 0; i < mosaicTiles.length; i += tilesPerWorker) {
                //get a worker from the array of workers
                var worker = workers[iter];
                //increment by 1 so as to use the next worker in the queue in the next iteration of the loop
                iter++;
                //slice up the worker tiles into chunks
                var workerTiles = mosaicTiles.slice(i, i + tilesPerWorker);
                //send the message to the workers to start working
                worker.postMessage([workerTiles[0], 0, workerTiles.length, workerTiles]);
                //listen to the event when the workers finally finish working on their tiles
                worker.addEventListener('message', function(ev) {
                    //loop on the tiles from the worker
                    for (var x = 0; x < ev.data.length; x++) {
                        var mosaicTileData = ev.data[x];
                        //get the svg url based on the svg text retrieved from the ajax request on the worker
                        mosaicTileData.svgUrl = MosaicUtils.getSvgUrl(mosaicTileData.svgTextXml);
                        //set it in the mosaic class attribute by overwriting the tile in that same index
                        that.mosaic[mosaicTileData.tileIndex] = mosaicTileData;
                        //count the tiles
                        totalTiles++;
                    }
                    //if the tiles are all accounted for then call the function to organize those into rows
                    if (totalTiles === that.totalTiles) {
                        that._onTileSVGURLLoaded(callBack);
                    }
                }, false);
            }
        },

        /**
         * Organizes the tiles into rows for the mosaic to render later
         * @param  {function} callBack The resolve callback from the promise
         * @return {void}
         */
         _onTileSVGURLLoaded: function(callBack) {
            var mosaicTiles = this.mosaic;
            var mosaicRows = [];
            //loop through the tiles as chunks
            for (var i = 0; i < mosaicTiles.length; i += this.columnTilesCount) {
                //slice it up as rows
                mosaicRows.push(mosaicTiles.slice(i, i + this.columnTilesCount));
            }
            //set it in the class attribute
            this.mosaicData = mosaicRows;
            //resolve the promise
            callBack(this.mosaicData);
        }
    };

    //Reveal the public functions, in this case the objects that need to be used in the other class or for testing later
    return {
        "Mosaic": Mosaic,
        "MosaicTile": MosaicTile,
        "Utils": MosaicUtils
    };
})(Utils, window.URL);
