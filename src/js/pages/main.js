import {Page, page_manager} from '../libs/page.js'
import main_html from './main.html'
import {Instance} from '../classes/instance.js'
import {Logged} from '../classes/user.js'
import {Policy} from '../classes/policy.js'
import {policy_types} from '../messages/policy_types.js'
import {Notify_View_Icon, Notify} from '../libs/notify.js'
import {message_types,
        user_commands,
        device_commands,
        sensor_commands,
        image_commands,
        app_commands,
        report_commands} from '../messages/types.js'
import {create_admin_portal_container} from '../containers/admin_portal/admin_portal.js'
import {create_sensor_type_container} from '../containers/sensor/sensor_type_main.js'
import {create_main_container} from '../containers/main/main_portal.js'
import {create_device_container} from '../containers/main/main_device.js'
import {create_net_container} from '../containers/main/main_net.js'
import {create_job_container} from '../containers/main/main_job.js'
import {create_image_container} from '../containers/main/main_image.js'
import {create_app_container} from '../containers/main/main_app.js'
import {Container_Manager} from '../libs/container.js'
import {Report} from '../classes/report.js'
import {Detail_View} from '../classes/detail_view.js'

function logout_start()
{
  document.querySelector('#main-load-screen').show();
}

function blur_dropmenu()
{
  document.querySelectorAll('.drop-menu').forEach(el => el.blur());
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

function update_endpoints(instance, data)
{
    data.data.tree.forEach(d => {
      const ep = instance.tree.get_endpoint(d.device);
      if(ep)
      {
        instance.device_list.process({
          type: message_types.DEVICE,
          command: device_commands.DATA,
          data: {
            device: d.device,
            endpoint: ep
          }
        }, true);
      }
    })
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

  /**
   * Creating container
   */
  const main_device = create_device_container(),
        main_net = create_net_container(),
        main_image = create_image_container(),
        main_container = create_main_container(),
        main_job = create_job_container(),
        main_app = create_app_container();

  const main_content = document.querySelector('#main-content');

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
                                  detail: new Detail_View(),
                                  main_content: main_content,
                                  device_table: main_device.container.querySelector('#main-device-tbody'),
                                  tree_container: main_net.container.querySelector('#net-container-list'),
                                  tree_graph: main_net.container.querySelector('#net-container-tree'),
                                  image_table: main_image.container.querySelector('#main-image-tbody'),
                                  app_table: main_app.container.querySelector('#main-app-tbody')
                                }
                              });
  const report = new Report(document.querySelector('#report-history-container'),
                            document.querySelector('#report-pop'));

  /**
   * Enable/disabling containers that are only avaiable to user admins
   */
  Policy.can(instance.logged_user, policy_types.user_admin)
    ? Policy.show_user_admin_element()
    : Policy.hide_user_admin_element();

    /**
     * Initiating main container manager
     */
    const main_manager = new Container_Manager(main_content);
    /**
     * registering all main containers containers
     */
    main_manager.add('main', main_container);
    main_manager.add('user_admin', create_admin_portal_container());
    main_manager.add('device', main_device);
    main_manager.add('net', main_net);
    main_manager.add('job', main_job);
    main_manager.add('image', main_image);
    main_manager.add('app', main_app);
    main_manager.add('sensor_type', create_sensor_type_container());

  /**
   * Initiaing persistent containers
   */
   main_device.install(instance);
   main_net.install(instance);
   main_image.install(instance);
   main_app.install(instance);

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
                      });
  instance.add_handler(message_types.DEVICE,
                      device_commands.EDIT,
                      data => {
                        instance.device_list.process(data);
                      });
  instance.add_handler(message_types.DEVICE,
                      device_commands.TREE,
                      data => {
                        instance.tree.process(data, instance, true);
                        instance.device_list.set_connected(data.data.unconnected, true);
                        update_endpoints(instance, data);
                      });
  instance.add_handler(message_types.DEVICE,
                      device_commands.CUSTOM_RESPONSE,
                      data => {
                        instance.device_list.process(data);
                      });
  instance.add_handler(message_types.SENSOR,
                      sensor_commands.LIST,
                      data => {
                        instance.sensor_type_list.process(data, true);
                      });
  instance.add_handler(message_types.IMAGE,
                      image_commands.LIST,
                      data => {
                        instance.image_list.process(data, instance, true);
                      });
  instance.add_handler(message_types.APP,
                      app_commands.LIST,
                      data => {
                        instance.app_list.process(data, instance, true);
                      });
  instance.add_handler(message_types.REPORT,
                      report_commands.DEVICE,
                      data => {
                        report.add(data.data, true);
                      });
  instance.add_handler(message_types.REPORT,
                      report_commands.LIST,
                      data => {
                        report.add(data.data, true);
                      });
  instance.add_handler(message_types.REPORT,
                      report_commands.IMAGE,
                      data => {
                        report.add(data.data, true);
                      });
  instance.add_handler(message_types.REPORT,
                      report_commands.APP,
                      data => {
                        report.add(data.data, true);
                      });

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
     blur_dropmenu();
  });

  /**
   * Setting Report history event
   */
   document.querySelector('#menu-report-history')
    .addEventListener('click', ev => {
      report.show();
      blur_dropmenu()
  });

  /**
   *
   */
  document.querySelector('#menu-sensor-type')
    .addEventListener('click', ev => {
    main_manager.run('sensor_type', instance);
    //This is to make the drop menu disappear
    blur_dropmenu()
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
     * Redrawing tree at the end of animation
     */
    // side_menu.addEventListener('transitionend', () => {
    //   instance.tree.update_view(instance);
    // });

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
 (function()
 {
  const template = document.createElement('template');
  template.innerHTML = main_html;
  page_manager.add('main',
            new Page(
              template,
              run_main,
              {
                title: 'Agro Telemetry',
                'theme-color': '#0a1496'
              }
            )
          );
})();
