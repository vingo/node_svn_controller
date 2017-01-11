var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var Client = require('svn-spawn');
var pm2 = require('pm2');


var server = http.createServer(function (req, res) {


    var urlobj=url.parse(req.url,true);
    var pathname = urlobj.pathname;
    var project = pathname.replace('\/', '');
    var branch= (urlobj.query.branch||'').trim();
     console.log('project ', project);
     console.log('branch ',branch);


    if(req.url.indexOf('/favicon') !== -1) {
        return res.end('ico avoid')
    } 

    var projectRoot = path.join(__dirname, '..');
    // console.log('projectRoot ', projectRoot);

    var projectPath = path.join(projectRoot, project);
    console.log('projectPath ', projectPath);
    
    if (pathname === '/') {
    	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('项目名不能为空', 'utf8');
    }

    fs.stat(projectPath, function(err, stats) {
        if (err || !stats.isDirectory()) {
	    console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
	    res.end('项目不存在', 'utf8');
        }

        var client = new Client({
            cwd: projectPath,
            username: 'co',
            password: 'co1234xpxp',
        });


        if(branch){

	   client.cmd(['cleanup'],(err,data)=>{
               console.log('svn cleanup......');
	   });

	 return client.cmd(['switch','svn://192.168.22.150/'+project+'/branches/'+branch],(err,data)=>{
                console.log('switch statu:',err);
		 if(!err){
  			console.log('svn switch success>>>>>>>>>>');
			return update(true);
		 }else{
 		        res.writeHead(500, { 'Content-Type': 'text/plain' });
   			res.end('svn 切换分支失败');
         	 }
	    });
         }
         update(false);
        function update(state){
            state=state||false;
            console.log('>>>>>>>>>>>>>>>>>>>>>update statu:',state);
	    if(!state){
		client.update(function(err, svnData) {
        	    if (err) {
		    console.error('svn update...>',err);
               		 res.writeHead(500, { 'Content-Type': 'text/plain' })
			res.end('svn 更新失败', 'utf8');
	            }
		   });
	    }
	    restart_pm2();
         }
        function restart_pm2(){ 
           pm2.connect(function () {
                pm2.restart(project, function(err, result) {
                    if (err) {
			console.error(err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' })
			res.end('失败', 'utf8');
			return ;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/plain' })
		    res.end('成功', 'utf8');
                });
          });
      }

    });
}).listen(4001);

