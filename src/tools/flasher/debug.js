
export const debug_level = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  all: 5,
};

class Debug{
  constructor(d_level = debug_level.info)
  {
    this._level = d_level;
  }

  get level()
  {
    return this._level;
  }

  set level(val)
  {
    if(typeof val !== 'number')
    {
      return;
    }
    this._level = val;
  }

  to_log(level)
  {
    return level <= this._level;
  }

  error(log, break_line = true)
  {

  }

  warn(log, break_line = true)
  {

  }

  info(log, break_line = true)
  {

  }

  log(log, break_line = true)
  {
    return info(log, break_line);
  }

  debug(log, break_line = true)
  {

  }
}

export const No_Debug = Debug;

export class Console_Debug extends Debug{
  constructor(d_level = debug_level.info)
  {
    super(d_level);
  }

  error(log, break_line = true)
  {
    if(!this.to_log(debug_level.error)) return;
    console.error(log);
  }

  warn(log, break_line = true)
  {
    if(!this.to_log(debug_level.warn)) return;
    console.warn(log);
  }

  info(log, break_line = true)
  {
    if(!this.to_log(debug_level.info)) return;
    console.log(log);
  }

  debug(log, break_line = true)
  {
    if(!this.to_log(debug_level.debug)) return;
    console.debug(log);
  }
}

export class Terminal_Debug extends Debug{
  constructor(terminal, d_level = debug_level.info)
  {
    super(d_level);
    this._terminal = terminal;
  }

  _write(color, log, break_line)
  {
    this._terminal.write('\x1B[' + color + 'm' + log + '\x1B[0m' + (break_line ? '\r\n' : ''));
  }

  error(log, break_line = true)
  {
    if(!this.to_log(debug_level.error)) return;
    this._write('1;31', log, break_line);
  }

  warn(log, break_line = true)
  {
    if(!this.to_log(debug_level.warn)) return;
    this._write('1;33', log, break_line);
  }

  info(log, break_line = true)
  {
    if(!this.to_log(debug_level.info)) return;
    this._write('0', log, break_line);
  }

  debug(log, break_line = true)
  {
    if(!this.to_log(debug_level.debug)) return;
    this._write('1;34', log, break_line);
  }
}

export class Combined_Debug extends Debug{
  constructor(...args)
  {
    super();
    this._debugs = args;
  }

  get list()
  {
    return this._debugs;
  }

  error(log, break_line = true)
  {
    if(!this.to_log(debug_level.error)) return;
    this._debugs.forEach(d => {
      d.error(log, break_line);
    });
  }

  warn(log, break_line = true)
  {
    if(!this.to_log(debug_level.warn)) return;
    this._debugs.forEach(d => {
      d.warn(log, break_line);
    });
  }

  info(log, break_line = true)
  {
    if(!this.to_log(debug_level.info)) return;
    this._debugs.forEach(d => {
      d.info(log, break_line);
    });
  }

  debug(log, break_line = true)
  {
    if(!this.to_log(debug_level.debug)) return;
    this._debugs.forEach(d => {
      d.debug(log, break_line);
    });
  }
}
