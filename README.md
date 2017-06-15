# Introduction

`sjsWrapper` is an npm module written by javascript. This module eases the use
of `spark-jobserver` and helps to load less work on `spark-jobserver` by
implementing the following features:

- cache of results
- job queueing
- server restart of `spark-jobserver` (NOTE: Only if you run the module in the
same machine as `spark-jobserver` runs.)

This module can be either used as a web server with just a few lines of
configuration (i.e., using `sjsWrapper.server`), or integrated inside your
own web server application (i.e., using `sjsWrapper.jobHandler`).

# Basic Construct

Under construction
