/**
 * Main Module, it runs everything and sets up the event listeners on the dom elements.
 * Let's use some dependency injection so we know exactly what we need.
 * @param {Object} window The window object
 * @param {Object} document The document object
 * @param {Object} uiHandler the module that handles ui updates
 * @return {void}
 */
(function(window, document, URL, uiHandler, mosaicService, tileWidth, tileHeight) {
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
        uiHandler.fadeInElem(document.getElementById("main-container"));
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
        document.getElementById("image-input").addEventListener("change", onChangeImageInput, false);

        //event listener for render mosaic
        document.getElementById("render-mosaic").addEventListener("click", onClickRenderMosaic, false);

        //event listener for file input button click
        document.getElementById("file-input-button").addEventListener("click", onClickFileInputButton, false);
    }

    /**
     * Handles the click on the file input button so request for a file
     * @param  {Object} event The event data
     * @return {void}
     */
    function onClickFileInputButton(event) {
        document.getElementById("image-input").click();
    }

    /**
     * Handles the change event on the image input dom element
     * @param  {Object} event The event data
     * @return {void}
     */
    function onChangeImageInput(event) {
        if (typeof event.target.files[0] !== "undefined") {
            var image = event.target.files[0];
            //update the text beside the button for file input
            var inputFileNameContainer = document.getElementById("input-file-name");
            inputFileNameContainer.innerHTML = image.name;
            inputFileNameContainer.title = image.name;
            //hide the fake image area place holder
            uiHandler.hideElem(document.getElementById("fakeimagearea"));
            //show the real image area
            uiHandler.showElem(document.getElementById("imagearea"));
            //use the URL api to create a url for the image
            var url = URL.createObjectURL(image);
            //hide the mosaic area
            uiHandler.hideElem(document.getElementById("mosaic-area"));
            //render the image in the canvas by using the uiHandler module
            uiHandler.renderImageInPreviewCanvas(document.getElementById("preview-area"), url);
        }
    }

    /**
     * Event handler for when a click occurs on the render mosaic button
     * @param  {Object} event The event data
     * @return {void}
     */
    function onClickRenderMosaic(event) {
        var canvas = document.getElementById("preview-canvas");
        //proceed only if the source image is valid
        if (canvas !== null) {
            //hide the elements of the preview canvas
            uiHandler.hideElem(document.getElementById("preview-area"));
            //show the loading text
            uiHandler.showElem(document.getElementById("loading-text-area"));
            uiHandler.hideElem(document.getElementById("imagearea"));
            //disable the buttons
            document.getElementById("file-input-button").disabled = true;
            document.getElementById("render-mosaic").disabled = true;
            //lets instanciate the mosaic object
            var mosaic = new mosaicService.Mosaic(canvas.getContext("2d"), tileWidth, tileHeight);
            //get the mosaic data and wait for the promises to resolve
            mosaic.getMosaicData().then(function(mosaicData) {
                //render the mosaic then wait for the promise to resolve
                uiHandler.renderMosaic(document.getElementById("mosaic-area"), mosaicData, canvas.height, canvas.width).then(function() {
                    //hide the loading text
                    uiHandler.hideElem(document.getElementById("loading-text-area"));
                    //enable the buttons again
                    document.getElementById("file-input-button").disabled = false;
                    document.getElementById("render-mosaic").disabled = false;
                    //show the image area
                    uiHandler.showElem(document.getElementById("imagearea"));
                });
            });
        }
    }

    //listener for window load event
    window.addEventListener("load", onLoad, false);

})(window, document, window.URL, uiHandler, mosaicService, TILE_WIDTH, TILE_HEIGHT);
