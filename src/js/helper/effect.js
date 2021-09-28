
export function active_shine(element)
{
  setTimeout(() => element.classList.add('shine-active'), 0);
  setTimeout(() => element.classList.remove('shine-active'), 700);
}
