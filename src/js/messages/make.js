
export function make_message(type, command, data)
{
  return JSON.stringify({
    type: type,
    command: command,
    data: data
  });
}
