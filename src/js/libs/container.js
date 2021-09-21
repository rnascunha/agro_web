export class Container
{
  constructor(template, script_init = null, script_end = null)
  {
    this._template = template;
    this._script_init = script_init;
    this._script_end = script_end;
  }

  load(container, ...args)
  {
    container.appendChild(this._template.content.cloneNode(true));
    if(this._script_init)
    {
      this._script_init(container, ...args);
    }
  }

  terminate(container, ...args)
  {
    if(this._script_end)
    {
      this._script_end(container, ...args);
    }
  }
}

export class Container_Manager{
  constructor(container, options = {})
  {
    this._container = container;
    this._list = {};
    this._current_name = null;
  }

  get current(){ return this._current_name; }

  add(name, container)
  {
    if(typeof name != 'string' ||
      !(container instanceof Container))
      return false;

    if(name in this._list) return false;
    this._list[name] = container;
  }

  run(name, ...args)
  {
    if(this._current_name == name) return;
    if(this._current_name)
    {
      this._list[this._current_name].terminate(this._container, ...args);
    }
    this._current_name = null;
    this._container.innerHTML = '';

    if(name in this._list)
    {
      this._list[name].load(this._container, ...args);
      this._current_name = name;
    }
  }
}
