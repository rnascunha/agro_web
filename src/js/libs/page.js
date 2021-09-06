
function change_theme_color(color_hex)
{
  document
    .querySelector("meta[name=theme-color]")
      .setAttribute("content", color_hex);
}

export class Page
{
  constructor(template, script = null, options = {})
  {
    this._template = template;
    this._script = script;
    this._options = options;
  }

  load(...args)
  {
    document.body.innerHTML = '';
    if('title' in this._options)
    {
      window.document.title = this._options.title;
    }
    if('theme-color' in this._options)
    {
      change_theme_color(this._options['theme-color']);
    }
    document.body.appendChild(this._template.content.cloneNode(true));
    if(this._script) this._script(...args);
  }
}

export class Page_Manager
{
    constructor()
    {
      this._list = {};
      this._current = null;
    }

    get current(){ this._current; };

    add(name, page)
    {
      if(typeof name != 'string'
        || !(page instanceof Page))
        return false;

      if(name in this._list)
        return false;

      this._list[name] = page

      return true;
    }

    run(name, ...args)
    {
      if(!(name in this._list)) return false;

      this._list[name].load(...args);
      this._current = name;

      return true;
    }
}

export const page_manager = new Page_Manager();
