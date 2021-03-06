(function() {

	singlefile.nio = {};

	singlefile.nio.RequestManager = function() {
		var cache = {}, keys = [], pendingResponseHandlers = {}, XHR_TIMEOUT = 45000;

		function sendResponses(key) {
			if (pendingResponseHandlers[key]) {
				pendingResponseHandlers[key].forEach(function(callback) {
					callback(cache[key]);
				});
				delete pendingResponseHandlers[key];
			}
		}

		function arrayBufferToBase64(buffer) {
			var binary, bytes, len, i;
			binary = "";
			if (buffer) {
				bytes = new Uint8Array(buffer);
				len = bytes.byteLength;
				for (i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
			}
			return btoa(binary);
		}

		this.reset = function() {
			cache = {};
			keys = [];
		};

		this.send = function(url, responseHandler, characterSet, mediaTypeParam) {
			var xhr, timeout, key = JSON.stringify({
				url : url,
				characterSet : characterSet,
				mediaTypeParam : mediaTypeParam
			});

			if (cache[key])
				setTimeout(function() {
					responseHandler(cache[key]);
				}, 1);
			else if (pendingResponseHandlers[key])
				pendingResponseHandlers[key].push(responseHandler);
			else {
				pendingResponseHandlers[key] = [ responseHandler ];
				xhr = new XMLHttpRequest();
				xhr.onload = function() {
					clearTimeout(timeout);
					cache[key] = {
						url : url,
						status : xhr.status,
						mediaType : xhr.getResponseHeader("Content-Type"),
						content : mediaTypeParam == "base64" ? arrayBufferToBase64(xhr.response) : xhr.responseText,
						mediaTypeParam : mediaTypeParam
					};
					keys.push(key);
					sendResponses(key);
				};
				xhr.onerror = function() {
					cache[key] = {};
					keys.push(key);
					sendResponses(key);
				};
				xhr.open("GET", url, true);
				if (mediaTypeParam == "base64") {
					xhr.responseType = "arraybuffer";
				}
				timeout = setTimeout(function() {
					xhr.abort();
					sendResponses(key);
				}, XHR_TIMEOUT);
				try {
					xhr.send(null);
				} catch (e) {
					sendResponses(key);
				}
			}
		};
	};

})();
