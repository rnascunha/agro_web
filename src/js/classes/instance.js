import {Response_Handler_List} from './websocket.js'
import {Device_List, Device_Detail_View} from './device.js'
import {make_message} from '../messages/make.js'
import {page_manager} from '../libs/page.js'
import {Device_Tree} from './tree.js'

export class Instance
{
  constructor(ws,
              logged,
              server_addr,
              registration,
              storage,
              options)
  {
    this._ws = ws;
    this._logged = logged;
    this._registration = registration;
    this._storage = storage;
    this._device_list = new Device_List(options.containers.device_table);
    this._response_handler = new Response_Handler_List();
    this._tree = new Device_Tree(options.containers.tree_container, options.containers.tree_graph);
    this._detail = options.containers.detail;

    this._register_ws_events();
  }

  get ws(){ return this._ws; }
  get logged_user(){ return this._logged; }
  get username(){ return this._logged.info.username; }
  get session_id(){ return this._logged.session_id; }
  get policy(){ return this._logged.policy; }
  get server_addr(){ return this._server_addr; }
  get registration(){ return this._registration; }

  get device_list(){ return this._device_list; }
  get tree(){ return this._tree; }

  get detail(){ return this._detail; }

  add_handler(type, command, ...args)
  {
    this._response_handler.add(type, command, ...args);
  }

  remove_handler(type, command)
  {
    this._response_handler.remove(type, command);
  }

  send(type, command, data)
  {
    this._ws.send(make_message(type, command, data));
  }

  open_device_detail(mac, show = true)
  {
    const device = this.device_list.list[mac];
    if(!device) return false;

    this._detail.clear();

    const view = new Device_Detail_View(this._detail.content, this);
    device.register_view('detail', view);
    view.update(device);

    if(show)
      this._detail.show();

    this._detail.register_close('detail', device => {
      device.register_view('detail');
      device = null;
    })

    return this._detail;
  }

  _register_ws_events()
  {
    this._ws.onmessage = ev => {
      try{
        const message = JSON.parse(ev.data);
        this._response_handler.run(message);
      }
      catch(e)
      {
          console.error("Error parsing message", ev.data, e);
      }
    }

    this._ws.onclose = ev => {
      console.log('close');
      page_manager.run('login', {storage: this._storage, registration: this._registration}, false);
    }
  }
}
