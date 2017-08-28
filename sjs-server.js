var express = require('express');
var _ = require('underscore')

var jobHandler = require('./job-handler')
var restart_jobserver = require('./utils/sjs-restart')


var Server = function(url="http://localhost:8090",
                      classPathPrefix,
                      appName,
                      context,
                      endPoints,
                      sjsHome){
  this.handler = new jobHandler(url, classPathPrefix, appName, context, sjsHome)
  this.endPoints = endPoints
}

Server.prototype.start = function(PORT=3000){

  var expApp = express();
  var middleware = {
      logger: function(req, res, next) {
          console.log('Request: ' + new Date().toString() + ' ' +
          req.method + ' ' + req.originalUrl);
          next();
      }
  };

  handler = this.handler

  expApp.use(middleware.logger);

  expApp.get('/:app', function(req, res){
    app = req.params.app
    if(_.contains(this.endPoints, app)) {
      job = req.query;
      if(req.query.forced=="true"){
        delete job.forced
        handler.add(app, job, res, "true")
      } else{
        result = handler.get(app, job)
        if(result){
          console.log("INFO: Output the result of " + app + ": " + JSON.stringify(job))
          res.send(result)
        } else {
          handler.add(app, job, res)
        }
      }
    } else {
      console.log("INFO: endpoint not found: (" + req.params.app +
                  "), available endpoints are " + this.endPoints)
    }
  })

  expApp.listen(PORT, function() {
    console.log('Express server started on port ' + PORT + '!');
  });
}

module.exports = Server
