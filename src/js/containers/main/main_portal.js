import main_html from './main_portal.html'
import {Container} from '../../libs/container.js'

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

export function create_main_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Container(template,
                      init_main_portal,
                      finish_main_portal);
}
