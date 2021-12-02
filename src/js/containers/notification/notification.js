import notification_html from './notification.html'
import {message_types, notify_commands} from '../../messages/types.js'
import {make_message} from '../../messages/make.js'
import {Container} from '../../libs/container.js'
import {Push_Notify} from '../../libs/notify.js'

export function set_notify_status(container, instance)
{
  const status = container.querySelector('#notification-status');
  if(!Push_Notify.support())
  {
      status.textContent = "Push notificaiton is not supported by your browser."
      status.classList.add('not-supported');
      status.classList.remove('enabled', 'disabled');
  }
  else
  {
    if(instance.is_subscribed)
    {
      status.textContent = "Push notification is enabled";
      status.classList.add('enabled');
      status.classList.remove('not-supported', 'disabled');
    }
    else
    {
      status.textContent = "Push notification is disabled";
      status.classList.add('disabled');
      status.classList.remove('not-supported', 'enabled');
    }
  }
}

function init(container, instance)
{
  const content = container.querySelector('#notification-content');
  instance.notify.list.forEach(noti => {
    content.querySelector(`input[value=${noti}]`).checked = true;
  });

  set_notify_status(container, instance);

  container
    .querySelector('#notification-apply')
    .addEventListener('click', ev => {
      const notify = [];
      content
        .querySelectorAll('input[type=checkbox]')
        .forEach(input => input.checked ? notify.push({name: input.value}) : null);
        instance.send(message_types.NOTIFY, notify_commands.GENERAL_SET, notify);
    });
}

function terminate(container, instance)
{}

export function create_notification_container()
{
  const template = document.createElement('template');
  template.innerHTML = notification_html;

  return new Container(template, init, terminate);
}
