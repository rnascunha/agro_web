import {run_page} from '../libs/page.js'
import {get_user_device} from './user_info.js'

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
        if(!autoconnect && v.autoconnect)
          autoconnect = {
            username: v.username,
            server_addr: v.server_addr,
            sessionid: v.sessionid
          }
        make_session(storage, container, fields, v);
      })
      resolve(autoconnect);
    });
  });

  return promise;
}

export function init_sessions(ws, storage, auto_connect, container, fields)
{
  const load_screen = document.querySelector('#login-load-screen');

  promise_sessions(storage, container, fields)
    .then(auto => {
      if(!auto_connect || !auto) {
        load_screen.style.display = 'none';
        return
      };

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
          run_page('main', {
            ws: ws,
            username: auto.username,
            server_addr: auto.server_addr,
            message: message,
            sessionid: auto.sessionid,
            storage: storage,
            autoconnect: true,
          });
        }
      }
    };
    ws.onclose = ev => {
      load_screen.style.display = 'none';
      ws = null;
    };
    ws.onerror = ev => {};
  }).catch(e => {
    load_screen.style.display = 'none';
  });
}
