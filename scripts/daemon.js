
const WebSocket = require('ws');

const url = "ws://localhost:8081/";
const user = 'rafael', password = '123456';
let authenticated = false;

try{
  const ws = new WebSocket(url);

  ws.onopen = ev => {
    console.log('Connected! Sending autheincated packet...');
    ws.send(JSON.stringify({
        type: 'user',
        command: 'authenticate',
        data: {
          user: user,
          password: password,
          keep_connected: false,
          user_agent: 'daemon'
        }
    }));
  }

  ws.onmessage = ev => {
    const message = JSON.parse(ev.data);
    if(!authenticated)
    {
      if(message.type == 'user'
        && message.command == 'authenticate')
      {
        console.log("Received autheincated packet...");
        if(message.data.authenticated)
        {
          console.log(`User '${user}' authenticated`);
          authenticated = true;
          console.log("Packet auth", message)
        }
        else
        {
          console.warn(`Failed authenticating user '${user}'!`, message);
        }
      }
    }
    else {
      console.log("Recived packet", message);
    }
  }
  ws.onclose = ev => {
    console.log('Socket closed (' + ev.code + ')');
    ws = null;
  }

  ws.onerror = ev => {
    console.error('Socket error', ev);
  }
}
catch(e)
{
    console.error(`Error opening Websocket URL '${url}'`, e);
}
