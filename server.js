/*
 * Author: 
 *         Zhizhou Li <lzz@meteroi.com>
 *
 Copyright 2015 Meteroi
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
var http = require("http"),
	url  = require("url"),
	path = require("path"),
	fs   = require("fs");
	querystring = require("querystring");  
	p = require('child_process');
var simulation = false;
var debug = false;
function debuginf(string) {
	if (debug == true) {
		console.log(string);
	}
}

var arguments = process.argv.splice(2);
for (index in arguments)
{
	if (arguments[index]=="-sim") simulation=true;
        else if (arguments[index]=="-debug") debug=true;
		
}

var console_message = "";
var error_message = "";
http.createServer(function (req, res) {
	var pathname=__dirname+url.parse(req.url).pathname;
	var version = '';
	var code = '';
	var filename = 'default';
	debuginf(path.basename);
	debuginf(pathname);
	// response of run command
	
	if (path.basename(pathname) =="save") {
		debuginf("save the code");
		pathname = path.dirname(pathname);

		  req.setEncoding("utf8");
		  req.addListener("data",function(postDataChunk){
		  code += postDataChunk;
			  });
		  req.setEncoding("utf8");
		  req.addListener("end",function(postDataChunk){
		  code += postDataChunk;
		  debuginf(code);
		  code = querystring.parse(code); 
		  debuginf(code);
		  filename = code.arg1;
		  code = code.arg2;
		  debuginf(code);
		  debuginf(filename);
		  fs.writeFileSync('program/'+ filename +'.c', code);
        });
	}
	
	if (path.basename(pathname) =="delete") {
		debuginf("delete the code");
		pathname = path.dirname(pathname);

		  req.setEncoding("utf8");
		  req.addListener("data",function(postDataChunk){
		  code += postDataChunk;
			  });
		  req.setEncoding("utf8");
		  req.addListener("end",function(postDataChunk){
		  code += postDataChunk;
		  debuginf(code);
		  code = querystring.parse(code); 
		  debuginf(code);
		  filename = code.arg1;
		  debuginf(filename);
		  fs.unlink('program/'+ filename +'.c');
        });
	}
	
	if (path.basename(pathname) == "load_config") {
		var list = fs.readdirSync("config");
		var versionlist = list.toString();
		debuginf(versionlist);
		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(versionlist);
	}
	
	if (path.basename(pathname) == "load_example") {
		var list = fs.readdirSync("program");
		var programlist = list.toString();
		debuginf(programlist);
		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(programlist);
	}
	
	if (path.basename(pathname) =="config") {
		debuginf("config fpga");
		pathname = path.dirname(pathname);

	      req.setEncoding("utf8");
	      req.addListener("data",function(postDataChunk){
	      version += postDataChunk;
              });
	      req.setEncoding("utf8");
	      req.addListener("end",function(postDataChunk){
	      version += postDataChunk;
	      debuginf(version);
		  version = querystring.parse(version); 
		  debuginf(version);
		  version = version.arg1;
	      debuginf(version);
          if(simulation==true){
                console_message += "fpga config ok";
          } else {
	      p.exec('$(pwd)/fpga_config.sh ' + 'config/' + version +'.rbf',
      	      function (error,stdout,stderr) {
	      		if (error !== null) {

	      		}
				console_message += stdout;
				error_message += stderr;
	      });
          }
		 });
	}

	var gcc=true;
	if (path.basename(pathname) =="run") {
		debuginf("run the code");
		pathname = path.dirname(pathname);

	      req.setEncoding("utf8");
	      req.addListener("data",function(postDataChunk){
	      code += postDataChunk;
              });
	      req.setEncoding("utf8");
	      req.addListener("end",function(postDataChunk){
	      code += postDataChunk;
	      debuginf(code);
		  code = querystring.parse(code); 
		  debuginf(code);
		  code = code.arg1;
	      
	      debuginf(code);
              fs.writeFileSync('main.c', code);	      
	      if (gcc == true) {
	      var command;
              if (simulation == true)
              {
                    command  = "gcc main.c -o main";
              } else {
                    command  = "gcc main.c api/libAdunino.a -o main";
              }
              p.exec(command,
              	      function (error,stdout,stderr) {
        	      		if (error !== null) {
        	      		  debuginf('compile error:');
        				  error_message += stderr + stdout;
        	      	    } else {
        	      	      shell = p.exec('$(pwd)/main',
        	              	      function (error,stdout,stderr) {
        	        	      		if (error !== null) {
        	        	      		  debuginf('run error:');
        	        				  error_message += stderr;
        	        	      	    } else {

        	        	      	    }
        	      	      });
        	      	      shell.stdout.on('data', function (data) {
        	      	    	  console_message += data;
        	      	      });
        	      	    } 
        	  });
	      } else {
              p.exec('$(pwd)/Aduninoshell main.c ',
	      	      function (error,stdout,stderr) {
		      		if (error !== null) {
		      		  debuginf('program stop:');
		      	    }
					console_message += stdout;
					error_message += stderr;
	      
	          });
	      }
        });
	}
	// response of stop command
	if (path.basename(pathname) =="stop") {
	      if (gcc == true) {
		      p.exec('ps -ef |grep main |grep -v grep|awk \'{print $2}\' | xargs kill -9',
	      	      function (error,stdout,stderr) {
			        debuginf("stop");
	                debuginf(stdout);
		      });
	      } else {
		      p.exec('ps -ef |grep meteroi |grep -v grep|awk \'{print $2}\' | xargs kill -9',
		      	      function (error,stdout,stderr) {
				        debuginf("stop");
		                debuginf(stdout);
			      });	    	  
	      
	      }
	}
	// response of reboot command
	if (path.basename(pathname) =="reboot") {
	      p.exec('sudo reboot',
      	      function (error,stdout,stderr) {
		        console.log("reboot");
		        debuginf(stdout);
	      });
	}
	// response of error message
	if (path.basename(pathname) =="error") {
		res.writeHead(200, {"Content-Type": "text/html"});
	    debuginf(error_message);
		res.end(error_message);
		error_message = "";
	}
	
	// response of console message
	if (path.basename(pathname) =="console") {
		res.writeHead(200, {"Content-Type": "text/html"});
	    debuginf(console_message);
		res.end(console_message);
		console_message = "";
	}

	// response of web request
	if (path.extname(pathname)=="") {
		pathname+="/";
	}
	if (pathname.charAt(pathname.length-1)=="/"){
		pathname+="index.html";
	}

	fs.exists(pathname,function(exists){
		if(exists){
			switch(path.extname(pathname)){
				case ".html":
					res.writeHead(200, {"Content-Type": "text/html"});
					break;
				case ".js":
					res.writeHead(200, {"Content-Type": "text/javascript"});
					break;
				case ".css":
					res.writeHead(200, {"Content-Type": "text/css"});
					break;
				case ".gif":
					res.writeHead(200, {"Content-Type": "image/gif"});
					break;
				case ".jpg":
					res.writeHead(200, {"Content-Type": "image/jpeg"});
					break;
				case ".png":
					res.writeHead(200, {"Content-Type": "image/png"});
					break;
				case ".c":
					res.writeHead(200, {"Content-Type": "text/html"});
					break;
				case ".h":
					res.writeHead(200, {"Content-Type": "text/html"});
					break;
				default:
					res.writeHead(200, {"Content-Type": "application/octet-stream"});
			}
			fs.readFile(pathname,function (err,data){
				res.end(data);
			});
		} else {
			res.writeHead(404, {"Content-Type": "text/html"});
			res.end("<h1>404 Not Found</h1>");
		}
	});

}).listen(8888);

console.log("IDE running at port 8888");
