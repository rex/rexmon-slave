/**
 * RexMon - Slave Install
 *
 * @author Pierce Moore <Pierce@PierceMoore.com>
 * @copyright 2013 BSD
 */

  /**
   * System Libraries
   */
var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , path = require('path')
  , os = require('os')
  , exec = require('child_process').exec
  , http = require('http')
  , scli = require('supercli')
  , _ = require('underscore')._
  , Backbone = require('backbone')
  , optimist = require('optimist')
  , async = require('async')
  , watch = require('node-watch')
  , commands = new Backbone.Model
  , results = new Backbone.Model
  , count = 0
  ;

commands.set({
  custom : [
  {
    name : "Node Memory",
    cmd : "ps aux | grep node"
  }
  ]
})


results.set({
  type : os.type(),
  platform : os.platform(),
  arch : os.arch(),
  hostname : os.hostname(),
  release : os.release(),
  tmpdir : os.tmpdir(),
  cpus : os.cpus().length,
  cpuinfo : os.cpus(),
  nics : os.networkInterfaces()
})

var compile = function compileStats(params, respond) {
  params = params || {}
  if(_.has(params, "commands"))
    _.extend(commands, params.commands)
  results.set({
    load : os.loadavg(),
    totalmem : os.totalmem(),
    freemem : os.freemem(),
    uptime : os.uptime()
  })
  async.each(commands.get('custom'), function(command, nextCommand) {
    var proc = exec(command.cmd, function(err, stdout, stderr) {
      if(err) throw err
      results.set( command.name, stdout )
      nextCommand()
    })
  }, function(err, output) {
    respond(results)
  })
}

var server = http.createServer(function(req, res) {
  if(req.url == "/favicon.ico") {
    scli.warn("Ignoring /favicon.ico request")
  } else {
    count++
    scli("Request #" + count + " received, processing system information")
    compile(req.payload, function(results) {
      res.writeHead(200)
      res.end(JSON.stringify(results.toJSON()))
    })
  }
})
server.listen(1337, function() {
  scli.success("RexMon Slave is listening on port 1337!")
})