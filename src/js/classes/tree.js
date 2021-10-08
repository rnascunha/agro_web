import {draw_device_tree} from '../libs/draw_tree.js'

export class Device_Tree{
  constructor(container, container_graph)
  {
    this._unconnected = [];
    this._endpoints = []
    this._tree = [];
    this._view = [new Device_Tree_Table_View(container),
                  new Device_Tree_Graph(container_graph)];
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
    this._unconnected = data.data.unconnected;
    this._endpoints = data.data.endpoints;
    this._tree = data.data.tree;

    if(update_view)
    {
      this.update_view(instance);
    }
  }

  /**
   * View
   */
   update_view(instance)
   {
     this._view.forEach(v => v.update(this, instance));
   }
}

class Device_Tree_Table_View{
  constructor(container)
  {
    // container.appendChild(template.content.cloneNode(true));
    this._endpoints = container.querySelector('#net-devices-endpoints');
    this._unconnected = container.querySelector('#net-devices-unconnected');
    this._tree = container.querySelector('#net-devices-tree');
  }

  update(model)
  {
    this._update_unconnected(model);
    this._update_endpoints(model);
    this._update_tree(model);
  }

  _update_unconnected(model)
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

        col.textContent = dev;
        line.appendChild(col);
        this._unconnected.appendChild(line);
      });
    }
  }

  _update_endpoints(model)
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
        dcol.textContent = dev.device;
        dep.textContent = `${dev.endpoint.addr}:${dev.endpoint.port}`;

        line.appendChild(dcol);
        line.appendChild(dep);

        this._endpoints.appendChild(line);
      });
    }
  }

  _update_tree(model)
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

        dlayer.textContent = dev.layer;
        dcol.textContent = dev.device;
        dparent.textContent = dev.parent;
        dch.textContent = dev.children.join(' ');
        dch.style.wordWrap = 'break-word';
        dch.style.width = '100%';

        if(dev.layer > 0)
          dcol.dataset.device = dev.device;
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

  update(data, instance)
  {
    draw_device_tree(this._make_data(data.tree), this._container, instance);
  }

  _make_data(data)
  {
    return this._make_node('00:00:00:00:00:00', data);
  }

  _make_node(mac, data)
  {
    let device = data.find(d => d.device == mac);
    if(!device) return {};

    let nd = {
      device: mac,
      layer: device.layer,
      parent: device.parent,
      children: []
    }

    device.children.forEach(d => nd.children.push(this._make_node(d, data)));

    return nd;
  }
}
