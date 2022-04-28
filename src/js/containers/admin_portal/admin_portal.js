import admin_portal_html from './admin_portal.html'
import {message_types, user_commands, notify_commands} from '../../messages/types.js'
import {make_message} from '../../messages/make.js'
import {user_list, add_new_user} from './admin_user.js'
import {group_list} from './admin_group.js'
import {User_Info_List} from '../../classes/user.js'
import {Group_List} from '../../classes/groups.js'
import {Container} from '../../libs/container.js'

function user_group_policies(data, container, instance)
{
  const user_tbody = container.querySelector('#admin-user-tbody'),
        group_tbody = container.querySelector('#admin-group-tbody');
  instance.users = new User_Info_List(user_tbody);
  instance.groups = new Group_List(instance.users, group_tbody);
  user_list(instance, data.data.users,
    container.querySelector('#admin-user-tbody'));
  group_list(instance, data.data.groups,
    container.querySelector('#admin-group-tbody'));
}

function notify_config(data, container, instance)
{
  Object.entries(data.data).forEach(([key, value]) => {
    switch(key)
    {
      case 'mail':
      {
        const cont = container.querySelector('#notify-mail');
        cont.querySelector('#notify-mail-check').checked = value.enable;
        cont.querySelector('#notify-mail-server').value = value.server;
        cont.querySelector('#notify-mail-port').value = value.port;
        cont.querySelector('#notify-mail-user').value = value.user;
        cont.querySelector('#notify-mail-password').value = value.password;
      }
      break;
      case 'telegram':
      {
        const cont = container.querySelector('#notify-telegram');
        cont.querySelector('#notify-telegram-check').checked = value.enable;
        cont.querySelector('.input-text').value = value.token;
      }
      break;
      case 'push':
      {
        container
          .querySelector('#notify-push')
          .querySelector('#notify-push-check').checked = value.enable
      }
      break;
      default:
      break;
    }
  });
}

function admin_container_init(container, instance)
{
  instance.add_handler(message_types.USER,
    user_commands.USER_GROUP_POLICIES,
    user_group_policies, container, instance
  );

  instance.add_handler(message_types.USER,
    user_commands.ADD_USER,
    data => {
      const msg = data.data;
      instance.users.add(msg.id, msg.username, msg.name, msg.email, msg.telegram_chat_id, msg.status, true);
      if('groups' in msg && Array.isArray(msg.groups))
      {
        instance.groups.add_user_to_groups(msg.id, msg.groups, true);
      }
    });

  instance.add_handler(message_types.USER,
      user_commands.DELETE_USER,
      data => {
        instance.users.remove(data.data.id, true);
        instance.groups.remove_all_user(data.data.id, true);
      });

  instance.add_handler(message_types.USER,
      user_commands.EDIT_USER,
      data => {
          instance.users.update(
            data.data.id, data.data.username, data.data.name, data.data.email, data.data.telegram_chat_id, true);
          instance.groups.set_user_group(data.data.id, data.data.groups, true);
      });
  instance.add_handler(message_types.NOTIFY,
      notify_commands.CREDENTIAL_LIST,
      notify_config, container, instance);

  instance.send(message_types.USER,
    user_commands.USER_GROUP_POLICIES);

  instance.send(message_types.NOTIFY,
    notify_commands.CREDENTIAL_LIST);

  container.querySelector('#admin-user-add').addEventListener('click', ev => {
    document.body.appendChild(add_new_user(instance, instance.groups));
  });

  container.querySelector('#notify-update-credentials').addEventListener('click', ev => {
    const noti = {};
    {
      const cont = container.querySelector('#notify-mail'), mail = {};
      mail.enable = cont.querySelector('#notify-mail-check').checked;
      mail.server = cont.querySelector('#notify-mail-server').value;
      mail.port = cont.querySelector('#notify-mail-port').value;
      mail.user = cont.querySelector('#notify-mail-user').value;
      mail.password = cont.querySelector('#notify-mail-password').value;
      noti.mail = mail;
    }
    {
      const cont = container.querySelector('#notify-telegram'), telegram =  {};
      telegram.enable = cont.querySelector('#notify-telegram-check').checked;
      telegram.token = cont.querySelector('.input-text').value;
      noti.telegram = telegram;
    }
    {
      const push = {
        enable: container
            .querySelector('#notify-push')
            .querySelector('#notify-push-check').checked
      }
      noti.push = push;
    }
    instance.send(message_types.NOTIFY,
      notify_commands.UPDATE_CREDENTIAL,
      noti
    );
  });

  container.querySelector("#mail-option-container").addEventListener('click', ev => {
    let t = ev.target;
    while(!('comp' in t.dataset))
    {
      t = t.parentNode;
      if(t == container) return;
    }

    const smtp_servers_config = {
      google: {server: 'smtp.gmail.com', port: '465'},
      yahoo: {server: 'smtp.mail.yahoo.com', port: '465'},
    };

    if(t.dataset.comp in smtp_servers_config)
    {
      const cont = container.querySelector('#notify-mail');
      cont.querySelector('#notify-mail-server').value = smtp_servers_config[t.dataset.comp].server;
      cont.querySelector('#notify-mail-port').value = smtp_servers_config[t.dataset.comp].port;
    }
  });
}

function terminate_admin_portal(container, instance)
{
  instance.remove_handler(message_types.USER, user_commands.USER_GROUP_POLICIES);
  instance.remove_handler(message_types.USER, user_commands.ADD_USER);
  instance.remove_handler(message_types.USER, user_commands.DELETE_USER);
  instance.remove_handler(message_types.USER, user_commands.EDIT_USER);
  instance.remove_handler(message_types.NOTIFY, notify_commands.CREDENTIAL_LIST);
}

export function create_admin_portal_container()
{
  const template = document.createElement('template');
  template.innerHTML = admin_portal_html;

  return new Container(template, admin_container_init, terminate_admin_portal);
}
