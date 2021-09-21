
class Response_Handler
{
  constructor(type, command, callback, ...args)
  {
    this._type = type;
    this._command = command;
    this._cb = callback;
    this._args = args;
  }

  run(data)
  {
    this._cb(data, ...this._args);
  }
}

export class Response_Handler_List
{
  constructor()
  {
    this._responses = {};
  }

  add(type, command, ...args)
  {
    this._responses[this._make_index(type, command)] = new Response_Handler(type, command, ...args);
  }

  remove(type, command)
  {
    delete this._responses[this._make_index(type, command)];
  }

  run(data)
  {
    if(!('type' in data) || !('command' in data))
    {
      console.error('Invalid message', data);
      return;
    }

    const index = this._make_index(data.type, data.command);
    if(index in this._responses)
    {
      this._responses[index].run(data);
      return;
    }
    console.warn(`No handler register to ${index}.`);
  }

  _make_index(type, command)
  {
    return `${type}@${command}`;
  }
}
