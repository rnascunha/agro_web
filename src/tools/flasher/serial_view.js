import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {SLIP} from './slip.js';
import {mac_to_string} from './utility.js';

const SYNC_BAUDRATE = 115200;
const MONITOR_BAUDRATE = 115200;

export class Serial_View{
  constructor(model, container)
  {
    this._model = model;
    this._container = container;
    this._ports = container.querySelector('#serial-ports-list');
    this._baudrate = container.querySelector('#serial-ports-baudrate');

    this._open = container.querySelector('#serial-open-port');
    this._monitor = container.querySelector('#serial-monitor-port');
    this._erase_flash = container.querySelector('#serial-erase-flash');

    this._terminal = new Terminal({cursorBlink: true, termName: 'Serial Data'});
    const fitAddon = new FitAddon();
    this._terminal.loadAddon(fitAddon);

    this._terminal.open(container.querySelector('#terminal-container'));
    fitAddon.fit();

    this._terminal.write('Welcome to \x1B[1;3;31mESPTool Monitor Flasher\x1B[0m\r\n\r\n');

    container
      .querySelector('#serial-request-port')
      .addEventListener('click', () => {
        this._model.request_ports();
    });

    container
      .querySelector('#serial-get-ports')
      .addEventListener('click', ev => {
        this._model.update_ports();
      });

    this._ports.addEventListener('click', ev => {
      if(!this._model.devices.length)
      {
        this._model.request_ports();
      }
    });

    this._open
      .addEventListener('click', ev => {
        const dev = this._selected_device();
        if(!dev)
        {
          return;
        }
        if(dev.is_open())
        {
          dev.close().then(() => {
            this._set_state(false);
          });
          return;
        }
        this._open_bootloader(dev);
      });

      this._monitor.addEventListener('click', ev => {
        this.reset();
      });

    this._erase_flash
      .addEventListener('click', ev => {
        const dev = this._selected_device();
        if(dev && dev.is_open())
        {
          this._terminal.write('Erasing flash...\r\n');
          dev.erase_flash()
            .then(() => this._terminal.write('Flash erased...\r\n'))
            .catch(e => this._terminal.write(`Flash erase ERROR [${e}]\r\n`));
        }
      });

    container.querySelector('#clear-terminal')
      .addEventListener('click', ev => {
        this._terminal.clear();
      });

    this._set_state(false);
  }

  selected()
  {
    return this._ports.selectedOptions[0];
  }

  baudrate()
  {
    return +this._baudrate.selectedOptions[0].value;
  }

  async reset()
  {
    const dev = this._selected_device();
    if(dev)
    {
      try
      {
        if(!dev.is_open())
        {
          await dev.open(MONITOR_BAUDRATE, value => this._terminal.write(value));
        }
        else
          await dev.set_port_baudrate(MONITOR_BAUDRATE)

        await dev.signal_reset();
        dev.register_cb(value => this._terminal.write(value));
        this._set_state(false);
      }
      catch(e)
      {
        console.log('reset fail', e);
      }
    }
  }

  update_view()
  {
    this._check_open();

    if(!this._model.size)
    {
      this._ports.innerHTML = '<option value=-1>No ports</option>';
      this._ports.classList.add('hide-first-opiton');
      return;
    }

    const selected = this.selected();
    this._ports.innerHTML = '';
    this._ports.classList.remove('hide-first-opiton');

    this._model.devices.forEach(port => {
      const op = document.createElement('option');
      op.value = port.index;
      op.textContent = port.full_name;

      if(port.index == +selected.value)
      {
        op.selected = true;
      }

      this._ports.appendChild(op);
    });
  }

  write(string, break_line = true)
  {
    this._terminal.write(string + (break_line ? '\r\n' : ''));
  }

  _check_open()
  {
    const index = +this.selected().value;
    if(index < 0)
    {
      this._set_state(false);
      return;
    }
    const dev = this._model.by_index(index);
    if(!dev)
    {
      this._set_state(false);
      return;
    }
    this._set_state(dev.is_open());
  }

  _set_state(open)
  {
    if(open)
    {
      this._open.textContent = 'Close';
      this._ports.disabled = true;
      this._baudrate.disabled = true;
      // this._monitor.disabled = false;
      this._erase_flash.disabled = false;
    }
    else
    {
      this._open.textContent = 'Open';
      this._ports.disabled = false;
      this._baudrate.disabled = false;
      // this._monitor.disabled = true;
      this._erase_flash.disabled = true;
    }
  }

  _selected_device()
  {
    const index = +this.selected().value;
    if(index < 0)
    {
      return false;
    }
    return this._model.by_index(index);
  }

  selected_device()
  {
    return this._selected_device();
  }

  async open_bootloader()
  {
    const dev = this._selected_device();
    if(!dev)
    {
      return;
    }

    await this._open_bootloader(dev);

    return dev;
  }

  async _open_bootloader(device)
  {
    try{
      await device.open(SYNC_BAUDRATE, value => this._terminal.write(value));

      this._terminal.write(`Bootloading ${device.name}...\r\n`);
      await device.signal_bootloader()
      this._terminal.write("Entered bootloader\r\n");

      this._terminal.write("Syncing...\r\n");
      await device.sync();
      this._terminal.write(`Synced\r\n`);

      const reg = await device.chip()
      this._terminal.write("Chip family: " + reg + "\r\n");

      const efuses = await device.efuses()
      const mac = device.mac();
      if(!mac)
      {
        this._terminal.write('Error reading MAC\r\n');
        return;
      }
      this._terminal.write(`MAC: ${mac_to_string(mac)}\r\n`);

      this._terminal.write(`Uploading stub...\r\n`);
      await device.upload_stub()
      this._terminal.write(`Stub uploaded succefully\r\n`);

      if(this.baudrate() != SYNC_BAUDRATE)
      {
        await  device.set_baudrate(this.baudrate());
        this._terminal.write('Baudrate updated to ' + this.baudrate() + '\r\n');
      }

      try
      {
        const flash_size = await device.detect_flash_size();
        this._terminal.write((flash_size ? "Flash size detected: " :
                            "Error detecting flash size... Assuming ")
                            + device.flash_size.name + '\r\n');
      }
      catch(e)
      {
        if(e == 'timeout')
        {
          this._terminal.write("[Timeout] Error detecting flash size... Assuming " + device.flash_size.name + '\r\n');
        }else
        {
          throw e;
        }
      }

      device.register_cb(data => this._terminal.write(data));
      this._set_state(true);
    }
    catch(e)
    {
      console.log('catch', e);
      this._terminal.write("Error bootloading! closing... [" + e + "]\r\n");
      await device.close();
      this._set_state(false);
      throw e;
    }
  }
}
