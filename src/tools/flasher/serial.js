export class Serial{
  constructor(serial_type, view_type, ...args)
  {
    this._devices = [];
    this._index = 0;

    navigator.serial.addEventListener('connect', (e) => {
      this._add(e.target, true);
    });

    navigator.serial.addEventListener('disconnect', (e) => {
      this._remove(e.target, true);
    });

    this._view = new view_type(this, ...args);

    this._serial_type = serial_type;

    this.update_ports();
  }

  get size()
  {
    return this._devices.length;
  }

  get devices()
  {
    return this._devices;
  }

  get view()
  {
    return this._view;
  }

  by_index(index)
  {
    return this._devices.find(d => d.index == index);
  }

  update_ports()
  {
    navigator.serial.getPorts().then((ports) => {
      const n_devices = [];
      ports.forEach(d => {
        const has = this._devices.find(p => p.device == d);
        if(!has)
        {
          n_devices.push(new this._serial_type(d, this._index++))
        }
        else
        {
          n_devices.push(has);
        }
      });
      this._devices = n_devices;
      this._update_view();
    });
  }

  request_ports()
  {
    navigator.serial.requestPort().then((port) => {
      this._add(port, true);
    }).catch((e) => {
      // console.log('request nok', e);
    });
  }

  _add(device, update_view = false)
  {
    const has = this._devices.find(p => p.device == device);
    if(!has)
    {
      this._devices.push(new this._serial_type(device, this._index++))
    }

    if(update_view) this._update_view();
  }

  _remove(device, update_view = false)
  {
    this._devices = this._devices.filter(d => d.device != device);
    if(update_view) this._update_view();
  }

  _update_view()
  {
    this._view.update_view();
  }

  static support()
  {
    return 'serial' in navigator;
  }
}

export class Serial_Device{
  constructor(device, index)
  {
    this._device = device;
    this._index = index;

    this._reader = null;
    this._input_stream = null;

    this._output_stream = null;
    this._read_cb = function(){};
  }

  register_cb(callback)
  {
    const cb = this._read_cb;
    this._read_cb = callback;
    return cb;
  }

  get full_name()
  {
    const info = this._device.getInfo();
    return 'serial' + this._index + ` [${info.usbVendorId.toString(16).padStart(4, '0')}:${info.usbProductId.toString(16).padStart(4, '0')}]`;
  }

  is_open()
  {
    return this._input_stream != null;
  }

  get name()
  {
    return 'serial' + this._index;
  }

  get index()
  {
    return this._index;
  }

  get device()
  {
    return this._device;
  }

  async set_baudrate(baud)
  {
    await this.close();
    await this.open(baud  );
  }

  async open(baudrate, read_cb = null)
  {
    await this._device.open({ baudRate: baudrate });

    if(read_cb)
    {
      this.register_cb(read_cb);
    }

    this._input_stream = this._device.readable;
    this._reader = this._input_stream.getReader();

    this._output_stream = this._device.writable;

    this._read();
  }

  async close()
  {
    if(this._reader)
    {
      await this._reader.cancel();
      this._input_stream = null;
      this._reader = null;
    }

    if (this._output_stream)
    {
      await this._output_stream.getWriter().close();
      this._output_stream = null;
    }

    await this._device.close();
  }

  async _read()
  {
    while (true)
    {
      const { value, done } = await this._reader.read();
      if (done)
      {
        this._reader.releaseLock();
        return;
      }
      if(this._read_cb)
      {
        this._read_cb(value);
      }
    }
  }

  read_timeout(timeout = 3000)
  {
    return new Promise((resolve, reject) => {
      const handler = setTimeout(() => reject('timeout'), timeout);
      this.register_cb(value => {
        clearTimeout(handler);
        resolve(value);
        this.register_cb(null);
      });
    });
  }

  async write(data)
  {
    const writer = this._output_stream.getWriter();
    await writer.write(data);
    writer.releaseLock();
  }

  async signals(signals)
  {
    await this._device.setSignals(signals);
  }
}
