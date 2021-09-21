
export const user_status = {
  INVALID: {value: -1, name: 'invalid'},
  ACTIVE: {value: 0, name: 'active'},
  INACTIVE: {value: 1, name: 'inactive'},
  SUSPENDED: {value: 2, name: 'suspended'},
  DELETED: {value: 3, name: 'deleted'}
}

const username_min_length = 4;
const username_max_length = 12;
const username_not_allowed = ['root', 'system'];
const password_min_length = 6;

/**
 *
 */
export const invalid_id = -1;
export const root_id = 0;
export const root_username = 'root';
export const root_name = 'root';

export class User_Info
{
  constructor(id, username, name, email, status)
  {
    this._id = id;
    this._username = username;
    this._name = name;
    this._email = email;
    this._status = status;
  }

  get id(){ return this._id; }
  get username(){ return this._username; }
  get name(){ return this._name; }
  get email(){ return this._email; }
  get status(){ return this._status; }
  get status_string()
  {
    return User_Info.status_string(this._status);
  }

  update(username, name, email)
  {
    this._username = username;
    this._name = name;
    this._email = email;
  }

  static status_string(status)
  {
    let v = Object.values(user_status).find(a => a.value == status);
    if(v) return v.name;
    return '';
  }

  static check_username(username)
  {
    if(!username.length)
    {
      return {err: true, message: "Empty 'username' not allowed"};
    }

    if(username_not_allowed.find(u => u == username))
    {
      return {err: true, message: `Username '${username}' is not allowed`};
    }

    if(username.length < username_min_length)
    {
      return {err: true, message: `'username' minimum length: ${username_min_length}`};
    }

    if(username.length > username_max_length)
    {
      return {err: true, message: `'username' maximum length: ${username_max_length}`};
    }

    if(username.indexOf(' ') != -1)
    {
      return {err: true, message: "'username' can't have space (' ') character"};
    }

    return {err: false};
  }

  static check_password(password)
  {
    if(!password.length)
    {
      return {err: true, message: "Empty 'password' not allowed"};
    }

    if(password.length < password_min_length)
    {
      return {err: true, message: `'password' minimum length: ${password_min_length}`};
    }

    return {err: false};
  }

  /*
   * View
   */
   get_table_view()
   {
     const line = document.createElement('tr');
     line.dataset.id = this._id;

     line.innerHTML = `<td>${this._id}</td>` +
                       `<td>${this._username}</td>` +
                       `<td>${this._name}</td>` +
                       `<td>${this._email}</td>` +
                       `<td>${this.status_string}</td>` +
                       `<td class=delete-data data-id=${this._id}>&times;</td>`;

    return line;
  }
}

export class User_Info_List
{
  constructor(container)
  {
      this._list = {};
      this._view = new User_Info_List_Table_View(this, container);
  }

  get list()
  {
    return this._list;
  }

  get size()
  {
    return Object.keys(this._list).length;
  }

  add(id, username, name, email, status, update_view = false)
  {
    this._list[id] = new User_Info(id, username, name, email, status);
    if(update_view)
    {
      this.update_view();
    }
  }

  update(id, username, name, email, update_view = false)
  {
    if(!(id in this._list)) return;
    this._list[id].update(username, name, email);

    update_view && this.update_view();
  }

  remove(id, update_view = false)
  {
    delete this._list[id];
    if(update_view)
    {
      this.update_view();
    }
  }

  get_user(id)
  {
    return this._list[id];
  }

  get_user_by_username(username)
  {
    return Object.values(this._list).find(user => user.username == username);
  }

  check_username(username)
  {
    let check = User_Info.check_username(username);
    if(check.err) return check;

    if(this.get_user_by_username(username))
    {
      return {err: true, message: `'${username}' is already been used`};
    }

    return {err: false};
  }

  /**
   * Views
   */
   update_view()
   {
     this._view.update_view();
   }
}

class User_Info_List_Table_View{
  constructor(model, container)
  {
    this._model = model;
    this._container = container;

    this.update_view();
  }

  update_view()
  {
    this._container.innerHTML = '';
    if(!this._model.size)
    {
      this._container.innerHTML = '<tr><td colspan=6><em>No users avaiable</em></td></tr>';
      return;
    }

    Object.values(this._model.list).forEach(user => {
      this._container.appendChild(user.get_table_view());
    });
  }
}

export class Logged
{
  constructor(id, username, name, email, status, session_id, policy)
  {
    this._info = new User_Info(id, username, name, email, status);
    this._session_id = session_id;
    this._policy = policy;
  }

  get id(){ return this._info.id; }
  get info(){ return this._info; }
  get session_id(){ return this._session_id; }
  get policy(){ return this._policy; }
}
