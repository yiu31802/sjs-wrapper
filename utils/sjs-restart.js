var fileExists = require('file-exists').sync
var homePath = require('home-path')
var sh = require('shelljs')

function sjsRestart(callback, sjsHome=homePath()+"/job-server"){
  startPath = sjsHome + "/server_start.sh"
  stopPath = sjsHome + "/server_stop.sh"
  if(!fileExists(startPath) || !fileExists(startPath)){
    msg = "spark-jobserver is not available under " + sjsHome
    console.log(msg)
  } else {
    console.log("INFO: " + new Date().toString() + " Restarting SJS now")
    cmd = stopPath + " && " + startPath
    sh.exec(cmd)
    console.log("Spark restarted. Calling callback after 5 seconds.")
    setTimeout(() => callback(), 5000)
  }
}

module.exports = sjsRestart
