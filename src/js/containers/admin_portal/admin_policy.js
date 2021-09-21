import {Policy_List} from '../../classes/policy.js'
import delete_policy_html from './delete_policy.html'
import add_policy_html from './add_policy.html'
import {policy_types,
      policy_actions,
      policy_effect,
      policy_reference_types} from '../../messages/policy_types.js'
import {create_checkbox_input,
        read_all_checkbox_input,
        create_select_input} from '../../helper/input_manage.js'

const delete_template = document.createElement('template');
delete_template.innerHTML = delete_policy_html;

const add_template = document.createElement('template');
add_template.innerHTML = add_policy_html;

function delete_policy_modal(policy)
{
  const modal = document.createElement('pop-modal'),
        content = delete_template.content.cloneNode(true);

  // content.querySelector('.user-name').textContent = user.username;
  modal.appendChild(content);

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  modal.show();

  return modal;
}

function make_reference_list(container, list, ref_type)
{
  container.innerHTML = '';

}

export function add_new_policy(user_list, group_list)
{
  const modal = document.createElement('pop-modal'),
        content = add_template.content.cloneNode(true);

  const type = create_select_input(policy_types);
  content
    .querySelector('#policy-type')
    .appendChild(type);

  type.addEventListener('change', ev => {

  });

  const action = content
    .querySelector('#policy-action');
  create_checkbox_input(action, policy_actions);

  content
    .querySelector('#policy-effect')
    .appendChild(create_select_input(policy_effect));

  const ref_type = create_select_input(policy_reference_types);
  content
      .querySelector('#policy-ref-type')
      .appendChild(ref_type);

  ref_type.addEventListener('change', ev => {

  });

  modal.appendChild(content);

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  modal.show();

  return modal;
}

export function policy_list(perms, tbody, ulist, glist)
{
  tbody.innerHTML = '';
  const perm_list = new Policy_List();

  if(!perms.length)
  {
    const line = document.createElement('tr');
    line.innerHTML = '<td colspan=7><em>No policys avaiable</em></td>';
    tbody.appendChild(line);

    return perm_list;
  }

  perms.forEach(perm => {
    const line = document.createElement('tr');
    const nperm = perm_list.add(perm.id, perm.type, perm.action, perm.effect, perm.ref_type, perm.ref_id);
    line.dataset.id = perm.id;
    line.innerHTML = `<td>${nperm.id}</td>` +
                      `<td>${nperm.type_string}</td>` +
                      `<td>${nperm.action_string}</td>` +
                      `<td>${nperm.effect_string}</td>` +
                      `<td>${nperm.reference_type_string}</td>` +
                      `<td>${nperm.reference_id}</td>` +
                      `<td class=delete-data data-id=${perm.id}>&times;</td>`;

    tbody.appendChild(line);
  });

  tbody.addEventListener('click', ev => {
    if(!ev.target.classList.contains('delete-data')) return;

    document.body.appendChild(delete_policy_modal(perm_list.get_policy(ev.target.dataset.id)));
  })

  return perm_list;
}
