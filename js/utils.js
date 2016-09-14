var utils = (function() {
    function fadeInElem(elem){
        elem.classList.add("fade");
        elem.classList.add("fadein");
        //workaround to redraw the dom element when removing classes and adding new ones. Just to make sure the fade out and fade in effect happens. http://stackoverflow.com/a/3485654
        elem.style.display = 'none';
        elem.offsetHeight; // no need to store this anywhere, the reference is enough
        elem.style.display = '';
    }
    function fadeOutElem(elem){
        //just for added effect, fade in the image
        elem.classList.add("fade");
        //remove the fadein class so as to fade out the image
        elem.classList.remove("fadein");
        //workaround to redraw the dom element when removing classes and adding new ones. Just to make sure the fade out and fade in effect happens. http://stackoverflow.com/a/3485654
        elem.style.display = 'none';
        elem.offsetHeight; // no need to store this anywhere, the reference is enough
        elem.style.display = '';
    }
    return {
        "fadeInElem": fadeInElem,
        "fadeOutElem": fadeOutElem
    };
})();
