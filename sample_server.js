var s = require('sjs-wrapper').server

S = new s(url="http://localhost:8090",
          classPathPrefix="spark.jobserver.",
          appName="Test",
          context="test-context",
          endPoints=["WordCountExample", "AnotherAvailableApp", "AnythingElse"]
          // sjsHome // You do not have to give this if it exists in ~/job-server
         )
S.start(PORT=3000)

// Then you can access to
// http://localhost:3000/WordCountExample?input.string=a%20b%20c%20a%20b%20see
// Which is equivalent to
// curl -d "input.string = a b c a b see"
// "localhost:8090/jobs?appName=test&classPath=spark.jobserver.WordCountExample&context=test-context&sync=true"
