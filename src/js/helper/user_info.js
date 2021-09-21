export function get_user_device()
{
  return navigator.userAgent.match(/\(([^()]*)\)/)[1];
}
