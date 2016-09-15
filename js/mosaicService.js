var mosaicService = (function(Utils) {
    var svgServiceUrl = "/color/";

    var MosaicUtils = {
        convertToHex: function(number) {
            var str = number.toString(16);
            return str.length == 1 ? "0" + str : str;
        },
        createSVGblobUrl: function() {

        }
    };

    var MosaicTile = function(tileImageData, tileRowIndex, tileColumnIndex) {
        this.tileRowIndex = tileRowIndex;
        this.tileColumnIndex = tileColumnIndex;
        this.tileImageData = tileImageData;
        this.r = 0;
        this.g = 0;
        this.b = 0;
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

        getSVGSUrl: function() {
            return Utils.httpGet(svgServiceUrl + this.getAverageHex(), this);
        }
    };


    /**
     * [Mosaic description]
     * @param {[type]} canvasContext [description]
     * @param {[type]} tileWidth     [description]
     * @param {[type]} tileHeight    [description]
     */
    var Mosaic = function(canvasContext, tileWidth, tileHeight) {
        this.canvasContext = canvasContext;
        this.imageData = null;
        this.tileWidth = (!tileWidth ? 1 : tileWidth);
        this.tileHeight = (!tileHeight ? 1 : tileHeight);
        this.rowTilesCount = this.canvasContext.canvas.width / this.tileWidth;
        this.columnTilesCount = this.canvasContext.canvas.height / this.tileHeight;
        return this;
    };

    Mosaic.prototype = {
        getImageData: function() {
            if (this.imageData === null) {
                this.imageData = this.canvasContext.getImageData(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
            }
            return this.imageData;
        },
        _setMosaicRowData: function(){

        },
        getMosaicData: function(callBack) {
            var imageData = this.getImageData();
            var mosaic = [];

            for (var a = 0; a < this.rowTilesCount; a++) {
                var mosaicRowTilesHex = [];
                for (var b = 0; b < this.columnTilesCount; b++) {
                    var xCoord = a * this.tileWidth;
                    var yCoord = b * this.tileHeight;
                    var tileImageData = this._getTileImageData(xCoord, yCoord);
                    var mosaicTile = new MosaicTile(tileImageData);
                    mosaicTile.setAverageRGB();
                    mosaicTile.getSVGSUrl().then().catch();
                    mosaicRowTilesHex.push(mosaicTile);
                }
                mosaic.push(mosaicRowTilesHex);
            }
            callBack(mosaic);
            return mosaic;
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
})(Utils);
