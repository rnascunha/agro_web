import {draw_device_tree} from '../libs/draw_tree.js'

export class Device_Tree{
  constructor(container, container_graph)
  {
    this._unconnected = [];
    this._endpoints = []
    this._tree = [];
    this._view = [new Device_Tree_Table_View(container),
                  new Device_Tree_Graph(container_graph)];

    this._show_name = false;
  }

  get unconnected(){ return this._unconnected; }
  get endpoints(){ return this._endpoints; }
  get tree(){ return this._tree; }

  get_endpoint(addr)
  {
    let dev = this._unconnected.find(a => a == addr);
    if(dev) return false;

    dev = this._tree.find(a => a.device == addr);
    if(!dev) return false;
    if(dev.layer <= 0) return false;

    while(dev.layer != 1)
    {
      dev = this._tree.find(a => a.device == dev.parent);
      if(!dev) return false;
    }

    let ep = this._endpoints.find(a => a.device);
    if(!ep) return false;

    return ep.endpoint;
  }

  process(data, instance, update_view = false)
  {
    this._unconnected = []
    data.data.unconnected.forEach(d => {
      if(d in instance.device_list.list)
        this._unconnected.push(instance.device_list.list[d]);
        instance.device_list.list[d].children = [];
    });

    this._endpoints = [];
    data.data.endpoints.forEach(d => {
      if(d.device in instance.device_list.list)
        this._endpoints.push(instance.device_list.list[d.device]);
    });

    this._tree = [];
    data.data.tree.forEach(d => {
      if(d.device in instance.device_list.list)
      {
        this._tree.push(instance.device_list.list[d.device]);
        instance.device_list.list[d.device].children = d.children;
      }
      else if(d.layer == -1 || d.layer == 0)
      {
        this._tree.push({mac: d.device, layer: d.layer, children: d.children});
      }
    });

    if(update_view)
    {
      this.update_view(instance, this._show_name);
    }
  }

  /**
   * View
   */
   update_view(instance, show_name)
   {
     this._show_name = show_name === undefined ? this._show_name : show_name;
     this._view.forEach(v => v.update(this, instance, this._show_name));
   }
}

class Device_Tree_Table_View{
  constructor(container)
  {
    this._endpoints = container.querySelector('#net-devices-endpoints');
    this._unconnected = container.querySelector('#net-devices-unconnected');
    this._tree = container.querySelector('#net-devices-tree');
  }

  update(model, instance, show_name)
  {
    this._update_unconnected(model, show_name);
    this._update_endpoints(model, show_name);
    this._update_tree(model, show_name);
  }

  _update_unconnected(model, show_name)
  {
    if(!model.unconnected.length)
    {
      this._unconnected.innerHTML = '<tr><td><em>No devices unconnected</em></td></tr>';
    }
    else
    {
      this._unconnected.innerHTML = '';
      model.unconnected.forEach(dev => {
        const line = document.createElement('tr'),
              col = document.createElement('td');

        col.dataset.device = dev.mac;
        col.textContent = get_name(dev, show_name);
        line.appendChild(col);
        this._unconnected.appendChild(line);
      });
    }
  }

  _update_endpoints(model, show_name)
  {
    if(!model.endpoints.length)
    {
      this._endpoints.innerHTML = '<tr><td colspan=2><em>No endpoints avaiable</em></td></tr>';
    }
    else
    {
      this._endpoints.innerHTML = '';
      model.endpoints.forEach(dev => {
        const line = document.createElement('tr'),
              dcol = document.createElement('td'),
              dep = document.createElement('td');
        dcol.dataset.device = dev.mac;
        dcol.textContent = get_name(dev, show_name);
        dep.textContent = `${dev.endpoint.addr}:${dev.endpoint.port}`;

        line.appendChild(dcol);
        line.appendChild(dep);

        this._endpoints.appendChild(line);
      });
    }
  }

  _update_tree(model, show_name)
  {
    if(!model.tree.length)
    {
      this._tree.innerHTML = '<tr><td colspan=5><em>No devices connected</em></td></tr>';
    }
    else
    {
      this._tree.innerHTML = '';
      model.tree.forEach(dev => {
        const line = document.createElement('tr'),
              dlayer = document.createElement('td'),
              dparent = document.createElement('td'),
              dcol = document.createElement('td'),
              dch = document.createElement('td');

        dlayer.textContent = dev.layer != -1 ? dev.layer : '-';
        dcol.textContent = dev.layer != -1 ? get_name(dev, show_name) : 'daemon';
        dparent.textContent = dev.layer == -1 ? '-' : (dev.layer == 0) ?
                                                        'daemon'
                                                        : get_device_name(dev.parent, model.tree, show_name);
        dch.style.width = '100%';

        dev.children.forEach((c, i, chl) => {
          const s = document.createElement('span');
          // s.textContent = c + ' ';
          s.textContent = get_device_name(c, model.tree, show_name);
          if(dev.layer > -1)
            s.dataset.device = c;
          dch.appendChild(s);
          if(i = (chl.length - 1))
          {
            dch.appendChild(document.createElement('br'));
          }
        });

        if(dev.layer > 0)
          dcol.dataset.device = dev.mac;
        if(dev.layer > 1)
          dparent.dataset.device = dev.parent;

        line.appendChild(dlayer);
        line.appendChild(dcol);
        line.appendChild(dparent);
        line.appendChild(dch);

        this._tree.appendChild(line);
      });
    }
  }
}

class Device_Tree_Graph{
  constructor(container)
  {
    this._container = container;
  }

  update(data, instance, show_name)
  {
    draw_device_tree(this._make_data(data.tree), this._container, instance, show_name);
  }

  _make_data(data)
  {
    return this._make_node('00:00:00:00:00:00', data);
  }

  _make_node(mac, data)
  {
    let device = data.find(d => d.mac == mac);
    if(!device) return {};

    let nd = {
      device: device,
      children: []
    }

    device.children.forEach(d => nd.children.push(this._make_node(d, data)));

    return nd;
  }
}

function get_name(device, show_name)
{
  if(!show_name) return device.mac;
  return device.name ? device.name : device.mac;
}

function get_device_name(device, data, show_name)
{
  if(!show_name) return device;

  let devp = data.find(d => d.mac == device || d.mac_ap == device);
  if(!devp) return device;
  return devp.name ? devp.name : device;
}
