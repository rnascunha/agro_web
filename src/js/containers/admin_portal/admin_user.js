import {message_types, user_commands} from '../../messages/types.js'
import {User_Info} from '../../classes/user.js'
import add_user_html  from './add_user.html'
import delete_user_html  from './delete_user.html'
import edit_user_html  from './edit_user.html'

const delete_template = document.createElement('template');
delete_template.innerHTML = delete_user_html;

const add_template = document.createElement('template');
add_template.innerHTML = add_user_html;

const edit_template = document.createElement('template');
edit_template.innerHTML = edit_user_html;

function make_checkbox_groups(group_list, container, check = [])
{
  container.innerHTML = '';
  Object.values(group_list.list).forEach(group => {
    const label = document.createElement('label'),
          input = document.createElement('input'),
          span = document.createElement('span');

    label.classList.add('group-user-check');
    input.type = 'checkbox';
    input.value = group.id;
    span.textContent = group.name;

    if(check.find(g => g.id == group.id))
    {
      input.checked = true;
    }

    label.appendChild(input);
    label.appendChild(span);

    container.appendChild(label);
  })
}

function read_checkbox_group_list(container)
{
  let users = [];
  container.querySelectorAll('input').forEach(u => {
    if(u.checked) users.push(+u.value)
  });

  return users;
}

function delete_user_modal(instance, id)
{
  const modal = document.createElement('pop-modal'),
        content = delete_template.content.cloneNode(true),
        user = instance.users.get_user(id);

  content.querySelector('.user-name').textContent = user.username;
  modal.appendChild(content);

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  const button_yes = modal.querySelector('#option-yes'),
        button_no = modal.querySelector('#option-no');

  modal.addEventListener('click', ev => {
    if(ev.target == button_no)
    {
      modal.delete();
      return;
    }
    if(ev.target == button_yes)
    {
      instance.send(message_types.USER, user_commands.DELETE_USER, {
        id: user.id
      });
      modal.delete();
    }
  })

  modal.show();

  return modal;
}

export function add_new_user(instance)
{
  const modal = document.createElement('pop-modal');
  modal.appendChild(add_template.content.cloneNode(true));

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  const username = modal.querySelector('#username'),
        name = modal.querySelector('#name'),
        password = modal.querySelector('#password'),
        email = modal.querySelector('#email'),
        button_yes = modal.querySelector('#option-yes'),
        button_cancel = modal.querySelector('#option-cancel'),
        group_list_check = modal.querySelector("#add-user-group-list"),
        error = modal.querySelector('.popup-error');

  make_checkbox_groups(instance.groups, group_list_check);

  modal.addEventListener('click', ev => {
    if(ev.target == button_cancel)
    {
      modal.delete();
      return;
    }
    if(ev.target == button_yes)
    {
      let check = instance.users.check_username(username.value);
      if(check.err)
      {
        error.textContent = check.message;
        return;
      }
      check = User_Info.check_password(password.value);
      if(check.err)
      {
        error.textContent = check.message;
        return;
      }

      instance.send(message_types.USER, user_commands.ADD_USER, {
        username: username.value,
        name: name.value ? name.value : username.value,
        password: password.value,
        email: email.value,
        groups: read_checkbox_group_list(group_list_check)
      });
      modal.delete();
    }
  })

  modal.show();

  return modal;
}

function edit_user_modal(instance, id)
{
  const modal = document.createElement('pop-modal'),
        user = instance.users.get_user(id);

  modal.classList.add('popup-modal');
  modal.appendChild(edit_template.content.cloneNode(true));

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  const user_id = modal.querySelector('#user-id'),
        username = modal.querySelector('#username'),
        name = modal.querySelector('#name'),
        email = modal.querySelector('#email'),
        button_yes = modal.querySelector('#option-yes'),
        button_cancel = modal.querySelector('#option-cancel'),
        group_list_check = modal.querySelector("#add-user-group-list");

  user_id.textContent = user.id;
  username.textContent = user.username;
  name.textContent = user.name;
  email.textContent = user.email ? user.email : '<no email>';

  make_checkbox_groups(instance.groups,
    group_list_check,
    instance.groups.contain_user(user.id));

  modal.addEventListener('click', ev => {
    if(ev.target == button_cancel)
    {
      modal.delete();
      return;
    }
    if(ev.target == button_yes)
    {
      instance.send(message_types.USER, user_commands.EDIT_USER, {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        groups: read_checkbox_group_list(group_list_check)
      });
      modal.delete();
    }
  })

  modal.show();

  return modal;
}

let table_event = null;

export function user_list(instance, users, tbody)
{
  users.forEach(user => {
    instance.users.add(user.id, user.username, user.name, user.email, user.status, false);
  });
  instance.users.update_view();

  if(table_event)
  {
    tbody.removeEventListener('click', table_event);
  }

  table_event = ev => {
      if(ev.target.classList.contains('delete-data'))
      {
        document.body.appendChild(delete_user_modal(instance, ev.target.dataset.id));
      }
      else
      {
        let line = ev.composedPath()[1];
        if('id' in line.dataset)
        {
          document.body.appendChild(
            edit_user_modal(instance, line.dataset.id))
        }
      }
  }
  tbody.addEventListener('click', table_event);
}
