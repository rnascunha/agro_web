import main_html from './main_app.html'
import {Persistent_Container} from '../../libs/container.js'

const template = document.createElement('template');
template.innerHTML = main_html;

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

export const main_app = new Persistent_Container(template,
                                            init_main_portal,
                                            finish_main_portal);
