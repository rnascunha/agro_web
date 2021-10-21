import main_html from './main_job.html'
import {Persistent_Container} from '../../libs/container.js'

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

export function create_job_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return  new Persistent_Container(template,
                                  init_main_portal,
                                  finish_main_portal);
}
