import main_html from './main_portal.html'
import {Container} from '../../libs/container.js'

const template = document.createElement('template');
template.innerHTML = main_html;

function init_main_portal(container, instance)
{
  console.log('main containet init');
}

function finish_main_portal(container, instance)
{
  console.log('main container finish');
}

export const main_container = new Container(template,
                                            init_main_portal,
                                            finish_main_portal);
