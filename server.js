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
	qiniu = require("qiniu");
	
var simulation = false;
var debug = false;
var local = false;
var parent_dir = "";
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
        	else if  (arguments[index]=="-local") 
        		{
        			parent_dir="../fpga/package/"; local == true; 
        		}
}

	

//file upload 
qiniu.conf.ACCESS_KEY = 'IrDtWu7b7mBVDqSjLcek1kfbb3CM90JblgImlko6';
qiniu.conf.SECRET_KEY = '1UlARj0pqeAiL_ipBLke1Gm_HBGNL60KDrSDjUdX';

var bucketname = 'openfpgaduino';
var cloudname = 'http://7xi3cc.com1.z0.glb.clouddn.com/';
var gzfilename = 'grid.tar.gz';

function uptoken(bucketname) {
  var putPolicy = new qiniu.rs.PutPolicy(bucketname);
  return putPolicy.token();
}

function uploadBuf(body, key, uptoken) {
  var extra = new qiniu.io.PutExtra();
  qiniu.io.put(uptoken, key, body, extra, function(err, ret) {
    if (!err) {
      // 上传成功， 处理返回值
      console.log(ret.key, ret.hash);
      // ret.key & ret.hash
    } else {
      // 上传失败， 处理返回代码
      console.log(err)
      // http://developer.qiniu.com/docs/v6/api/reference/codes.html
    }
  });
}

function uploadFile(localFile, key, uptoken) {
  var extra = new qiniu.io.PutExtra();
  qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
    if(!err) {
      // 上传成功， 处理返回值
      console.log(ret.key, ret.hash);
      // ret.key & ret.hash
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
      // http://developer.qiniu.com/docs/v6/api/reference/codes.html
    }
  });
}

//http file download
//App variables
var file_url = 'http://7xi3cc.com1.z0.glb.clouddn.com/grid.tar.gz';
var DOWNLOAD_DIR = './';
//Function to download file using HTTP.get
var download_file_httpget = function(file_url) {
	var options = {
	 host: url.parse(file_url).host,
	 port: 80,
	 path: url.parse(file_url).pathname
	};
	
	var file_name = url.parse(file_url).pathname.split('/').pop();
	var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
	
	http.get(options, function(res) {
	 res.on('data', function(data) {
	         file.write(data);
	     }).on('end', function() {
	         file.end();
	         console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
	     });
	 });
};

//docker http trigger
var https = require('https');
var dockername = 'registry.hub.docker.com'; 
var dockerpath = '/u/lizhizhou/cloudfpga/trigger/';
var token = 'c0a34362-5a62-4d9a-921d-ed3ce9724f6f';
var postData = 'build=true';

var options = {
  hostname: dockername,
  port: 443,
  path: dockerpath + token +'/',
  method: 'POST'
};

function dock_build() {
	var req = https.request(options, function(res) {
	  console.log("statusCode: ", res.statusCode);
	  console.log("headers: ", res.headers);
	  res.on('data', function(d) {
	    process.stdout.write(d);
	  });
	});
	req.write(postData);
	req.end();
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
		debuginf("save the design");
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
		  fs.writeFileSync('packeg/'+ filename +'.v', code);
        });
	}
	
	if (path.basename(pathname) =="delete") {
		debuginf("delete the design");
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
		  fs.unlink('program/'+ filename +'.v');
        });
	}
	
	if (path.basename(pathname) =="download") {
		debuginf("downlaod the file");
		download_file_httpget(file_url);
	}

	if (path.basename(pathname) =="build") {
		debuginf("synthsis the design");
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
	      if (local == true) {
	          fs.writeFileSync('../fpga/grid.v', code);	      
	          var command;
	              command = "./build.sh";
	      	      shell = p.exec(command,
	                  function (error,stdout,stderr) {
	        	      		if (error !== null) {
	        	      		  debuginf('build error:');
	        				  error_message += stderr;
	        	      	        }
	      	      });
	      	      shell.stdout.on('data', function (data) {
	      	    	  console_message += data;
	      	      });
	      } else {
	          fs.writeFileSync('grid.v', code);	      
	          rmFile(bucketname, "grid.tar.gz");
	          uploadBuf(grid.v, "filelist.txt", uptoken(bucketname));
	          uploadBuf(code, "grid.v", uptoken(bucketname));
	          dock_build();
	      }
	  
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
				case ".v":
					res.writeHead(200, {"Content-Type": "text/html"});
				    pathname = parent_dir+"template.v";
					break;
				case ".tar.gz":
					res.writeHead(200, {"Content-Type": "application/octet-stream"});
					pathname = parent_dir+"grid.tar.gz";
					break;	
				default:
					res.writeHead(200, {"Content-Type": "application/octet-stream"});
			}
			fs.readFile(pathname,function (err,data){
				res.end(data);
			});
		} else {
			switch(path.extname(pathname)){
				case ".v":
					res.writeHead(200, {"Content-Type": "text/html"});
				    pathname = parent_dir+"template.v";
					fs.readFile(pathname,function (err,data){
						res.end(data);
					});
					break;
				case ".tar.gz":
					res.writeHead(200, {"Content-Type": "application/octet-stream"});
					pathname = parent_dir+"grid.tar.gz";
					fs.readFile(pathname,function (err,data){
						res.end(data);
					});
					break;	
				default:	
					res.writeHead(404, {"Content-Type": "text/html"});
					res.end("<h1>404 Not Found</h1>");
					}
		}
	});

}).listen(8686);

console.log("IDE running at port 8686");
