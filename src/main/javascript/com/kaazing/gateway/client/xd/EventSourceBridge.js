/**
 * Copyright (c) 2007-2013, Kaazing Corporation. All rights reserved.
 */

(function() {

    var registry = {};

    /**
     * @ignore
     */
    window.onload = function() {
        // initialize communication
        postMessage0(parent, "I", "*");
    };

    function onmessage(event) {
        if (event.source == parent) {
            // parse message
            var message = event.data;
            if (message.length >= 9) {
                var position = 0;
                var type = message.substring(position, position += 1);
                var id = message.substring(position, position += 8);
                
                switch (type) {
                case "c":
                    //    - connect -
                    //    --> "c" 00000001 0029 "http://gateway.example.com:8000/stomp" 

                    var locationSize = fromHex(message.substring(position, position += 4));
                    var location = message.substring(position, position += locationSize);
                    var origin = event.origin;

                    // default port if necessary
                    var originURI = new URI(origin);
                    if (originURI.port === undefined) {
                    	var defaultPorts0 = { "http":80, "https":443 };
                    	originURI.port = defaultPorts0[originURI.scheme];
                    	originURI.authority = originURI.host + ":" + originURI.port;

                    	// Note: new URI(origin).toString() adds slash for path
                    	origin = originURI.scheme + "://" + originURI.authority;
                    }
                
                    doOpen(event.source, origin, id, location);
                    break;
                case "a":
                    doAbort(id);
                    break;
                case "d":
                    doDelete(id);
                    break;
                }
            }
        }
    }

    function doOpen(source, origin, id, location) {
        var eventsource = new EventSource(location);

        eventsource.onmessage = function(e) {
            var name = e.type;
            var message = ["D", id, toPaddedHex(name.length, 4), name, toPaddedHex(e.data.length, 4), e.data].join("");
            postMessage0(source, message, origin);
        }
        eventsource.onopen = function(e) {
            var message = ["O", id].join("");
            postMessage0(source, message, origin);
        }
        eventsource.onerror = function(e) {
            var message = ["E", id].join("");
            postMessage0(source, message, origin);
        }

        registry[id] = eventsource;
    }

    function doAbort(id) {
        var registered = registry[id];
        if (registered !== undefined) {
            registered.close();
        }
    }
    
    function doDelete(id) {
        var registered = registry[id];
        delete registry[id];
    }


    function fromHex(formatted) {
        return parseInt(formatted, 16);
    }
    
    function toPaddedHex(value, width) {
        var hex = value.toString(16);
        var parts = [];
        width -= hex.length;
        while (width-- > 0) {
            parts.push("0");
        }
        parts.push(hex);
        return parts.join("");
    }

    window.addEventListener("message", onmessage, false);
})();
