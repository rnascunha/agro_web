
export const debug_level = {
  all: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  none: 0
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
    if(typeof val !== 'number' || val > debug_level.error)
    {
      return;
    }
    this._level = val;
  }

  to_log(level)
  {
    return level >= this._level;
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

export class ConsoleDebug extends Debug{
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

export class TerminalDebug extends Debug{
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
