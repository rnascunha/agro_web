import main_html from './main_app.html'
import {Persistent_Container} from '../../libs/container.js'
import {message_types, app_commands} from '../../messages/types.js'

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

function run_once(container, instance)
{
  const max_size_bytes = (512 * 1024),
        max_size_name = 12;

  container.querySelector('.file-input')
    .addEventListener('change', ev => {
      const files = ev.target.files;
      if(!files.length) return;

      if(files[0].name.length > max_size_name)
      {
        instance.report(report_commands.APP, report_types.warning,
          'upload app', `Invalid name size [${files[0].name}]`, `size=${files[0].name.length}/max=${max_size_name}`);
        ev.target.value = '';
        return;
      }

      if(files[0].size > max_size_bytes)
      {
        instance.report(report_commands.APP, report_types.warning,
          'upload app', `File too big [${files[0].name}]`, `size=${files[0].size}/max=${max_size_bytes}`);
        ev.target.value = '';
        return;
      }

      instance.send_app(files[0]);

      ev.target.value = '';
    });

  container.querySelector('#app-main-container')
    .addEventListener('click', ev => {
    let target = ev.target;
    while(target.tagName != 'TD')
    {
      target = target.parentNode;
      if(target.tagName == 'TR')
        return;
    }

    if(!('app' in target.parentNode.dataset)) return;

    if(target.classList.contains('app-close'))
    {
      instance.send(message_types.APP, app_commands.DELETE, [target.parentNode.dataset.app]);
      return;
    }

    if(target.classList.contains('app-download'))
    {
      instance.send(message_types.APP, app_commands.DOWNLOAD, {
        name: target.parentNode.dataset.app
      });
      return;
    }

    instance.open_app_detail(target.parentNode.dataset.app);
  });
}

export function create_app_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Persistent_Container(template,
                                  init_main_portal,
                                  finish_main_portal,
                                  run_once);
}
