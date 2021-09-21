import {root_id} from './user.js';

export class Policy{
  static can(user, policy_type)
  {
    if(user.id == root_id) return true;

    return user.policy & policy_type;
  }

  static hide_user_admin_element(container = document.body)
  {
    container.querySelectorAll('.is-admin').forEach(el => {
      el.style.display = 'none';
    })
  }

  static show_user_admin_element(container = document.body)
  {
    container.querySelectorAll('.is-admin').forEach(el => {
      el.style.display = '';
    })
  }
}
