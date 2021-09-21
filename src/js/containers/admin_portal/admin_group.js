import {message_types, user_commands} from '../../messages/types.js'
// import delete_group_html from './delete_group.html'
// import add_group_html from './add_group.html'

// const delete_template = document.createElement('template');
// delete_template.innerHTML = delete_group_html;
//
// const add_template = document.createElement('template');
// add_template.innerHTML = add_group_html;

function checkbox_user_list(user_list, container)
{
  container.innerHTML = '';
  Object.values(user_list.list).forEach(user => {
    const label = document.createElement('label'),
          input = document.createElement('input'),
          span = document.createElement('span');

    label.classList.add('group-user-check');
    input.type = 'checkbox';
    input.value = user.id;
    span.textContent = user.username;

    label.appendChild(input);
    label.appendChild(span);

    container.appendChild(label);
  })
}

function read_checkbox_user_list(container)
{
  let users = [];
  container.querySelectorAll('input').forEach(u => {
    if(u.checked) users.push(+u.value)
  });

  return users;
}

function delete_group_modal(instance, group)
{
  const modal = document.createElement('pop-modal'),
        content = delete_template.content.cloneNode(true);

  content.querySelector('.group-name').textContent = group.name;
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
      instance.send(message_types.USER, user_commands.DELETE_GROUP, {
        id: group.id
      });
      modal.delete();
    }
  })

  modal.show();

  return modal;
}

export function add_new_group(instance, user_list)
{
  const modal = document.createElement('pop-modal');
  modal.appendChild(add_template.content.cloneNode(true));

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  const button_yes = modal.querySelector('#option-yes'),
        button_no = modal.querySelector('#option-no'),
        list_user_container = modal.querySelector('#group-user-list');

  if(!user_list.size)
  {
    list_user_container.innerHTML = '<span><em>No users avaiable</em></span>';
  }
  else
  {
    checkbox_user_list(user_list, list_user_container);
  }

  modal.addEventListener('click', ev => {
    if(ev.target == button_no)
    {
      modal.delete();
      return;
    }
    if(ev.target == button_yes)
    {
      const name = modal.querySelector('#group-name').value,
            description = modal.querySelector('#group-description').value;
      instance.send(message_types.USER, user_commands.ADD_GROUP, {
        name: name,
        description: description,
        members: read_checkbox_user_list(list_user_container)
      });
      modal.delete();
    }
  })

  modal.show();

  return modal;
}

let table_event = null;

export function group_list(instance, groups, tbody)
{
  tbody.innerHTML = '';

  groups.forEach(group => {
    instance.groups.add(group.id, group.name, group.description, group.members, false);
  });
  instance.groups.update_view();

  if(table_event)
  {
    tbody.removeEventListener('click', table_event);
  }

  table_event = ev => {
    if(!ev.target.classList.contains('delete-data'))
    {
      return;
    }

    document.body
      .appendChild(
        delete_group_modal(instance,
          instance.groups.get_group(ev.target.dataset.id)));
  }
  tbody.addEventListener('click', table_event);
}
