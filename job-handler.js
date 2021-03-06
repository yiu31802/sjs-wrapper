var _ = require('underscore')

var cache = require('./utils/cache').cache
var flag = require('./utils/cache').flag
var getFlag = require('./utils/cache').getFlag
var getJob = require('./utils/cache').getJob
var setJob = require('./utils/cache').setJob
var submitAndGetSparkResult = require('./utils/sjs-interact')

var gjobs = [] // global job queue [ {app: xxx, job: yyy}  ]

var Handler = function(url,
                       classPathPrefix,
                       appName,
                       context,
                       sjsHome){  // Initialization
  this.base_parameters = {url: url,
                          classPathPrefix: classPathPrefix,
                          appName: appName,
                          context: context}
  this.sjsHome = sjsHome
  console.log("INFO: Job Handler initialization.")
}

Handler.prototype.get = function(app, job){  // Only if cache is available
  app_cache = _.filter(cache, x => app == x['app'])
  matched_obj = _.filter(app_cache, x => _.isEqual(job, x['input']))
  if(matched_obj.length) return _.last(matched_obj)['result']
}

Handler.prototype.timestamp = function(app, job){
  app_cache = _.filter(cache, x => app == x['app'])
  matched_obj = _.filter(app_cache, x => _.isEqual(job, x['input']))
  if(matched_obj.length) return _.last(matched_obj)['timestamp']
}

Handler.prototype.len = function(app, job){
  app_cache = _.filter(cache, x => app == x['app'])
  matched_objs = _.filter(app_cache, x => _.isEqual(job, x['input']))
  return matched_objs.length
}

Handler.prototype.add = function(app, job, res, forced){  // Adding jobs

  function wait_and_get(app, job, res){
    out = Handler.prototype.get(app, job)
    if(out == undefined){
      setTimeout(() => wait_and_get(app, job, res), 1000)
    } else if(forced=="true" && Handler.prototype.timestamp(app, job) == last_timestamp){
      setTimeout(() => wait_and_get(app, job, res), 1000)
    } else{
      console.log("INFO: Output the result of " + app + ": " + JSON.stringify(job))
      res.send(out)
    }
  }

  let last_result = Handler.prototype.get(app, job)
  let last_timestamp = undefined
  if(!_.isUndefined(last_result)){
    last_timestamp = Handler.prototype.timestamp(app, job)
  }
  let queue = {app: app, job: job}
  let isRunning = (getFlag() || gjobs.length > 0)
  if(_.contains(gjobs, queue) || _.isEqual(job, getJob())){
    console.log("INFO: A same job is skipped for execution: " + job)
    wait_and_get(job, res)
  } else{
    console.log("INFO: A job will be added soon: " + JSON.stringify(queue))
    setJob(queue)
    gjobs.unshift(queue)
    if(!isRunning){
      this.start()
    } else{
      console.log("?? Job is already running thus no trigger..")
    }
    if(res != undefined){
      wait_and_get(app, job, res)
    }
  }
}

Handler.prototype.start = function(){  // Start jobs and caching
  sjsHome = this.sjsHome

  function iter(){
    console.log("Remaining: " + gjobs.length)
    if(gjobs.length > 0){
      queue = _.first(gjobs)
      app = queue['app']
      job = queue['job']
      gjobs.shift()
      console.log(JSON.stringify(queue) + " is started.")
      submitAndGetSparkResult(base_parameters, app, job, iter, sjsHome)
    }
  }
  var base_parameters = this.base_parameters
  console.log("INFO: Job sequence is started.")
  iter()
}

module.exports = Handler
