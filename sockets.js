'use strict';

var config = require('./config');

var Utils = require('./utils');
var Message = require('./Message');

function SetupSockets(Server) {

  var io = require('socket.io')(Server);

  if(config.redis) {
    io.adapter(require('socket.io-redis')(config.redis));
  }

  io.on('connection', function(socket) {
    console.log('a user connected');
    var authorized;

    // must authorize within 30 seconds
    var authTimeout = setTimeout(function() {
      socket.disconnect();
    }, 30000);

    socket.on('authorize', function(data) {
      authorized = Utils.checkAuth(data.api_key);
      if(authorized) {
        clearTimeout(authTimeout);
        socket.emit('authorized', 'OK');
      }
    });

    socket.on('disconnect', function() {
      console.log('user disconnected');
    });

    socket.on('join_room', function(data) {
      console.log('joined '+data.room);
      socket.join(data.room);
    });

    socket.on('leave_room', function(data) {
      console.log('left '+data.room);
      socket.leave(data.room);
    });

    socket.on('start_coanchor_stream', function(data) {
      Utils.reBroadcast(socket, 'start_coanchor_stream', data);
    });

    socket.on('end_stream', function(data) {
      Utils.reBroadcast(socket, 'end_stream', data);
    });

    socket.on('end_coanchor_stream', function(data) {
      Utils.reBroadcast(socket, 'end_coanchor_stream', data);
    });

    socket.on('message', function(msg) {
      if(authorized) {
        var handlerOptions = {
          message: msg,
          socket: socket
        };
        Message(handlerOptions).handleMessage();
      }
    });

  });

  return io;
}
module.exports = SetupSockets;
