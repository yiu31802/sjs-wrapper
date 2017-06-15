var cache = []
var currentJob
var runningFlag = false

switchFlag = function(value){
  runningFlag = value
  console.log("INFO: Flag is set to " + value)
}

getFlag = function(){
  return runningFlag
}

setCurrentJob = function(job){
  currentJob = job
}

getCurrentJob = function(){
  return currentJob
}

module.exports = {cache: cache, flag: switchFlag, getFlag: getFlag,
                  setJob: setCurrentJob, getJob: getCurrentJob}
