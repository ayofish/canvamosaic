/**
 * uiHandler module handles all the ui changes that occur so as to separate business logic from ui logic.
 * This uses the revealing module pattern so as to encapsulate code and just expose some methods and variables.
 * @return {[type]}     [description]
 */
var uiHandler = (function(utils) {
    "use strict";

    /**
     * renders an image in a canvas
     * @param  {Object} canvas       The canvas dom element reference
     * @param  {string} imageURL     The blob url of the image
     * @param  {number} canvasWidth  The width of the canvas
     * @param  {number} canvasHeight The height of the canvas
     * @return {Object} image        The image object
     */
    var renderImageInCanvas = function(canvas, imageURL, canvasWidth, canvasHeight) {
        //just for added effect, fade in the image
        canvas.classList.add("fade");
        //remove the fadein class so as to fade out the image
        canvas.classList.remove("fadein");
        //workaround to redraw the dom element when removing classes and adding new ones. Just to make sure the fade out and fade in effect happens. http://stackoverflow.com/a/3485654
        canvas.style.display = 'none';
        canvas.offsetHeight; // no need to store this anywhere, the reference is enough
        canvas.style.display = '';
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
            canvas.classList.add("fadein");
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
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;

        return canvas;
    };

    //the public methods for this module
    return {
        "renderImageInCanvas": renderImageInCanvas,
        "clearCanvas": clearCanvas
    };
})(utils);
