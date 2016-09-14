/**
 * uiHandler module handles all the ui changes that occur so as to separate business logic from ui logic.
 * This uses the revealing module pattern so as to encapsulate code and just expose some methods and variables.
 * @return {[type]}     [description]
 */
var uiHandler = (function() {
    "use strict";

    /**
     * renders an image in a canvas
     * @param  {Object} canvas       The canvas dom element
     * @param  {string} imageURL     The blob url of the image
     * @param  {number} canvasWidth  The width of the canvas
     * @param  {number} canvasHeight The height of the canvas
     * @return {void}
     */
    var renderImageInCanvas = function(canvas, imageURL, canvasWidth, canvasHeight) {
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
        };
    };

    //the public methods for this module
    return {
        "renderImageInCanvas": renderImageInCanvas
    };
})();
