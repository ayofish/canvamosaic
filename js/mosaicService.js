var mosaicService = (function(Utils, Url, window) {
    var svgServiceUrl = "/color/";

    var MosaicUtils = {
        convertToHex: function(number) {
            var str = number.toString(16);
            return str.length == 1 ? "0" + str : str;
        },
        getSvgUrl: function(svgtext) {
            var blob = new Blob([svgtext], { type: 'image/svg+xml;charset=utf-8' });
            svgUrl = URL.createObjectURL(blob);
            return svgUrl;
        }
    };

    var MosaicTile = function(tileImageData, tileRowIndex, tileColumnIndex, xCoord, yCoord, tileIndex) {
        this.tileIndex = tileIndex;
        this.getSVGSUrlCallback = null;
        this.tileRowIndex = tileRowIndex;
        this.tileColumnIndex = tileColumnIndex;
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

    MosaicTile.prototype = {
        setAverageRGB: function() {
            var tileImageData = this.tileImageData;
            var i = 0,
                r = 0,
                g = 0,
                b = 0;
            //length of the tile image data
            var length = tileImageData.length;
            //per pixel there are 4 bits, one red, green, blue then alpha
            var numPixels = length / 4;
            while (i < length) { // calc this tile's color average
                //first bit is red
                r += tileImageData[i++];
                //second is green
                g += tileImageData[i++];
                //third is blue
                b += tileImageData[i++];
                //skip the 4th bit
                i++;
            }

            this.r = (r / numPixels) | 0;
            this.g = (g / numPixels) | 0;
            this.b = (b / numPixels) | 0;
        },
        setAverageHex: function() {
            this.hex = MosaicUtils.convertToHex(this.r) + MosaicUtils.convertToHex(this.g) + MosaicUtils.convertToHex(this.b);
        },
        getAverageRGB: function() {
            return {
                r: this.r,
                g: this.g,
                b: this.b
            };
        },

        getAverageHex: function() {
            // var hexColor = MosaicUtils.convertToHex(this.r) + MosaicUtils.convertToHex(this.g) + MosaicUtils.convertToHex(this.b);
            // return hexColor;
            return this.hex;
        },

        _onLoadGetSVGUrl: function(svgtext) {
            this.svgTextXml = svgtext;
            var blob = new Blob([svgtext], { type: 'image/svg+xml;charset=utf-8' });
            this.svgUrl = Url.createObjectURL(blob);
            this.getSVGSUrlCallback(this);
        },

        _onErrorGetSVGUrl: function(errorText) {
            console.log(errorText);
        },
        getSVGSUrl: function(callBack) {
            var that = this;
            this.getSVGSUrlCallback = callBack;
            Utils.httpGet(svgServiceUrl + this.getAverageHex())
                .then(function(svgtext) {
                    that._onLoadGetSVGUrl(svgtext);
                })
                .catch(function(errorText) {
                    that._onErrorGetSVGUrl(errorText);
                });
        }
    };


    /**
     * [Mosaic description]
     * @param {[type]} canvasContext [description]
     * @param {[type]} tileWidth     [description]
     * @param {[type]} tileHeight    [description]
     */
    var Mosaic = function(canvasContext, tileWidth, tileHeight) {
        this.getMosaicDataCallback = null;
        this.canvasContext = canvasContext;
        this.imageData = null;
        this.tileWidth = (!tileWidth ? 1 : tileWidth);
        this.tileHeight = (!tileHeight ? 1 : tileHeight);
        this.rowTilesCount = this.canvasContext.canvas.width / this.tileWidth;
        this.columnTilesCount = Math.floor(this.canvasContext.canvas.height / this.tileHeight);
        this.totalTiles = 0;
        this.mosaicData = [];
        this.mosaic = [];
        this.currTilesSvgLoaded = 0;
        return this;
    };

    Mosaic.prototype = {
        init: function() {

        },
        getImageData: function() {
            if (this.imageData === null) {
                this.imageData = this.canvasContext.getImageData(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
            }
            return this.imageData;
        },
        _onTileSVGURLLoaded: function() {
            var mosaicTiles = this.mosaic;
            var mosaicRows = [];
            for (var i = 0; i < mosaicTiles.length; i += this.rowTilesCount) {
                mosaicRows.push(mosaicTiles.slice(i, i + this.rowTilesCount));
            }
            this.mosaicData = mosaicRows;
            this.getMosaicDataCallback(this.mosaicData, this);
        },
        getMosaicData: function(callBack) {
            this.mosaicData = [];
            var mosaic = [];
            this.getMosaicDataCallback = callBack;
            var imageData = this.getImageData();
            var that = this;
            for (var a = 0; a < this.rowTilesCount; a++) {
                // var mosaicRowTiles = [];
                for (var b = 0; b < this.columnTilesCount; b++) {
                    var xCoord = a * this.tileWidth;
                    var yCoord = b * this.tileHeight;
                    var tileImageData = this._getTileImageData(xCoord, yCoord);
                    var mosaicTile = new MosaicTile(tileImageData, a, b, xCoord, yCoord, this.totalTiles);
                    mosaicTile.setAverageRGB();
                    mosaicTile.setAverageHex();
                    // mosaicRowTiles.push(mosaicTile);
                    this.totalTiles++;
                    mosaic.push(mosaicTile);
                }
                // mosaic.push(mosaicRowTiles);
            }

            // this._getTileSvgUrl();
            var mosaicTilesTotal = mosaic.length;
            this._getTileSvgUrlRecursive(mosaic[0], 0, mosaicTilesTotal, mosaic);

            this.mosaic = mosaic;
            // this._getTileSvgUrl();
            // callBack(mosaic);
            // return mosaic;
        },
        _getTileSvgUrl: function() {
            var mosaicTiles = this.mosaic;
            var that = this;
            var chunkSize = this.rowTilesCount;
            // if (chunkSize > 20) {
            //     chunkSize = Math.floor(mosaicTiles.length / 1000);
            // } else {
            //     chunkSize = this.rowTilesCount;
            // }

            // var chunkSize = 100;
            var currWorker = 0;
            var totalTiles = 0;
            var workers = [];
            for(var z=0;z<16;z++){
                workers.push(new Worker("js/mosaicTileWorker.js"));
            }
            for (var i = 0; i < mosaicTiles.length; i += chunkSize) {
                var worker = workers[currWorker];
                currWorker++;
                if(currWorker === workers.length){
                    currWorker = 0;
                }
                // mosaicTile, currIndex, totalTilesCount, mosaic
                var mosaicTilesChunk = mosaicTiles.slice(i, i + chunkSize);
                worker.postMessage([mosaicTilesChunk[0], 0, mosaicTilesChunk.length, mosaicTilesChunk]);
                worker.addEventListener('message', function(ev) {
                    // this.terminate();
                    for (var x = 0; x < ev.data.length; x++) {
                        var mosaicTileData = ev.data[x];
                        mosaicTileData.svgUrl = MosaicUtils.getSvgUrl(mosaicTileData.svgTextXml);
                        mosaicTiles[mosaicTileData.tileIndex] = mosaicTileData;
                        totalTiles++;
                    }
                    if (totalTiles === that.totalTiles) {
                        that._onTileSVGURLLoaded();
                    }
                }, false);
            }

        },
        bac_getTileSvgUrl: function() {
            //loop through each tile to call the get svg url method recursively
            var that = this;
            var mosaicTotalTiles = this.mosaic.length;
            //init a worker for every row of tiles
            that._getTileSvgUrlRecursive(this.mosaic[0], 0, mosaicTotalTiles);
            // for (var i = 0; i < mosaicTotalTiles; i++) {
            //     var mosaicTile = this.mosaic[i];
            //     window.setTimeout(function() {
            //         that._getTileSvgUrlRecursive(mosaicTile, 0, mosaicTotalTiles);
            //     }, 100);
            // }
        },

        _getTileSvgUrlRecursive: function(mosaicTile, currIndex, totalTilesCount, mosaic) {
            //the current tile
            if (currIndex === totalTilesCount) {
                this._onTileSVGURLLoaded();
            } else {
                var that = this;
                mosaicTile.getSVGSUrl(function(mosaicTile) {
                    //increment by one
                    currIndex++;
                    //next tile
                    // window.setTimeout(function() {
                        that._getTileSvgUrlRecursive(mosaic[currIndex], currIndex, totalTilesCount, mosaic);
                    // }, 10);

                });

            }
        },

        _getTileImageData: function(xCoord, yCoord) {
            var fullImageData = this.getImageData();

            var data = [];
            for (var x = xCoord; x < (xCoord + this.tileWidth); x++) {
                //account for the 4 bits! we skip every 4
                var xPos = x * 4;
                for (var y = yCoord; y < (yCoord + this.tileHeight); y++) {
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
        }

    };

    return {
        "Mosaic": Mosaic,
        "MosaicTile": MosaicTile,
        "Utils": Utils
    };
})(Utils, window.URL, window);
