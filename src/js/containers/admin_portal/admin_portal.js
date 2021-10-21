import admin_portal_html from './admin_portal.html'
import {message_types, user_commands} from '../../messages/types.js'
import {make_message} from '../../messages/make.js'
import {user_list, add_new_user} from './admin_user.js'
import {group_list,
  // add_new_group
        } from './admin_group.js'
// import {policy_list, add_new_policy} from './admin_portal/admin_policy.js'
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
  // lists.policies = policy_list(data.data.policies,
  //   container.querySelector('#admin-policy-tbody'), lists.users, lists.groups);
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
      instance.users.add(msg.id, msg.username, msg.name, msg.email, msg.status, true);
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
            data.data.id, data.data.username, data.data.name, data.data.email, true);
          instance.groups.set_user_group(data.data.id, data.data.groups, true);
      });

  // instance.add_handler(message_types.USER,
  //   user_commands.ADD_GROUP,
  //   data => {
  //     lists.groups.add(data.data.id,
  //       data.data.name,
  //       data.data.description,
  //       data.data.members, true);
  //   });

  // instance.add_handler(message_types.USER,
  //     user_commands.DELETE_GROUP,
  //     data => {
  //       lists.groups.remove(data.data.id, true);
  //     });

  instance.send(message_types.USER,
    user_commands.USER_GROUP_POLICIES);

  container.querySelector('#admin-user-add').addEventListener('click', ev => {
    document.body.appendChild(add_new_user(instance, instance.groups));
  });

  // container.querySelector('#admin-group-add').addEventListener('click', ev => {
  //   document.body.appendChild(add_new_group(instance, lists.users));
  // });
  //
  // container.querySelector('#admin-policy-add').addEventListener('click', ev => {
  //   document.body.appendChild(add_new_policy(instance, lists.users, lists.groups));
  // });
}

function terminate_admin_portal(container, instance)
{
  instance.remove_handler(message_types.USER, user_commands.USER_GROUP_POLICIES);
  instance.remove_handler(message_types.USER, user_commands.ADD_USER);
  instance.remove_handler(message_types.USER, user_commands.DELETE_USER);
  instance.remove_handler(message_types.USER, user_commands.EDIT_USER);
}

export function create_admin_portal_container()
{
  const template = document.createElement('template');
  template.innerHTML = admin_portal_html;
  
  return new Container(template, admin_container_init, terminate_admin_portal);
}
