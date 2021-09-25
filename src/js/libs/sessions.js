import {page_manager} from '../libs/page.js'
import {get_user_device} from '../helper/user_info.js'

const template_session = document.querySelector('#template-login-session'),
      options = { weekday: 'short',
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hourCycle: 'h24'};

function make_session(storage, container, fields, values)
{
  const session = template_session.content.cloneNode(true),
        server_str = values.server_addr,
        user = values.username,
        span = document.createElement('span'),
        index = `${user}@${server_str}`;
  session.querySelector('.session-info').textContent = index;
  session.querySelector('.session-last-login').textContent = values.date.toLocaleDateString(undefined, options);

  const sdata = session.querySelector('.session-data'),
        serase = session.querySelector('.session-erase');
  sdata.addEventListener('click', ev => {
    fields.username.value = user;

    let [scheme, host] = server_str.split('://');
    fields.server.scheme = scheme;
    let [addr, port] = host.split(':');
    fields.server.address = addr;
    fields.server.port = port;

    fields.autoconnect.checked = values.autoconnect;

    fields.password.value = '';
    fields.password.focus();
  });

  serase.addEventListener('click', ev => {
    span.parentNode.removeChild(span);
    storage.erase('sessions', index);
  });

  span.appendChild(session);
  container.appendChild(span);
}

function promise_sessions(storage, container, fields)
{
  let promise = new Promise((resolve, reject) => {
    let autoconnect = null;
    if(!storage) reject(null);

    let sessions = [];
    storage.iterate('sessions', null, 'next', cursor => {
      sessions.push(cursor.value);
      return true;
    }, () => {
      sessions.sort((a,b) => a.date.getTime() < b.date.getTime() ? 1 : -1);
      sessions.forEach(v => {
        make_session(storage, container, fields, v);
      })
      resolve();
    });
  });

  return promise;
}

export function try_auto_connect(ws, {storage, registration}, auto_connect)
{
  const load_screen = document.querySelector('#login-load-screen');

  if(!storage)
  {
    load_screen.hide();
  }

  if(!auto_connect)
  {
    load_screen.hide()
    storage.erase('instance', 'autoconnect');
    return;
  }

  storage.load('instance', 'autoconnect', auto => {
    if(!auto)
    {
      load_screen.hide();
      return;
    }

    if(!auto.autoconnect)
    {
      load_screen.hide();
      return;
    }

    ws = new WebSocket(auto.server_addr);
    ws.onopen = ev => {
      ws.send(JSON.stringify({
        type: 'user',
        command: 'auth_session_id',
        data: {
          user: auto.username,
          sessionid: auto.sessionid,
          user_agent: get_user_device()
        }
      }));
    };

    ws.onmessage = ev => {
      const message = JSON.parse(ev.data);
      if(message.type == 'user'
        && message.command == 'authenticate')
      {
        if(message.data.authenticated)
        {
          page_manager.run('main', {
            ws: ws,
            username: auto.username,
            server_addr: auto.server_addr,
            message: message,
            sessionid: auto.sessionid,
            storage: storage,
            autoconnect: true,
            registration: registration,
            policy: message.data.policy
          });
        }
      }
    };
    ws.onclose = ev => {
      load_screen.hide()
      ws = null;
    };
    ws.onerror = ev => {};
  }, error => {
    load_screen.hide()
  });
}

export function init_sessions(storage, container, fields)
{
  promise_sessions(storage, container, fields);
}
