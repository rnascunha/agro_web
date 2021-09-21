import {Page, page_manager} from '../libs/page.js'
import main_html from './main.html'
import {Instance} from '../classes/instance.js'
import {Logged} from '../classes/user.js'
import {Policy} from '../classes/policy.js'
import {policy_types} from '../messages/policy_types.js'
import {Notify_Container, Notify} from '../libs/notify.js'
import {message_types, user_commands} from '../messages/types.js'
import {admin_portal} from '../containers/admin_portal/admin_portal.js'
import {main_container} from '../containers/main/main_portal.js'
import {Container_Manager} from '../libs/container.js'

function logout_start()
{
  document.querySelector('#main-load-screen').show();
}

function notify_handler(data, instance)
{
  if(!Notify.support()) return;

  const notify = new Notify(
    instance.ws,
    instance.username,
    data.data.key,
    instance.registration,
    new Notify_Container());

    notify.get_subscription();
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

  const instance = new Instance(data.ws,
                                new Logged(data.message.data.id,
                                          data.message.data.username,
                                          data.message.data.name,
                                          data.message.data.email,
                                          data.message.data.status,
                                          data.sessionid,
                                          data.policy),
                                data.server_addr,
                                data.registration,
                                data.storage);

  Policy.can(instance.logged_user, policy_types.user_admin)
    ? Policy.show_user_admin_element()
    : Policy.hide_user_admin_element();

  instance.add_handler(message_types.USER, user_commands.NOTIFY_KEY, notify_handler, instance);

  const main_manager = new Container_Manager(document.querySelector('#main-content'));
  main_manager.add('main', main_container);
  main_manager.add('user_admin', admin_portal);

  document.querySelector('#menu-username').textContent = data.username;
  document.querySelector('#admin-portal').addEventListener('click', ev => {
      main_manager.run('user_admin', instance);
  });

  document.querySelector('#title').addEventListener('click', ev =>{
    main_manager.run('main', instance);
  });

  main_manager.run('main', instance);

  document
    .querySelector('#main-disconnect')
      .addEventListener('click', ev => {
        logout_start();

        instance.send(message_types.USER,
          user_commands.LOGOUT, {
          username: data.username,
          sessionid: data.sessionid
        });
      });

    document.querySelector('#main-menu')
      .addEventListener('click', ev => {
        instance.send('test', 'invalid');
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
