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
var uiHandler = (function() {
    "use strict";

    /**
     * Renders an image in a canvas
     * @param  {Object} canvas       The canvas dom element reference
     * @param  {string} imageURL     The blob url of the image
     * @param  {number} canvasWidth  The width of the canvas
     * @param  {number} canvasHeight The height of the canvas
     * @return {Object} image        The image object
     */
    var renderImageInCanvas = function(canvas, imageURL, canvasWidth, canvasHeight) {
        //just for added effect, fade out the image
        fadeOutElem(canvas);
        //initialize an image object
        var image = new Image();
        //set the url for the image
        image.src = imageURL;
        //on image load listener
        image.onload = function() {
            //set the width of the canvas to the same width of the image
            canvas.width = (typeof canvasWidth === "undefined" || null ? this.width : canvasWidth);
            //set the height of the canvas to the same height as the image
            canvas.height = (typeof canvasHeight === "undefined" || null ? this.height : canvasHeight);
            //let's draw the preview image in the canvas
            canvas.getContext("2d").drawImage(this, 0, 0, canvas.width, canvas.height);
            //add the fadein class to fade in the image after it has rendered
            fadeInElem(canvas);
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
    function fadeInElem(elem){
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
    function fadeOutElem(elem){
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
    function forceElemRedraw(elem){
        elem.style.display = 'none';
        elem.offsetHeight; // no need to store this anywhere, the reference is enough
        elem.style.display = '';
        return elem;
    }

    /**
     * [renderMosaic description]
     * @param  {[type]} canvasElem [description]
     * @param  {[type]} mosaicData [description]
     * @return {[type]}            [description]
     */
    function renderMosaic(canvasElem, mosaicData){

    }

    //the public methods for this module
    return {
        "renderImageInCanvas": renderImageInCanvas,
        "clearCanvas": clearCanvas,
        "fadeInElem": fadeInElem,
        "renderMosaic": renderMosaic
    };
})();
