import {Page, page_manager} from '../libs/page.js'
import main_html from './main.html'
import {Instance} from '../classes/instance.js'
import {Logged} from '../classes/user.js'
import {Policy} from '../classes/policy.js'
import {policy_types} from '../messages/policy_types.js'
import {Notify_View_Icon, Notify} from '../libs/notify.js'
import {message_types,
        user_commands,
        device_commands} from '../messages/types.js'
import {admin_portal} from '../containers/admin_portal/admin_portal.js'
import {main_container} from '../containers/main/main_portal.js'
import {main_device} from '../containers/main/main_device.js'
import {main_net} from '../containers/main/main_net.js'
import {main_job} from '../containers/main/main_job.js'
import {main_image} from '../containers/main/main_image.js'
import {main_app} from '../containers/main/main_app.js'
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
    new Notify_View_Icon());

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
                                data.storage,
                              {
                                containers: {
                                  device_table: main_device.container.querySelector('#main-device-tbody')
                                }
                              });

  /**
   * Enable/disabling containers that are only avaiable to user admins
   */
  Policy.can(instance.logged_user, policy_types.user_admin)
    ? Policy.show_user_admin_element()
    : Policy.hide_user_admin_element();

  /**
   * Adding instance handlers (websocket handlers)
   */
  instance.add_handler(message_types.USER,
                      user_commands.NOTIFY_KEY,
                      notify_handler,
                      instance);
  instance.add_handler(message_types.DEVICE,
                      device_commands.LIST,
                      data => {
                        instance.device_list.process(data);
                      });
  instance.add_handler(message_types.DEVICE,
                      device_commands.DATA,
                      data => {
                        instance.device_list.process(data);
                      })
  instance.add_handler(message_types.DEVICE,
                      device_commands.EDIT,
                      data => {
                        instance.device_list.process(data);
                      })

  /**
   * Initiating main container manager
   */
  const main_manager = new Container_Manager(document.querySelector('#main-content'));
  /**
   * registering all main containers containers
   */
  main_manager.add('main', main_container);
  main_manager.add('user_admin', admin_portal);
  main_manager.add('device', main_device);
  main_manager.add('net', main_net);
  main_manager.add('job', main_job);
  main_manager.add('image', main_image);
  main_manager.add('app', main_app);

  /**
   * Initiaing persistent containers
   */
   main_device.install(instance);

  /**
   * Setting username
   */
  document.querySelector('#menu-username').textContent = data.username;

  /**
   * User admin portal event
   */
  document.querySelector('#admin-portal').addEventListener('click', ev => {
      main_manager.run('user_admin', instance);
      //This is to make the drop menu disappear
      document.querySelectorAll('.drop-menu').forEach(el => el.blur());
  });

  /**
   * Title event (go to main container)
   */
  document.querySelector('#title').addEventListener('click', ev =>{
    main_manager.run('main', instance);
  });

  /**
   * Initiating main container
   */
  main_manager.run('main', instance);

  /**
   * Disconnect event
   */
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

    /**
     * Size menu show event
     */
    const side_menu = document.querySelector('#main-side-menu');
    document.querySelector('#main-menu')
      .addEventListener('click', ev => {
        side_menu.classList.toggle('show-menu');
      });

    /**
     * Instanling size menu events
     */
    document.querySelector('#main-dashboard')
      .addEventListener('click', ev => {
      main_manager.run('main', instance);
    });
    document.querySelector('#main-dashboard-device')
      .addEventListener('click', ev => {
      main_manager.run('device', instance);
    });
    document.querySelector('#main-dashboard-net')
      .addEventListener('click', ev => {
      main_manager.run('net', instance);
    });
    document.querySelector('#main-dashboard-job')
      .addEventListener('click', ev => {
      main_manager.run('job', instance);
    });
    document.querySelector('#main-dashboard-image')
      .addEventListener('click', ev => {
      main_manager.run('image', instance);
    });
    document.querySelector('#main-dashboard-app')
      .addEventListener('click', ev => {
      main_manager.run('app', instance);
    });
}

/**
 * Creating and registering main page
 */
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
