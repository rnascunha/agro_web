import main_html from './main_image.html'
import {Persistent_Container} from '../../libs/container.js'
import {report_types,
        report_commands,
        message_types,
        image_commands
        } from '../../messages/types.js'

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

function run_once(container, instance)
{
  const max_size_bytes = (2 * 2 * 2 * 2 * 1024 * 1024),
        max_size_name = 30;

  container.querySelector('.file-input')
    .addEventListener('change', ev => {
      const files = ev.target.files;
      if(!files.length) return;

      if(files[0].name.length > max_size_name)
      {
        instance.report(report_commands.IMAGE, report_types.warning,
          'upload image', `Invalid name size [${files[0].name}]`, `size=${files[0].name.length}/max=${max_size_name}`);
        ev.target.value = '';
        return;
      }

      if(files[0].size > max_size_bytes)
      {
        instance.report(report_commands.IMAGE, report_types.warning,
          'upload image', `File too big [${files[0].name}]`, `size=${files[0].size}/max=${max_size_bytes}`);
        ev.target.value = '';
        return;
      }

      instance.send_image(files[0]);

      ev.target.value = '';
    });

  container.querySelector('#image-main-container')
    .addEventListener('click', ev => {
    let target = ev.target;
    while(target.tagName != 'TD')
    {
      target = target.parentNode;
      if(target.tagName == 'TR')
        return;
    }

    if(!('image' in target.parentNode.dataset)) return;

    if(target.classList.contains('image-close'))
    {
      instance.send(message_types.IMAGE, image_commands.DELETE, [target.parentNode.dataset.image]);
      return;
    }

    if(target.classList.contains('image-download'))
    {
      console.log('download ' + target.parentNode.dataset.image);
      return;
    }

    instance.open_image_detail(target.parentNode.dataset.image);
  });
}

export function create_image_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Persistent_Container(template,
                                  init_main_portal,
                                  finish_main_portal,
                                  run_once);
};
