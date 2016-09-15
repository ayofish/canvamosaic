var mosaicService = (function(Utils, Url, window) {
    var svgServiceUrl = "/color/";

    var MosaicUtils = {
        convertToHex: function(number) {
            var str = number.toString(16);
            return str.length == 1 ? "0" + str : str;
        }
    };

    var MosaicTile = function() {
        this.getSVGSUrlCallback = null;
        this.tileRowIndex = null;
        this.tileColumnIndex = null;
        this.tileImageData = null;
        this.r = null;
        this.g = null;
        this.b = null;
        this.svgTextXml = null;
        this.svgUrl = null;
        this.xCoord = null;
        this.yCoord = null;
        this.init.apply(this, arguments);
        return this;
    };

    MosaicTile.prototype = {
        init: function(tileImageData, tileRowIndex, tileColumnIndex, xCoord, yCoord) {
            this.getSVGSUrlCallback = null;
            this.tileRowIndex = tileRowIndex;
            this.tileColumnIndex = tileColumnIndex;
            this.tileImageData = tileImageData;
            this.r = 0;
            this.g = 0;
            this.b = 0;
            this.svgTextXml = "";
            this.svgUrl = "";
            this.xCoord = xCoord;
            this.yCoord = yCoord;
        },
        setAverageRGB: function() {
            var tileImageData = this.tileImageData;
            var i = 0,
                r = 0,
                g = 0,
                b = 0;
            //length of the tile image data
            var length = tileImageData.length;
            //per pixel there are 4 bytes, one red, green, blue then alpha
            var numPixels = length / 4;
            while (i < length) { // calc this tile's color average
                //first byte is red
                r += tileImageData[i++];
                //second is green
                g += tileImageData[i++];
                //third is blue
                b += tileImageData[i++];
                //skip the 4th byte
                i++;
            }

            this.r = (r / numPixels) | 0;
            this.g = (g / numPixels) | 0;
            this.b = (b / numPixels) | 0;
        },

        getAverageRGB: function() {
            return {
                r: this.r,
                g: this.g,
                b: this.b
            };
        },

        getAverageHex: function() {
            var hexColor = MosaicUtils.convertToHex(this.r) + MosaicUtils.convertToHex(this.g) + MosaicUtils.convertToHex(this.b);
            return hexColor;
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
        this.columnTilesCount = this.canvasContext.canvas.height / this.tileHeight;
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
        _onTileSVGURLLoaded: function(mosaicTile) {
            if (typeof this.mosaicData[mosaicTile.tileRowIndex] === "undefined") {
                this.mosaicData[mosaicTile.tileRowIndex] = [];
            }
            this.mosaicData[mosaicTile.tileRowIndex][mosaicTile.tileColumnIndex] = {
                svgUrl: mosaicTile.svgUrl,
                xCoord: mosaicTile.xCoord,
                yCoord: mosaicTile.yCoord
            };
            this.currTilesSvgLoaded++;
            if (this.currTilesSvgLoaded === this.totalTiles) {
                this.getMosaicDataCallback(this.mosaicData, this);
            }
        },
        getMosaicData: function(callBack) {
            this.mosaicData = [];
            this.mosaic = [];
            this.getMosaicDataCallback = callBack;
            var imageData = this.getImageData();
            var that = this;
            for (var a = 0; a < this.rowTilesCount; a++) {
                var mosaicRowTilesHex = [];
                for (var b = 0; b < this.columnTilesCount; b++) {
                    var xCoord = a * this.tileWidth;
                    var yCoord = b * this.tileHeight;
                    var tileImageData = this._getTileImageData(xCoord, yCoord);
                    var mosaicTile = new MosaicTile(tileImageData, a, b, xCoord, yCoord);
                    mosaicTile.setAverageRGB();
                    mosaicRowTilesHex.push(mosaicTile);
                    this.totalTiles++;
                    mosaicTile.getSVGSUrl(function(mosaicTile) {
                        that._onTileSVGURLLoaded(mosaicTile);
                    });

                }
                this.mosaic.push(mosaicRowTilesHex);
            }
            // callBack(mosaic);
            // return mosaic;
        },
        _getTileImageData: function(xCoord, yCoord) {
            var fullImageData = this.getImageData();

            var data = [];
            for (var x = xCoord; x < (xCoord + this.tileWidth); x++) {
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
