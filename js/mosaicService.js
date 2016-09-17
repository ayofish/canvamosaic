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

    var MosaicTile = function(tileImageData, xCoord, yCoord, tileIndex) {
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

    MosaicTile.prototype = {
        setAverageRGB: function() {
            var i = -4,
                pixelInterval = 5,
                count = 0,
                length = this.tileImageData.length;

            while ((i += pixelInterval * 4) < length) {
                count++;
                this.r += this.tileImageData[i];
                this.g += this.tileImageData[i + 1];
                this.b += this.tileImageData[i + 2];
            }

            // floor the average values to give correct rgb values
            this.r = Math.floor(this.r / count);
            this.g = Math.floor(this.g / count);
            this.b = Math.floor(this.b / count);

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
            return this.hex;
        },

        setSvgText: function(svgtext) {
            this.svgTextXml = svgtext;
        },
        setSvgUrl: function(svgtext) {
            var blob = new Blob([svgtext], { type: 'image/svg+xml;charset=utf-8' });
            this.svgUrl = Url.createObjectURL(blob);
        },
        _onErrorGetSVGUrl: function(errorText) {
            console.log(errorText);
        },

        getSVGUrl: function() {
            var that = this;
            var url = svgServiceUrl + this.getAverageHex();
            var promise = new Promise(function(resolve, reject) {
                Utils.httpGet(url)
                    .then(function(svgtext) {
                        that.setSvgUrl(svgtext);
                        that.setSvgText(svgtext);
                        resolve(that.svgUrl);
                    })
                    .catch(function(errorText) {
                        reject(errorText);
                    });
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
        this.rowTilesCount = Math.floor(this.canvasContext.canvas.width / this.tileWidth);
        this.columnTilesCount = Math.floor(this.canvasContext.canvas.height / this.tileHeight);
        this.totalTiles = 0;
        this.mosaicData = [];
        this.mosaic = [];
        this.currTilesSvgLoaded = 0;
        return this;
    };

    Mosaic.prototype = {
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
            for (var a = 0; a < this.columnTilesCount; a++) {

                // var mosaicRowTiles = [];
                for (var b = 0; b < this.rowTilesCount; b++) {
                    var yCoord = a * this.tileHeight;
                    var xCoord = b * this.tileWidth;

                    var tileImageData = this._getTileImageData(xCoord, yCoord, imageData);
                    var mosaicTile = new MosaicTile(tileImageData, xCoord, yCoord, this.totalTiles);
                    mosaicTile.setAverageRGB();
                    mosaicTile.setAverageHex();
                    this.totalTiles++;
                    mosaic.push(mosaicTile);
                }
            }

            this.mosaic = mosaic;
            this.setTilesSvgUrl();
        },

        setTilesSvgUrl: function() {
            var workers = [];
            var totalTiles = 0;
            var that = this;
            var numWorkers = 3;
            var chunkSize = this.rowTilesCount;
            var tilesPerWorker = Math.ceil(this.mosaic.length / numWorkers);
            var mosaicTiles = this.mosaic;
            var iter = 0;
            for (var z = 0; z < numWorkers; z++) {
                workers.push(new Worker("js/mosaicTileWorker.js"));
            }
            for (var i = 0; i < mosaicTiles.length; i += tilesPerWorker) {
                var worker = workers[iter];
                iter++;
                if (iter === workers.length) {
                    iter = 0;
                }
                var workerTiles = mosaicTiles.slice(i, i + tilesPerWorker);
                worker.postMessage([workerTiles[0], 0, workerTiles.length, workerTiles]);
                worker.addEventListener('message', function(ev) {
                    for (var x = 0; x < ev.data.length; x++) {
                        var mosaicTileData = ev.data[x];
                        mosaicTileData.svgUrl = MosaicUtils.getSvgUrl(mosaicTileData.svgTextXml);
                        that.mosaic[mosaicTileData.tileIndex] = mosaicTileData;
                        totalTiles++;
                    }
                    if (totalTiles === that.totalTiles) {
                        that._onTileSVGURLLoaded();
                    }
                }, false);
            }
        },

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
        }
    };

    return {
        "Mosaic": Mosaic,
        "MosaicTile": MosaicTile,
        "Utils": Utils
    };
})(Utils, window.URL, window);
