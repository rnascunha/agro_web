import {shine,
        time_format_string,
        uptime_format_string,
        make_path,
        make_response_modal} from './helper.js'
import {message_types,
        device_commands,
        report_commands,
        report_types} from '../../messages/types.js'
import custom_response_modal from '../../containers/custom_response_modal.html'
import device_description from '../../containers/main/device_description.html'
import {esp_reset_reason_string} from '../../helper/esp.js'
import {make_sensors} from './sensor_line.js'
import {make_sensors_graph} from './sensor_graph.js'
import {Custom_Request} from '../../libs/custom_request.js'

const template_description = document.createElement('template');
template_description.innerHTML = device_description;

export class Device_Description_View{
  constructor(container, device, instance)
  {
    let temp = template_description.content.firstElementChild.cloneNode(true);

    this._instance = instance;

    this._title = temp.querySelector('.detail-title');
    this._connected = temp.querySelector('.detail-connected');
    this._id = temp.querySelector('.detail-id');
    this._name = temp.querySelector('.detail-name');
    this._fw = temp.querySelector('.detail-fw');
    this._hw = temp.querySelector('.detail-hw');
    this._endpoint = temp.querySelector('.detail-endpoint');
    this._layer = temp.querySelector('.detail-layer');
    this._parent = temp.querySelector('.detail-parent');
    this._net_id = temp.querySelector('.detail-netid');
    this._channel = temp.querySelector('.detail-channel');
    this._mac_ap = temp.querySelector('.detail-macap');
    this._children = temp.querySelector('.detail-children');

    //Config
    this._has_rtc = temp.querySelector('.detail-has-rtc');
    this._has_temp_sensor = temp.querySelector('.detail-has-temp');

    //Sensors
    this._sensors = temp.querySelector('.description-sensor-content');
    make_sensors(this._sensors, device, instance);

    //Commands
    this._commands = temp.querySelector('.detail-device-commands');
    this._force = this._commands.querySelector('.detail-device-command-force input')
    this._commands_gpios_out = this._commands.querySelectorAll('btn-on-off');
    this._time = this._commands.querySelector('.detail-time-value');
    this._ota_version = this._commands.querySelector('.detail-ota-version');
    this._ota_select_image = this._commands.querySelector('.detail-select-ota-image');
    this._uptime = this._commands.querySelector('.detail-uptime');
    this._reset_reason = this._commands.querySelector('.detail-reset-reason');
    this._custom_request = new Custom_Request(this._commands.querySelector('#detail-custom'));

    this._force.addEventListener('change', ev => {
        this.disable_commands(!this._force.checked);
    });

    temp.querySelector('.detail-edit-name')
      .addEventListener('click', ev => {
          this._name.contentEditable = true;
          this._name.focus();
    });

    this._name.addEventListener('blur', ev => {
      this._name.contentEditable = false;
      instance.send(message_types.DEVICE, device_commands.EDIT, {
        device: this._title.textContent,
        name: this._name.textContent
      })
    });

    this._commands
      .addEventListener('command', ev => {
        if(ev.target.disabled || this._commands.dataset.disabled == 'true')
        {
          return;
        }

        switch(ev.detail.type)
        {
          case 'ac_load':
            instance.send(message_types.DEVICE,
              device_commands.REQUEST,
              {
                request: `ac${ev.detail.index}_${ev.detail.on == 'true' ? 'on' : 'off'}`,
                device: this._title.textContent
              });
            case 'packet':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent
                });
            break;
            case 'time':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent
                });
            case 'fuse':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent,
                  payload: - new Date().getTimezoneOffset() * 60
                });
            break;
            case 'ota':
              if(!ev.detail.index) return;
              if(ev.detail.index == 'update_ota' && !this._ota_select_image.selectedOptions[0].value)
              {
                instance.report(report_commands.DEVICE,
                  report_types.warning,
                  this._title.textContent,
                  'Image not selected'
                )
                return;
              }

              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent,
                  image: this._ota_select_image.selectedOptions[0].value
                });
            break;
            case 'system':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent,
                });
              break;
            case 'custom':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {...{
                  request: 'custom',
                  device: this._title.textContent,
                }, ...ev.detail});
            break;
          default:
            console.warn('command not found', ev.detail);
          break;
        }
    });

    /**
     * Time switch event
     */
    this._commands
      .querySelector('.detail-time-switch')
      .addEventListener('click', ev => {
        this._time.dataset.format = this._time.dataset.format == 'normal' ? 'clock' : 'normal';
        this._time.textContent = time_format_string(device, this._time.dataset.format);
      });
    /**
     * Uptime switch event
     */
     this._commands
       .querySelector('.detail-uptime-switch')
       .addEventListener('click', ev => {
         this._uptime.dataset.format = this._uptime.dataset.format == 'normal' ? 'clock' : 'normal';
         this._uptime.textContent = uptime_format_string(device, this._uptime.dataset.format);
       });

    /**
     * Custom response
     */
     this._commands
      .querySelector('.custom-response-button')
      .addEventListener('click', ev => {
        const modal = document.createElement('pop-modal');
        modal.classList.add('custom-response-modal');

        modal.innerHTML = custom_response_modal;
        make_response_modal(device, modal);

        document.body.appendChild(modal);
        modal.show();

        modal.addEventListener('cancel', ev => {
          ev.target.delete();
        })
      });

    /**
     * Images
     */
    let op = document.createElement('option');
    op.textContent = instance.image_list.size ? 'select image' : 'no image';
    op.value = '';
    this._ota_select_image.appendChild(op);

    Object.values(instance.image_list.list).forEach(image => {
      /**
       * Check to just show different version images
       */
      if(image.version == device.firmware_version)
      {
        return;
      }
      op = document.createElement('option');
      op.value = image.name;
      op.textContent = `${image.version} (${image.name})`;

      this._ota_select_image.appendChild(op);
    });

    /**
     *
     */
    container.innerHTML = '';
    container.appendChild(temp);

    this._graphs = {}
    this._graphs_container = temp.querySelector('.detail-device-graph-container');
    make_sensors_graph(this._graphs, this._graphs_container, device, instance);

    this._commands_gpios_out.forEach(g => {
      const s = device.sensor_list.last_data(5, 0);
      if(s)
      {
          g.state = s.value & (1 << (+g.dataset.index + 8 - 1));
      }
    });
  }

  disable_commands(disable)
  {
    this._commands.dataset.disabled = disable;
    this._commands_gpios_out.forEach(g => {
      g.disabled = disable;
    });
  }

  update(device, data)
  {
    this._title.textContent = device.mac;

    this._connected.textContent = device.connected ? 'connected' : 'disconnected';
    shine('connected', data, this._connected);
    this.disable_commands(!device.connected);

    ['id', 'name', 'fw', 'hw',
      'endpoint', 'layer', 'parent', 'net_id',
      'channel', 'mac_ap', 'children_table',
      'has_rtc', 'has_temp_sensor'].forEach(attr => {
      switch(attr)
      {
        case 'fw':
        case 'hw':
          if(shine(`version_${attr}`, data, this[`_${attr}`]))
            this[`_${attr}`].textContent = attr == 'fw' ? device.firmware_version : device.hardware_version;
        break;
        case 'endpoint':
          if(shine('endpoint', data, this._endpoint))
            this._endpoint.textContent = device.endpoint.addr + ':' + device.endpoint.port;
        break;
        case 'channel':
          if(shine('ch_conn', data, this._channel))
            this._channel.textContent = `${device.channel} / ${device.channel_config}`;
        break;
        case 'children_table':
          if(shine('children_table', data, this._children))
            this._children.textContent = device.children_table.join(' | ');
        break;
        default:
          if(shine(attr, data, this[`_${attr}`]))
            this[`_${attr}`].textContent = device[attr];
        break;
      }
    });

    this._time.textContent = time_format_string(device, this._time.dataset.format);
    shine('rtc', data, this._time);
    shine('fuse', data, this._time);

    this._ota_version.textContent = device.ota_version ? device.ota_version : '<ota version>';
    shine('ota_version', data, this._ota_version);

    this._uptime.textContent = uptime_format_string(device, this._uptime.dataset.format);
    shine('uptime', data, this._uptime);

    this._reset_reason.textContent = device.reset_reason ?
                                      `[${device.reset_reason}] ${esp_reset_reason_string(device.reset_reason)}` :
                                      '<reset_reason>';
    shine('reset_reason', data, this._reset_reason);

    if(data && 'sensor' in data)
    {
      make_sensors(this._sensors, device, this._instance, data.sensor);
      this._commands_gpios_out.forEach(g => {
        const s = device.sensor_list.last_data(5, 0);
        if(s)
        {
            g.state = s.value & (1 << (+g.dataset.index + 8 - 1));
        }
      });
      make_sensors_graph(this._graphs, this._graphs_container, device, this._instance, data.sensor);
    }
  }
}
