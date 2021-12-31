import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {SLIP} from './slip.js';
import {mac_to_string} from './utility.js';
// import {ConsoleDebug, TerminalDebug} from './debug.js';

export class Serial_View{
  constructor(model, container, terminal_container)
  {
    this._model = model;
    this._container = container;
    this._ports = container.querySelector('#serial-ports-list');
    this._baudrate = container.querySelector('#serial-ports-baudrate');

    this._open = container.querySelector('#serial-open-port');
    this._reset = container.querySelector('#serial-reset-port');
    this._bootload = container.querySelector('#serial-bootload-port');
    this._read_chip = container.querySelector('#serial-read-chip');

    this._terminal = new Terminal({cursorBlink: true, termName: 'Serial Data'});
    const fitAddon = new FitAddon();
    this._terminal.loadAddon(fitAddon);

    this._terminal.open(terminal_container);

    fitAddon.fit();

    this._terminal.write('Welcome to \x1B[1;3;31mSerial Terminal Data\x1B[0m\r\n\r\n');

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

    this._open
      .addEventListener('click', ev => {
        const dev = this._selected_device();
        if(!dev)
        {
          console.warn(`Device not found`);
          return;
        }
        if(dev.is_open())
        {
          console.log(`Closing device '${dev.name}'.`);
          dev.close().then(() => {
            this._set_state(false);
          });
          return;
        }
        console.log(`Opening device '${dev.name}' [${this.baudrate()}].`);
        dev.open(this.baudrate(), value => this._terminal.write(value))
          .then(() => {
            this._terminal.write(`Bootloading ${dev.name}...\r\n`);
            dev.signal_bootloader().then(() => {
              this._terminal.write("Entered bootloader\r\n");
              this._terminal.write("Syncing...\r\n");
              dev.sync().then(data => {
                this._terminal.write(`Synced\r\n`);
              })
              .catch(e => {
                this._terminal.write(`Sync failed [${e}]\r\n`);
              })
            });
            this._set_state(true);
          })
          .catch(e => console.log('Error opening...', e));
      });

      this._reset.addEventListener('click', ev => {
        const dev = this._selected_device();
        if(dev && dev.is_open())
        {
          console.log(`Reseting ${dev.name}...`);
          dev.signal_reset().then(() => {
            dev.register_cb(value => this._terminal.write(value));
          })
        }
      });

      this._bootload.addEventListener('click', ev => {
        const dev = this._selected_device();
        if(dev && dev.is_open())
        {
          console.log(`Bootloading ${dev.name}...`);
          dev.signal_bootloader().then(() => {
            dev.sync().then(data => {
              this._terminal.write(`Synced\r\n`);
            })
            .catch(e => {
              this._terminal.write(`Sync failed [${e}]\r\n`);
            })
          });
        }
      });

      this._read_chip.addEventListener('click', ev => {
        const dev = this._selected_device();
        if(dev && dev.is_open())
        {
          console.log(`Read chip ${dev.name}...`);
          dev.chip()
            .then(reg => {
              this._terminal.write("Chip family: " + reg + "\r\n");
              dev.efuses()
                .then(e => {
                  const mac = dev.mac();
                  if(!mac)
                  {
                    this._terminal.write('Error reading MAC\r\n');
                    return;
                  }
                  this._terminal.write(`MAC: ${mac_to_string(mac)}\r\n`);
                })
                .catch(e => {
                  this._terminal.write('Error reading efuse [' + e + ']\r\n');
                })
            })
            .catch(e => {
              this._terminal.write("Error getting chip family\r\n");
            })
        }
      });

      container.querySelector('#serial-erase-flash')
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

  _check_open()
  {
    const index = +this.selected().value;
    if(index < 0)
    {
      console.warn("No device selected", index);
      this._set_state(false);
      return;
    }
    const dev = this._model.by_index(index);
    if(!dev)
    {
      console.warn(`Device ${index} not found`);
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
      this._reset.disabled = false;
      this._bootload.disabled = false;
      this._read_chip.disabled = false;
    }
    else
    {
      this._open.textContent = 'Open';
      this._ports.disabled = false;
      this._baudrate.disabled = false;
      this._reset.disabled = true;
      this._bootload.disabled = true;
      this._read_chip.disabled = true;
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
}
