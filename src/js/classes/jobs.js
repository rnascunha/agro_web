export class Job
{
  constructor(init, finish, dow, priority)
  {
    this._begin = init;
    this._end = finish;
    this._dow = dow;
    this._priority = priority;
  }

  get begin(){ return this._begin; }
  get end(){ return this._end; }
  get dow(){ return this._dow; }
  get priority(){ return this._priority; }
}
