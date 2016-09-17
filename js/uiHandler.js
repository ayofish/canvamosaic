/**
 * uiHandler module handles all the ui changes that occur so as to separate business logic from ui logic.
 * This uses the revealing module pattern so as to encapsulate code and just expose some methods and variables.
 * @return {[type]}     [description]
 */
/**
 * uiHandler module handles all the ui changes that occur so as to separate business logic from ui logic.
 * @param  {number} TOTAL_WIDTH   the total width of each tile
 * @param  {number} TOTAL_HEIGHT
 * @return {Object}               The functions that are exposed for usage in changing the ui
 */
var uiHandler = (function(URL) {
    "use strict";

    /**
     * Renders an image in a canvas
     * @param  {Object} canvas       The canvas dom element reference
     * @param  {string} imageURL     The blob url of the image
     * @param  {number} canvasWidth  The width of the canvas
     * @param  {number} canvasHeight The height of the canvas
     * @return {Object} image        The image object
     */
    var renderImageInPreviewCanvas = function(container, imageURL) {
        //just for added effect, fade out the image
        fadeOutElem(container);

        var canvas = document.createElement('canvas');
        canvas.id = "preview-canvas";
        var canvasContext = canvas.getContext("2d");
        canvasContext.imageSmoothingEnabled = false;
        canvasContext.mozImageSmoothingEnabled = false;
        //initialize an image object
        var image = new Image();
        //set the url for the image
        image.src = imageURL;
        //on image load listener
        image.onload = function() {
            //set the width of the canvas to the same width of the image
            canvas.width = this.width;
            //set the height of the canvas to the same height as the image
            canvas.height = this.height;
            container.parentNode.style.width = this.width + "px";
            container.parentNode.style.height = this.height+ "px";
            //let's draw the preview image in the canvas
            // canvasContext.drawImage(this, 0, 0, canvas.width, canvas.height);
            _drawImage(canvasContext, this, 0, 0);
            container.innerHTML = null;
            container.appendChild(canvas);
            showElem(container);
            //add the fadein class to fade in the image after it has rendered
            fadeInElem(container);
        };
        return image;
    };

    /**
     * Clears the content of a canvas
     * @param  {Object} canvas The canvas dom element reference
     * @return {Object} canvas The cleared canvas dom element reference
     */
    var clearCanvas = function(canvas) {
        //just for added effect, fade in the image
        canvas.classList.add("fade");
        //remove the fadein class so as to fade out the image
        canvas.classList.remove("fadein");
        //clear the canvas contents
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        //set the width and height to 0
        canvas.width = 0;
        canvas.height = 0;

        return canvas;
    };

    /**
     * Adds the fade and fadein class to cause the element to fade in to the view
     * @param  {Object} elem The dom element
     * @return {Object} elem The modified dom element
     */
    function fadeInElem(elem) {
        //add both classes to the element
        elem.classList.add("fade");
        elem.classList.add("fadein");
        // elem.style.display = '';
        // forceElemRedraw(elem);
        return elem;
    }

    /**
     * Adds the fade and removes the fadein class causing the element to fade out of the view
     * @param  {Object} elem The dom element
     * @return {Object} elem The modified dom element
     */
    function fadeOutElem(elem) {
        //just for added effect, fade out the image
        elem.classList.add("fade");
        //remove the fadein class so as to fade out the image
        elem.classList.remove("fadein");
        //workaround to redraw the dom element when removing classes and adding new ones
        forceElemRedraw(elem);
        // elem.style.display = "none";
        return elem;
    }

    /**
     * Workaround to redraw the dom element when removing classes and adding new ones.
     * Just to make sure the fade out and fade in effect happens. http://stackoverflow.com/a/3485654
     * @param  {Object} elem The dom element
     * @return {Object} elem The modified dom element
     */
    function forceElemRedraw(elem) {
        elem.style.display = 'none';
        elem.offsetHeight; // no need to store this anywhere, the reference is enough
        elem.style.display = '';
        return elem;
    }

    function hideElem(elem) {
        elem.style.display = 'none';
    }

    function showElem(elem) {
        elem.style.display = '';
    }

    /**
     * [renderMosaic description]
     * @param  {[type]} canvasElem [description]
     * @param  {[type]} mosaicData [description]
     * @return {[type]}            [description]
     */
    function renderMosaic(canvasContainer, mosaicData, canvasHeight, canvasWidth) {
        var renderMosiacPromise = new Promise(function(resolve, reject) {
            //loop through each row and render
            var canvasElem = document.createElement('canvas');
            canvasElem.id = "mosaic-canvas";
            var canvasContext = canvasElem.getContext("2d");
            canvasContext.imageSmoothingEnabled = false;
            canvasContext.mozImageSmoothingEnabled = false;
            canvasElem.height = canvasHeight;
            canvasElem.width = canvasWidth;
            var renderMosaicRowPromises = [];
            for (var i = 0; i < mosaicData.length; i++) {
                renderMosaicRowPromises.push(_renderMosaicRow(canvasContext, mosaicData[i]));
            }
            fadeOutElem(canvasElem);
            canvasContainer.innerHTML = null;
            canvasContainer.appendChild(canvasElem);
            Promise.all(renderMosaicRowPromises).then(function() {
                showElem(canvasContainer);
                fadeInElem(canvasElem);
                resolve(canvasContainer);
            });
        });
        return renderMosiacPromise;
    }

    function _renderMosaicRow(canvasContext, rowData) {
        var renderMosaicRowPromise = new Promise(function(resolve, reject) {
            var promises = [];
            for (var i = 0; i < rowData.length; i++) {
                var rowTile = rowData[i];
                promises.push(_getMosaicTileImage(rowTile.svgUrl, rowTile.xCoord, rowTile.yCoord));
            }
            Promise.all(promises).then(function(images) {
                for (var x = 0; x < images.length; x++) {
                    var imageData = images[x];
                    _drawImage(canvasContext, imageData.image, imageData.xCoord, imageData.yCoord);
                    resolve();
                }
            }).catch(function(e) {
                reject(e);
                alert("something went wrong please choose another image" + e.message);
            });
        });
        return renderMosaicRowPromise;
    }

    function _drawImage(canvasContext, image, xCoord, yCoord, width, height) {
        canvasContext.drawImage(image, xCoord, yCoord, image.width, image.height);
    }

    function _getMosaicTileImage(imgSrc, xCoord, yCoord) {
        //create a promise object for each image to be created
        var promise = new Promise(function(resolve, reject) {
            //let's create an image object for the svg to display in
            var image = new Image();
            //set the source url, in this case the blob url
            image.src = imgSrc;
            //on load of the image
            image.onload = function() {
                //try catch just in case there is an error
                try {
                    //give the image to the callback function so as to render and also the xCoordinate and yCoordinates for the canvas to draw it on
                    resolve({
                        image: this,
                        xCoord: xCoord,
                        yCoord: yCoord
                    });
                    //release the url
                    URL.revokeObjectURL(imgSrc);
                    // onImageLoaded(this);
                } catch (e) {
                    //send back the error to the promise then throw it to alert the developer
                    var err = new Error(e);
                    reject(err);
                    throw err;
                }
            };
        });
        //return a promise
        return promise;
    }

    //the public methods for this module
    return {
        "renderImageInPreviewCanvas": renderImageInPreviewCanvas,
        "clearCanvas": clearCanvas,
        "fadeInElem": fadeInElem,
        "fadeOutElem": fadeOutElem,
        "renderMosaic": renderMosaic,
        "hideElem": hideElem,
        "showElem": showElem
    };
})(window.URL);
