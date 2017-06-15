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
  var handler = this.handler
  var endPoints = this.endPoints

  expApp.use(middleware.logger);

  expApp.get('/:app', function(req, res){
    app = req.params.app
    if(_.contains(endPoints, app)) {
      job = req.query;
      result = handler.get(app, job)
      if(result) res.send(result)
      else handler.add(app, job, res)
    }
  })

  expApp.listen(PORT, function() {
    console.log('Express server started on port ' + PORT + '!');
  });
}

module.exports = Server
