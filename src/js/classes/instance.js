import {Response_Handler_List} from './websocket.js'
import {Device_List, Device_Detail_View} from './device.js'
import {make_message} from '../messages/make.js'
import {message_types} from '../messages/types.js'
import {page_manager} from '../libs/page.js'
import {Device_Tree} from './tree.js'
import {Image_List, Image_Detail_View} from './image.js'
import {App_List, App_Detail_View} from './app.js'
import {download} from '../helper/download.js'

const binary_type = {
  JSON: 0,
  IMAGE: 1,
  APP: 2
};

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
    this._server_addr = server_addr;
    this._registration = registration;
    this._storage = storage;
    this._device_list = new Device_List(options.containers.device_table);
    this._response_handler = new Response_Handler_List();
    this._tree = new Device_Tree(options.containers.tree_container,
                                  options.containers.tree_graph);
    this._images = new Image_List(options.containers.image_table);
    this._apps = new App_List(options.containers.app_table);
    this._detail = options.containers.detail;
    this._main_content = options.containers.main_content;

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
  get image_list(){ return this._images; }
  get app_list(){ return this._apps; }

  get detail(){ return this._detail; }

  get main_container(){ return this._main_content; }

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

  send_image(file)
  {
    return this._send_binary_data(file, binary_type.IMAGE);
  }

  send_app(file)
  {
    return this._send_binary_data(file, binary_type.APP);
  }

  report(comamnd, type, reference, message, arg = '')
  {
    this._ws.send(make_message(message_types.REPORT, comamnd, {
      type: type, reference: reference, message: message, arg: arg
    }))
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

  open_image_detail(image_name, show = true)
  {
    const image = this.image_list.list[image_name];
    if(!image) return false;

    this._detail.clear();

    const view = new Image_Detail_View(this._detail.content, this);
    view.update(image);

    if(show)
      this._detail.show();

    this._detail.register_close('detail', device => {
      image = null;
    });

    return this._detail;
  }

  open_app_detail(app_name, show = true)
  {
    const app = this.app_list.list[app_name];
    if(!app) return false;

    this._detail.clear();

    const view = new App_Detail_View(this._detail.content, this);
    view.update(app);

    if(show)
      this._detail.show();

    this._detail.register_close('detail', device => {
      app = null;
    });

    return this._detail;
  }

  /*
   *
   */
   _send_binary_data(file, type)
   {
     let reader = new FileReader(),
         rawData = new ArrayBuffer();

     reader.loadend = function() {

     }

     reader.onload = (e) => {
       rawData = e.target.result;
       this._ws.send(this._make_binary_data(file.name, file.size, rawData, type));
     }

     reader.readAsArrayBuffer(file);
   }

  _make_binary_data(name, size, file, type)
  {
    /** type + size_name + name + file */
    let data = new Uint8Array(1 + 1 + name.length + size),
        name_enc = new TextEncoder().encode(name);

    data.set(new Uint8Array([type]), 0);
    data.set(new Uint8Array([name.length]), 1);
    data.set(name_enc, 2);
    data.set(new Uint8Array(file), 2 + name_enc.length);

    return data.buffer;
  }

  _register_ws_events()
  {
    this._ws.binaryType = "arraybuffer";
    this._ws.onmessage = ev => {
      if(typeof ev.data === 'string')
      {
        try{
          const message = JSON.parse(ev.data);
          this._response_handler.run(message);
        }
        catch(e)
        {
            console.error("Error parsing message", ev.data, e);
        }
      }
      else
      {
          this._read_binary_data(ev.data);
      }
    }

    this._ws.onclose = ev => {
      console.log('close');
      page_manager.run('login', {storage: this._storage, registration: this._registration}, false);
    }
  }

  _read_binary_data(data)
  {
    console.log(data);
    const array = new Uint8Array(data);
    const type = array.slice(0, 1)[0],
          name_size = new Uint16Array(array.slice(1,3))[0],
          name = new TextDecoder().decode(new Uint8Array(array.slice(3, 3 + name_size))),
          file = new Uint8Array(array.slice(3 + name_size));

    download(name, file);
  }
}
