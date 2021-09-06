import {Page, page_manager} from '../libs/page.js'
import main_html from './main.html'
import {Notify_Container, Notify} from '../libs/notify.js'

function logout_start()
{
  document.querySelector('#main-load-screen').show();
}

function run_main(data)
{
  if(data.storage)
  {
    data.storage.save('sessions', {
      index: `${data.username}@${data.server_addr}`,
      username: data.username,
      server_addr: data.server_addr,
      autoconnect: data.autoconnect,
      date: new Date()
    });
    data.storage.save_key('instance', {
      username: data.username,
      server_addr: data.server_addr,
      autoconnect: data.autoconnect,
      sessionid: data.sessionid,
      date: new Date()
    }, 'autoconnect');
  }
  const ws = data.ws;
  ws.onmessage = ev => {
    console.log('message', ev.data);

    const message = JSON.parse(ev.data);
    if(message.type == 'user' && message.command == 'notify_key')
    {
      if(!Notify.support()) return;

      const notify = new Notify(
        data.ws,
        data.username,
        message.data.key,
        data.registration,
        new Notify_Container());

        notify.get_subscription();
    }
  }

  ws.onclose = ev => {
    console.log('close');
    page_manager.run('login', {storage: data.storage, registration: data.registration}, false);
  }

  document
    .querySelector('#main-disconnect')
      .addEventListener('click', ev => {
        logout_start();

        console.log('Disconnect');
        ws.send(JSON.stringify({
          type: 'user',
          command: 'logout',
          data: {
            username: data.username,
            sessionid: data.sessionid
          }
        }));
      });

    document.querySelector('#main-menu')
      .addEventListener('click', ev => {
        ws.send(JSON.stringify({
          type: 'test',
          command: 'invalid'
        }));
      });
}

const div = document.createElement('div');
div.innerHTML = main_html;
page_manager.add('main',
          new Page(
            div.firstChild,
            run_main,
            {
              title: 'Agro Telemetry',
              'theme-color': '#0a1496'
            }
          )
        );
