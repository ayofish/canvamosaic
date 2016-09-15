var Utils = {
    httpGet: function(url) {
        var promise = new Promise(function(resolve, reject) {
            //create an instance of the xmlhttprequest object
            var xhr = new XMLHttpRequest();
            //open the request with a get request
            xhr.open('GET', url);
            //send the request
            xhr.send(null);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Performs the function "resolve" when this.status is equal to 2xx
                    resolve(xhr.response, args);
                } else {
                    // Performs the function "reject" when this.status is different than 2xx
                    reject(xhr.statusText, args);
                }
            };
        });
        return promise;
    }
};
