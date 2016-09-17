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
        //create a canvas element to show the preview
        var canvas = document.createElement('canvas');
        canvas.id = "preview-canvas";
        var canvasContext = canvas.getContext("2d");
        //initialize an image object
        var image = new Image();
        //set the url for the image
        image.src = imageURL;
        //on image load callback
        image.onload = function() {
            //set the width of the canvas to the same width of the image
            canvas.width = this.width;
            //set the height of the canvas to the same height as the image
            canvas.height = this.height;
            container.parentNode.style.width = this.width + "px";
            container.parentNode.style.height = this.height + "px";
            //let's draw the preview image in the canvas
            _drawImage(canvasContext, this, 0, 0);
            //clear the contents of the container
            container.innerHTML = null;
            //append the canvas to the dom
            container.appendChild(canvas);
            showElem(container);
            //add the fadein class to fade in the image after it has rendered
            fadeInElem(container);
        };
        return image;
    };
    /**
     * Handles the drawing of an image on the canvas
     * @param  {Object} canvasContext The context of the canvas
     * @param  {Object} image         image to render
     * @param  {number} xCoord        x coordinate where to render
     * @param  {number} yCoord        y coordinate where to render
     * @param  {number} width         width of the image
     * @param  {number} height        height of the image
     * @return {Object}               The canvas context
     */
    function _drawImage(canvasContext, image, xCoord, yCoord, width, height) {
        canvasContext.imageSmoothingEnabled = false;
        canvasContext.mozImageSmoothingEnabled = false;
        canvasContext.msImageSmoothingEnabled = false;
        canvasContext.oImageSmoothingEnabled = false;
        canvasContext.drawImage(image, xCoord, yCoord, image.width, image.height);
        return canvasContext;
    }
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

    /**
     * Hides a dom element
     * @param  {Object} elem The dom element
     * @return {Object}      The dom element
     */
    function hideElem(elem) {
        elem.style.display = 'none';
        return elem;
    }

    /**
     * Shows a hidden element via display none
     * @param  {Object} elem The dom element
     * @return {Object}      The dom element
     */
    function showElem(elem) {
        elem.style.display = '';
        return elem;
    }

    /**
     * [renderMosaic description]
     * @param  {[type]} canvasElem [description]
     * @param  {[type]} mosaicData [description]
     * @return {[type]}            [description]
     */
    function renderMosaic(canvasContainer, mosaicData, canvasHeight, canvasWidth) {
        //create a promise for the function call so as not to block the user
        var renderMosiacPromise = new Promise(function(resolve, reject) {
            //make a canvas element
            var canvasElem = document.createElement('canvas');
            canvasElem.id = "mosaic-canvas";
            var canvasContext = canvasElem.getContext("2d");
            //set as the same dimensions of the preview canvas
            canvasElem.height = canvasHeight;
            canvasElem.width = canvasWidth;
            //store all the row rendering promises
            var renderMosaicRowPromises = [];
            //loop through each row and render one row at a time
            for (var i = 0; i < mosaicData.length; i++) {
                var mosaicRow = mosaicData[i];
                //let's store the promises to be resolved
                renderMosaicRowPromises.push(_renderMosaicRow(mosaicRow, canvasContext));
            }
            //resolve all the promises then proceed with inserting the canvas into the dom
            Promise.all(renderMosaicRowPromises).then(function() {
                canvasContainer.innerHTML = null;
                canvasContainer.appendChild(canvasElem);
                //just added effect
                showElem(canvasContainer);
                //finally resolve the promise
                resolve(canvasContainer);
            });
        });
        return renderMosiacPromise;
    }

    /**
     * Renders a mosaic row, returns a promise
     * @param  {Object} mosaicRow     An array of mosaic tiles
     * @param  {Object} canvasContext The canvas context
     * @return {Object}               A promise object
     */
    function _renderMosaicRow(mosaicRow, canvasContext){
        //make a promise so that later we can be sure that all of the tiles will be shown at the same time as the whole canvas
        return new Promise(function(resolve, reject){
            // call the recursive function
            // Recursion is needed to assure that each tile image is rendered before going to the next
            // this avoids the insufficient resources error
            _rendertMosaicTileImageRecursive(mosaicRow[0], 0, mosaicRow, canvasContext, resolve);
        });
    }

    /**
     * Recursive function assuring the tiles are rendered one at a time in a queue
     * @param  {Object} mosaicTile    The mosaic tile to render
     * @param  {number} index         the current index to iterate on
     * @param  {Object} mosaicTiles   An array of mosaic tiles
     * @param  {Object} canvasContext The canvas context
     * @param  {function} callBack    The callback function, in this case the resolve of the promise
     * @return {void}
     */
    function _rendertMosaicTileImageRecursive(mosaicTile, index, mosaicTiles, canvasContext, callBack) {
        //if the index = the mosaic tiles length then let us end the recursion
        if (index === mosaicTiles.length) {
            callBack(mosaicTiles);
            return;
        } else {
            //let's get the promise here to render each image
            _getMosaicTileImage(mosaicTile.svgUrl, mosaicTile.xCoord, mosaicTile.yCoord, canvasContext).then(function(imageData) {
                //increment by one so that the next call to the function in the recursion is the next item on the array
                index++;
                //call the function again
                _rendertMosaicTileImageRecursive(mosaicTiles[index], index, mosaicTiles, canvasContext, callBack);
            });
        }
    }

    /**
     * In charge of drawing the image tile on the canvas.
     * Returns a promise so that it will be async in nature
     * @param  {blob} imgSrc          The blob url of the svg
     * @param  {number} xCoord        [description]
     * @param  {number} yCoord        [description]
     * @param  {Object} canvasContext The canvas context
     * @return {Object}               A promise object
     */
    function _getMosaicTileImage(imgSrc, xCoord, yCoord, canvasContext) {
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
                    _drawImage(canvasContext, this, xCoord, yCoord);
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
