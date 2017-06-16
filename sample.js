var jobHandler = require('sjs-wrapper').handler

var sjs = new jobHandler(url="http://localhost:8090",
                         classPathPrefix="spark.jobserver.",
                         appName="Test",
                         context="test-context",
                         // sjsHome // You do not have to give this if it exists in ~/job-server
                        )
sjs.start()
sjs.add("WordCountExample", {input.string: "a a b b c see"})

// No computation for the following cause the result is cached.
setTimeout(
  () => sjs.add("WordCountExample", {input.string: "a a b b c see"}),
  10000 // 10 seconds
)
