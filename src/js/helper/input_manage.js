
export function create_checkbox_input(container, object, default_checked = [])
{
  Object.values(object).forEach(obj => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = obj.value;
    if(default_checked.includes(obj.value))
    {
      input.checked = true;
    }

    const label = document.createElement('label'),
          span = document.createElement('span');
    span.textContent = obj.name;
    label.appendChild(input);
    label.appendChild(span);

    container.appendChild(label);
  })
}

export function read_all_checkbox_input(container)
{
  let checked = [];
  container.querySelectorAll('input[type=checkbox]').forEach(input => {
    if(input.checked) checked.push(input.value);
  })

  return checked;
}

export function create_select_input(object, default_select = null)
{
  const sel = document.createElement('select');
  Object.values(object).forEach(obj => {
    const option = document.createElement('option');
    option.value = obj.value;
    option.textContent = obj.name;
    if(default_select && default_select == obj.value)
    {
      option.selected = true;
    }

    sel.appendChild(option);
  });

  return sel;
}
