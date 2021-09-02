export class Page{
  constructor(title, template_name, script = null)
  {
    this._title = title;
    this._template = document.head.querySelector(template_name);
    this._script = script;
  }

  get title(){ return this._title; }

  load(...args)
  {
    document.body.innerHTML = null;
    window.document.title = this._title;
    document.body.appendChild(this._template.content.cloneNode(true));
    if(this._script) this._script(...args);
  }
}

const page_list = {};
let current_page = null;

export function add_page_list(name, page)
{
  if(typeof name != 'string'
    || !(page instanceof Page))
    return false;

  if(name in page_list)
    return false;

  page_list[name] = page

  return true;
}

export function run_page(name, ...args)
{
  if(!(name in page_list)) return false;

  page_list[name].load(...args);
  current_page = name;

  return true;
}

export function get_current_page(){ return current_page; }
