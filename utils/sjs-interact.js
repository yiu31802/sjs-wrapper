var rp = require('request-promise')

var cache = require('./cache').cache
var flag = require('./cache').flag
var restart = require('./sjs-restart')

var cnt_early = 1
var lmt_early = 5

function __errorHandlingPost(params, app, job, callback, sjsHome){
  function f(err){
    console.log('ERROR: POST')
    console.log(err)
    if(err.message == 'Error: socket hang up' && err.response == undefined){
      console.log("WARNING: This should be an error during POST. Retrying after 10 seconds...")
      setTimeout(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), 10000)
    } else if(err.message.includes('Error: connect ECONNREFUSED') && err.response == undefined){
      console.log("ERROR: POST is continuously failing. Restarting Spark...")
      restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
    } else if (err.response.body.result){
      console.log("** Original Response** " + JSON.stringify(err.response.body))
    }else {
      console.log("ERROR: Unknown error during POST. I think we have to restart SJS now. And then, resend a POST request.")
      restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
    }
  }
  return f
}

function __errorHandlingGet(params, job_id, app, job, callback, sjsHome){
  function f(err){
    console.log('ERROR: GET')
    // Type 1: SJS is unstable.
    if(typeof err.response.body == 'object'){
      err_result = err.response.body.result
      job_id = err.response.req.path.slice(6)
      console.log("**Original Response**: " + err_result)
      if(typeof err_result == 'object'){
        err_msg = err_result.message
        if (err_msg.includes("akka")){
          console.log("ERROR: akka Error. I think we have to restart SJS now.")
          restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
          cnt_early = 1
        }
      } else{
        if (err_result.includes("No such job ID")){
          if(cnt_early < lmt_early){
            console.log("INFO: Too-Early count: " + cnt_early)
            console.log("WARNING: Ok I see, I was just too early to ask for result. Let's wait and come back again now...")
            __waitAndGet(job_id, res, app, job, jobs)
            cnt_early += 1
          } else {
            console.log("INFO: job-server's performance is getting bad. We'll restart SJS.")
            restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
            cnt_early = 1
          }
        }
      }
    } else { // Type 2: SJS is unstable in a different way.
      err_body = err.response.body
      console.log("**Original Response**: " + err_body)
      if(err_body.includes("Resource representation is only available with these Content-Types")){
        console.log("WARNING: Ok I see, GET is not ready yet. Wait and Get again...")
        job_id = err.response.req.path.slice(6)
        console.log(job)
        if(cnt_early < lmt_early){
          console.log("INFO: Too-Early count: " + cnt_early)
          __waitAndGet(job_id, res, app, job, jobs)
          cnt_early += 1
        } else {
          console.log("INFO: job-server's performance is getting bad. We'll restart SJS.")
          restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
          cnt_early = 1
        }
      } else{ // In case of knowing nothing about the cause
        console.log("ERROR: Unknown (either on your machine or on Spark-Jobserver)")
        console.log("INFO: Let's try again.")
        restart(() => submitAndGetSparkResult(params, app, job, callback, sjsHome), sjsHome)
      }
    }
  }
}

function __waitAndGet(params, job_id, app, job, callback, sjsHome){
  function _thenIterHandling(job_id, app, job){
    function f(fullResponse2){
      var result_body = fullResponse2
      var job_status = result_body.status
      if (job_status == "FINISHED"){
        console.log("INFO: Job is finished")
        var result = result_body.result;
        if(result != null ){
          _pushToCache(job, result)
          console.log("INFO: result data output (only first 500 chars):" +
                      result.substring(0, 500));
          flag(false)
          callback()
        }
      } else if(job_status == "RUNNING"){
        console.log("INFO: Job is not yet finished. Revisiting in 3 seconds.")
        setTimeout(function(){_iter(job_id, app, job)}, 3000)
      } else if(job_status == "ERROR"){
        _pushToCache(job, result_body)
        console.log("INFO: Job returned error. Full error response is stored in cache.")
        console.log("**Original Response (500 chars): " + JSON.stringify(result_body.result).substring(0, 500))
        flag(false)
        callback()
      }
    }
    return f
  }

  function _pushToCache(job, content){
    result_object = {app: app, input: job, result: content}
    cache.push(result_object)
  }

  // Function within __waitAndGet
  function _iter(job_id, app, job){
    uri = params['url'] + "/jobs/" + job_id
    rp({
        uri: uri,
        json: true
      }).
    then(
      _thenIterHandling(job_id, app, job)
    )
  }

  _iter(job_id, app, job)
}


function __sparkJobPost(params, app, job){
  var input_list = Object.keys(job).map(key => job[key])
  uri = params['url'] +
        "/jobs?appName=" + params['appName'] +
        "&classPath=" + params['classPathPrefix'] + app +
        "&context=" + params['context']
  console.log("INFO: sending " + app + " job request to Spark with " + input_list.join('---'))
  return rp({
    method: 'POST',
    uri: uri,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    form: {
      'input.string' : input_list.join('---')
    },
    resolveWithFullResponse: true,
    json: true
  })
}

submitAndGetSparkResult = function(params, app, job, callback, sjsHome){
  // Step 1: POST a job
  flag(true)
  PromisePost = __sparkJobPost(params, app, job)

  // Step 2: Ask for result by GET
  // Step 3: If result is available, push the result in cache.
  // Step 4: Then `callback` calls the next iteration.
  PromisePost.then(
    fullResponse => {
      job_id = fullResponse.body.jobId
      console.log("INFO: " + params['url'] + "/jobs/" + job_id)
      setTimeout(function(){
        console.log("INFO: after 4 sec.")
        __waitAndGet(params,
                     job_id,   // Step 2
                     app,
                     job,
                     callback, // Step 3, Step 4
                     sjsHome)
      }, 4000)
    }
  ).catch(
    __errorHandlingPost(params, app, job, callback, sjsHome)
  )
}

module.exports = submitAndGetSparkResult
