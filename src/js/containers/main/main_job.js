import main_html from './main_job.html';
import jobs_template from './jobs_template.html'
import {Persistent_Container} from '../../libs/container.js'

const template = document.createElement('template');
template.innerHTML = jobs_template;

function add_job_modal(container)
{
  const modal = document.createElement('pop-modal');

  modal.appendChild(template.content.cloneNode(true));

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  modal.show();

  return modal;
}

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

function run_once(container, instance)
{
  const table = container.querySelector('#main-job-tbody');
  container.querySelector('#job-add-btn')
    .addEventListener('click', ev => {
      document.body.appendChild(add_job_modal(container));
    });
}

export function create_job_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Persistent_Container(template,
                                  init_main_portal,
                                  finish_main_portal,
                                  run_once);
}
