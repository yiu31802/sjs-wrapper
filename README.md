# Installation

```bash
npm install sjs-wrapper
```

Hosted by https://www.npmjs.com/package/sjs-wrapper

# Introduction

`sjsWrapper` is an npm module written in javascript. This module eases the use
of [`spark-jobserver`][1] and helps to load less work on `spark-jobserver` by
implementing the following features:

- cache of results
- job queue (NOTE: Until [#789][2] is implemented.)
- server restart of `spark-jobserver` (NOTE: Only if you run the module in the
same machine as `spark-jobserver` runs.)

This module can be either used as a web server with just a few lines of
configuration (i.e., using `sjsWrapper.server`), or integrated inside your
own web server application (i.e., using `sjsWrapper.jobHandler`).

# How to use (`sjsWrapper.server`)

Following [the example scenario][4] in `spark-jobserver` project:

```js
var s = require('./sjs-server')
S = new s(url="http://localhost:8090",
          classPathPrefix="spark.jobserver.",
          appName="Test",
          context="test-context",
          endPoints=["WordCountExample", "AnotherAvailableApp", "AnythingElse"],
          // sjsHome // You do not have to give this if it exists in ~/job-server
         )
S.start(PORT=3000)

// Then you can access to
// http://localhost:3000/WordCountExample?input=a%20b%20c%20a%20b%20see
// Which is equivalent to
// curl -d "input.string = a b c a b see"
// "localhost:8090/jobs?appName=test&classPath=spark.jobserver.WordCountExample&context=test-context&sync=true"
```

# How to use (`sjsWrapper.handler`)

```js
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
```

# FAQ

## Why do we need an wrapper?

Although `spark-jobserver` solely is a great tool, there are several bugs
which you have to deal with when you deploy it. For example, you will have
to restart SJS but it is currently not supported. (See [#803][2])

Thus, `sjs-interact` has logic
to deal with typical error scenarios and successfully return the result
which could usually otherwise end up with an ERROR state.

[1]: https://github.com/spark-jobserver/spark-jobserver
[2]: https://github.com/spark-jobserver/spark-jobserver/issues/803
[3]: https://github.com/spark-jobserver/spark-jobserver/issues/789
[4]: https://github.com/spark-jobserver/spark-jobserver#wordcountexample-walk-through
