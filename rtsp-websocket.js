var RED = require(process.env.NODE_RED_HOME + "/red/red");
var Stream = require('node-rtsp-stream')



module.exports = function(RED) {
    function RTSP_socket(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.rtsp_url = config.rtsp_url
        this.ws_port = config.ws_port
        this.name = config.name || 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov'
        this.retry_timeout = config.retry_timeout || 30000
        var stream, timeout_task;
        function init() {
        	try {
        		if ( stream && stream.wsServer)
        			stream.wsServer.close()
		        stream = new Stream({
				  name: this.name,
				  streamUrl: this.rtsp_url,
				  wsPort: this.ws_port || 9999,
				  ffmpegOptions: { // options ffmpeg flags
				    '-stats': '', // an option with no neccessary value uses a blank string
				    '-r': 30 // options with required values specify the value after the key
				  }
				})
		    } catch(e) {
		    	console.log(e)
		    }
	    }
	    setTimeout(function() {
	    	init.call(this)
			node.log("Stream " + this.name + ": " + this.rtsp_url + " at port " + this.ws_port)
	        node.send({
	        	rtsp_url: this.rtsp_url,
	        	ws_port: this.ws_port,
	        	name: this.name
	        });

	        stream.on('exitWithError', function() {
	        	try {
	        		console.log("Websocket " + this.ws_port + " closed!")
	        		stream.wsServer.close()
	        	} catch(e) {
	        		console.log(e)
	        	}
	        	node.error("Stream " + this.name + ": " + this.rtsp_url + " at port " + this.ws_port + " stopped!")
	        	timeout_task = setTimeout(function() {
	        		init()
	        	}.bind(this), this.retry_timeout)
	        }.bind(this))
	        

	    }.bind(this))
	    this.on('close', function () {
	        node.log("Unbinding camera streaming websocket server from port: " + this.ws_port);
	        try {
	        	if (stream) 
	        		stream.stop();
	        } catch(e) {
	        	console.log(e)
	        }
	        clearTimeout(timeout_task)
	    });
		 
		
    }
    RED.nodes.registerType("rtsp-websocket", RTSP_socket);
}
