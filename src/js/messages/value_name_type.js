
export function object_get_by_value(object, value)
{
  let v = null;
  Object.values(object).some(o => {
    if(o.value == value)
    {
      v = o;
      return true;
    }
  });
  return v;
}

export function object_get_by_name(object, name)
{
  let v = null;
  Object.values(object).some(o => {
    if(o.name == value)
    {
      v = o;
      return true;
    }
  });
  return v;
}

export class Object_Value_Name
{
  constructor(object)
  {
    this._obj = object;
  }

  by_name(name)
  {
    return object_get_by_name(this._obj, name);
  }

  by_value(value)
  {
    return object_get_by_value(this._obj, value);
  }
}
