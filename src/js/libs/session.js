
export class User{
  constructor(username, name = null)
  {
    this._username = username;
    this._name = name;
  }

  get username(){ return this._username; }
  get name(){ return this._name; }
}

export class Server{
  constructor(server_addr, name = null)
  {
    this._addr = server_addr;
    this._name = name;
  }

  get address(){ return this._addr; }
  get name(){ return this._name; }
}

export class Session{
  constructor(session_id, user, server, expires = 0)
  {
    this._session_id = session_id;
    this._user = user;
    this._server = server;
    this._expires = expires;
  }

  get session_id(){ return this._session_id; }
  get user(){ return this._user; }
  get server(){ return this._server; }
  get expires(){ return this._expires; }
}

const session_list = {};

export function add_session_list(id, session)
{
  session_list[id] = session;
}

export function get_session(id)
{
  return session_list[id].
}
