
export class User_Group
{
  constructor(id, name, description, members)
  {
    this._id = id;
    this._name = name;
    this._description = description;
    this._members = members;
  }

  get size(){ return Object.keys(this._members).length; }

  get id(){ return this._id; }
  get name(){ return this._name; }
  get description(){ return this._description; }
  get members(){ return this._members; }
  get size(){ return this._members.length; }

  add_user(uid)
  {
    const has = this._members.find(id => id == uid);
    if(!has)
    {
      this._members.push(uid);
    }
  }

  contain(uid)
  {
    const has = this._members.find(id => id == uid);
    return has ? true : false;
  }

  remove_user(id)
  {
    this._members = this._members.filter(uid => uid != id);
  }

  /**
   * View
   */
   get_table_view(user_list)
   {
     const line = document.createElement('tr');
     line.dataset.id = this._id;

     let members = [];
     this._members.forEach(m => {
       const user = user_list.get_user(m);
       members.push(user ? user.username : `id:${m}`)
     });

     line.innerHTML = `<td>${this._id}</td>` +
                       `<td>${this._name}</td>` +
                       `<td>${this._description}</td>` +
                       `<td>${this.size}</td>` +
                       `<td>${members.join(' / ')}</td>`;
                       //+ `<td class=delete-data data-id=${this._id}>&times;</td>`;
      return line;
   }
}

export class Group_List{
  constructor(user_list, container)
  {
    this._list = {};
    this._user_list = user_list;
    this._view = new Group_List_Table_View(this, container);
  }

  get size()
  {
    return Object.keys(this._list).length;
  }

  get list()
  {
    return this._list;
  }

  add(id, name, description, members, update_view = false)
  {
    this._list[id] = new User_Group(id, name, description, members);
    if(update_view)
    {
      this.update_view();
    }
  }

  set_user_group(uid, gids, update_view = false)
  {
    this.remove_all_user(uid, false);
    this.add_user_to_groups(uid, gids, false);

    update_view && this.update_view();
  }

  contain_user(uid)
  {
    return Object.values(this._list).filter(group => group.contain(uid));
  }

  add_user_to_groups(uid, group_list, update_view = false)
  {
    group_list.forEach(gid => {
      if(gid in this._list)
      {
        this._list[gid].add_user(uid);
      }
    });

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

  remove_all_user(uid, update_view = false)
  {
    Object.values(this._list).forEach(group => group.remove_user(uid));
    if(update_view)
    {
      this.update_view();
    }
  }

  get_group(id)
  {
    return this._list[id];
  }

  update_view()
  {
    this._view.update_view(this._user_list);
  }
}

class Group_List_Table_View{
  constructor(model, container)
  {
    this._model = model;
    this._container = container;
  }

  update_view(user_list)
  {
    this._container.innerHTML = '';
    if(!this._model.size)
    {
      this._container.innerHTML = '<tr><td colspan=6><em>No groups avaiable</em></td></tr>';
      return;
    }

    Object.values(this._model.list).forEach(group => {
      this._container.appendChild(group.get_table_view(user_list));
    })
  }
}
