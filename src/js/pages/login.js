import {input_key_only_integer} from '../libs/input_helper.js'
import {Page, page_manager} from '../libs/page.js'
import {get_user_device} from '../helper/user_info.js'
import {init_sessions, try_auto_connect} from '../libs/sessions.js'
import {Websocket_Close_Reason} from '../libs/ws_close_reason.js'
import login_html from './login.html'

function run_login({storage, registration}, auto_connect = true)
{
  let ws = null;
  const username = document.querySelector("#username"),
        password = document.querySelector("#password"),
        server = document.querySelector("#server-addr"),
        autoconnect = document.querySelector("#autoconnect"),
        connect = document.querySelector("#connect"),
        connect_label = document.querySelector("#connect-label"),
        error = document.querySelector("#error"),
        spinner = document.querySelector('#spinner');

  init_sessions(storage, document.querySelector('#sessions'),
  {
    username: username,
    password: password,
    autoconnect: autoconnect,
    server: server
  });
  try_auto_connect(ws, {storage: storage, registration: registration}, auto_connect);

  function send_login_request(sock)
  {
    sock.send(JSON.stringify({
        type: 'user',
        command: 'authenticate',
        data: {
          user: username.value,
          password: password.value,
          keep_connected: autoconnect.checked,
          user_agent: get_user_device()
        }
    }));
  }

  function show_error(err)
  {
    error.textContent = err;
    error.style.display = err ? 'block' : 'none';
  }

  function connecting()
  {
    connect_label.textContent = 'Connecting...';
    spinner.style.display = 'inline-block';
    connect.disabled = true;
  }

  function not_connecting()
  {
    connect_label.textContent = 'Connect';
    spinner.style.display = 'none';
    connect.disabled = false;
  }

  show_error();
  username.focus();

  const login = ev => {
    show_error();

    if(!username.value.length)
    {
      show_error("Username not set");
      return;
    }
    if(!password.value.length)
    {
      show_error("Password not set");
      return;
    }
    if(!server.address.length)
    {
      show_error("Server address not set");
      return;
    }

    if(!server.port.length)
    {
      show_error("Server port not set");
      return;
    }

    const full_addr = server.scheme + '://' + server.address + ':' + server.port;

    try{
        if(!ws)
          ws = new WebSocket(full_addr);
        else{
          send_login_request(ws);
        }
        connecting();

        ws.onopen = ev => {
          connect_label.textContent = 'Authenticating...';
          send_login_request(ws);
        }

        ws.onmessage = ev => {
          console.log('message', JSON.parse(ev.data));
          const message = JSON.parse(ev.data);
          if(message.type == 'user'
            && message.command == 'authenticate')
          {
            if(message.data.authenticated)
            {
              page_manager.run('main', {
                ws: ws,
                username: username.value,
                server_addr: full_addr,
                message: message,
                sessionid: message.data.sessionid,
                storage: storage,
                autoconnect: autoconnect.checked,
                registration: registration,
                policy: message.data.policy
              });
            }
          }
        }
        ws.onclose = ev => {
          // console.log('close', ev);
          not_connecting();
          show_error(`${ev.code != 1006 && ev.code in Websocket_Close_Reason ? Websocket_Close_Reason[ev.code] : 'Error connecting'}`)
          ws = null;
        }
        ws.onerror = ev => {
          // console.log('error', ev);
        }
    }
    catch(e)
    {
        console.log('catch error', e);
        show_error(e);
        ws = null;
    }
  };

  username.addEventListener('keydown', ev => {
    if(ev.key == 'Enter') login(ev);
  });
  password.addEventListener('keydown',  ev => {
    if(ev.key == 'Enter') login(ev);
  });

  connect.addEventListener('click', login);
}

const template = document.createElement('template');
template.innerHTML = login_html;
page_manager.add('login',
  new Page(template, run_login,
            {
              title: 'Agro Telemetry - Login',
              'theme-color': '#0064c8'
            }
          )
        );
