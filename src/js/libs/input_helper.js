export function input_key_only_integer(event, min = null, max = null)
{
  if(is_special_key(event)) return;
  if(!(event.keyCode >= 48 && event.keyCode <= 57))
  {
    event.preventDefault();
    return;
  }

  let value = event.target.value + event.key;

  if(min
    && Number.isInteger(min)
    && value
    && parseInt(value) < min)
  {
    event.preventDefault();
    return;
  }

  if(max
    && Number.isInteger(max)
    && value
    && parseInt(value) > max)
  {
    event.preventDefault();
  }
}

export function is_special_key(event)
{
  return (event.key.length > 1) ? true : false;
}
