/**
 * Main Module, it runs everything and sets up the event listeners on the dom elements.
 * Let's use some dependency injection so we know exactly what we need.
 * @param {Object} window The window object
 * @param {Object} document The document object
 * @param {Object} uiHandler the module that handles ui updates
 * @return {void}
 */
(function(window, document, URL, uiHandler) {
    "use strict";
    //event handlers, I like keeping these as static functions for simplicity and readability
    /**
     * Handles the load event on the window and is the first function to be called
     * @param  {Object} event The event data
     * @return {void}
     */
    function onLoad(event) {
        //let's initialize the event listeners
        initEventListeners();
        //fade in the dom elements for the user to see
        document.getElementById("main-container").classList.add("fadein");
    }

    /**
     * Initializes the event listeners
     * @return {void}
     */
    function initEventListeners() {
        /**
         * Event Listeners, set these up after the load of the dom elements and scripts
         */
        //event listener for image input
        document.getElementById("image-input").addEventListener("change", onImageSelect, false);

        //event listener for render mosaic
        document.getElementById("render-mosaic").addEventListener("click", onImageSelect, false);

        //event listener for clear preview
        document.getElementById("clear-preview").addEventListener("click", onImageSelect, false);
    }

    /**
     * [onImageSelect description]
     * @param  {Object} event The event data
     * @return {void}
     */
    function onImageSelect(event) {
        var canvas = document.getElementById("preview-canvas");
        var url = URL.createObjectURL(event.target.files[0]);
        uiHandler.renderImageInCanvas(canvas, url);
    }

    //listener for window load event
    window.addEventListener("load", onLoad, false);

})(window, document, (window.webkitURL || window.URL), uiHandler);
