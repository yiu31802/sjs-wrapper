var jobHandler = require('./job-handler')

var sjs = new jobHandler()

console.log(sjs)
sjs.start()

// job = ...
// app = ...

setTimeout(() => sjs.add(app, job), 100)

// job2 = ...
setTimeout(() => sjs.add(app, job2), 30000)

//setTimeout(() => sjs.get(1), 1000)
//setTimeout(() => console.log(sjs.get([1,3])), 5000)
