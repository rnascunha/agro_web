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
import {Sensor_Description_View} from './sensor_description.js'
import {Custom_Request} from '../../libs/custom_request.js'
import {notify_device} from './notify_device.js'
import jobs_template from '../../containers/main/jobs_template.html'

const template_description = document.createElement('template');
template_description.innerHTML = device_description;

function make_image_select(device, instance, select)
{
  const images = Object.values(instance.image_list.list)
                    .filter(image => image.version != device.firmware_version);

  let op = document.createElement('option');
  op.textContent = images.length ? 'Select image' : 'No image';
  op.value = '';
  select.appendChild(op);

  if(!images.length) return;

  images.forEach(image => {
    op = document.createElement('option');
    op.value = image.name;
    op.textContent = `${image.version} (${image.name})`;

    select.appendChild(op);
  });
}

function make_app_select(device, instance, select)
{
  const app = Object.values(instance.app_list.list)
                  .filter(ap => !device.apps.find(a => a.name == ap.name));

  select.innerHTML = '';

  let op = document.createElement('option');
  op.value = '';
  op.textContent = app.length ? 'Select app' : 'No app';
  select.appendChild(op);

  if(!app.length) return;

  app.forEach(a => {
    op = document.createElement('option');
    op.value = a.name;
    op.textContent = `${a.name} [${a.hash.slice(-6)}] (${a.size} bytes)`;

    select.appendChild(op);
  });
}

function update_app_list(device, table)
{
  if(!device.apps.length)
  {
    table.innerHTML = '<tr data-hash=""><td colspan=3>No app</td></tr>';
    return;
  }

  let lines = Array.from(table.querySelectorAll('tr[data-hash]')),
      to_include = [];

  //Making sure to remove any line of type 'No app'
  if(lines.length && !lines[0].dataset.hash)
  {
    lines.shift().outerHTML = '';
  }

  //Removing lines
  let new_lines = [];
  lines.forEach(line => {
    if(!device.apps.some(app => app.hash_str == line.dataset.hash))
    {
      line.outerHTML = '';
      return;
    }
    new_lines.push(line);
  });

  //Checking app lines to bo included
  device.apps.forEach(app => {
    if(!new_lines.some(line => line.dataset.hash == app.hash_str))
    {
      to_include.push(app);
    }
  });

  to_include.forEach(app => {
    const line = document.createElement('tr');
    line.dataset.hash = app.hash_str;

    const name = document.createElement('td');
    name.textContent = `${app.name} [${app.hash_str.slice(-6)}]`;
    line.appendChild(name);

    const exec = document.createElement('td');
    exec.innerHTML = `<div class=app-exec-container>
                        <input type=number class='remove-arrow input-common argument' value=0 title='App exec argument'>
                        <span title='Execute app' data-exec='${app.name}'><i class="fas fa-terminal"></i></span>
                      </div>`;
    line.appendChild(exec);

    const close = document.createElement('td');
    close.innerHTML = '&times;'
    close.dataset.close = app.name;
    line.appendChild(close);

    table.appendChild(line);
  });
}

const template_add_job = document.createElement('template');
template_add_job.innerHTML = jobs_template;

function get_check_add_job(container)
{
  const //name = container.querySelector('.add-job-name').value,
        time_before = container.querySelector('.add-job-init').value,
        time_after = container.querySelector('.add-job-finish').value,
        priority = +container.querySelector('.job-priority').value,
        dow = Array.from(container.querySelectorAll('.add-job-dow input')).reduce((acc, val) => acc | (val.checked ? +val.value : 0), 0),
        exec = container.querySelector('.job-exec-app').selectedOptions[0].value,
        arg = +container.querySelector('.job-exec-app-arg').value;

  const error = container.querySelector('.add-job-error');

  // if(!name)
  // {
  //   error.textContent = 'Missing name';
  //   return false;
  // }

  if(!time_before)
  {
    error.textContent = 'Time begin not set';
    return false;
  }

  if(!time_after)
  {
    error.textContent = 'Time end not set';
    return false;
  }

  if(priority < 1 || priority > 255)
  {
    error.textContent = 'Invalid priority';
    return false;
  }

  if(dow == 0)
  {
    error.textContent = 'Select at least 1 day of week';
    return false;
  }

  if(!exec)
  {
    error.textContent = 'No app selected';
    return false;
  }

  const time_b = time_before.split(':'),
        time_a = time_after.split(':');

  return {
    // name,
    begin: {
      hour: +time_b[0], minute: +time_b[1]
    },
    end: {
      hour: +time_a[0], minute: +time_a[1]
    },
    priority,
    dow,
    exec,
    arg
  };
}

function add_job_modal(device, instance)
{
  const modal = document.createElement('pop-modal');

  modal.appendChild(template_add_job.content.cloneNode(true));

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  const sel = modal.querySelector('.job-exec-app');
  if(!device.apps.length)
  {
    sel.innerHTML = '<option value="">No app</option>';
  }
  else
  {
    sel.innerHTML = '<option value="">Select app</option>';
    device.apps.forEach(app => {
      const op = document.createElement('option');
      op.textContent = app.name;
      op.value = app.name;
      sel.appendChild(op);
    });
  }

  modal.querySelector('.add-job-button-container')
    .addEventListener('click', ev => {
      if(ev.target.value == 'cancel')
      {
        modal.delete();
      }
      else if(ev.target.value == 'add')
      {
        const job = get_check_add_job(modal);
        if(job)
        {
          modal.delete();
          const jobs = device.jobs.slice(0);
          jobs.push(job);

          instance.send(message_types.DEVICE,
            device_commands.REQUEST,
            {
              request: 'send_job',
              device: device.mac,
              jobs
            });
        }
      }
    });

  modal.show();

  return modal;
}

function update_view_jobs(device, container)
{
  if(!device.jobs.length)
  {
    container.innerHTML = '<tr><td colspan=20 class=no-data>No jobs</td></tr>';
    return;
  }

  function pad(time)
  {
    return String(time).padStart(2, '0');
  }

  function dow_view(dow)
  {
    const dow_l = 'MTWTFSS';
    let dow_r = '';
    for(let i = 0; i < 7; i++)
    {
      dow_r += ((dow & (1 << i)) ? dow_l[i] : '-');
    }
    return dow_r;
  }

  container.innerHTML = '';
  device.jobs.forEach((job, idx) => {
    const line = document.createElement('tr');

    const time = document.createElement('td');
    time.textContent = `${pad(job.begin.hour)}:${pad(job.begin.minute)}-${pad(job.end.hour)}:${pad(job.end.minute)}`;
    line.appendChild(time);

    const dow = document.createElement('td');
    dow.textContent = dow_view(job.dow);
    line.appendChild(dow);

    const priority = document.createElement('td');
    priority.textContent = job.priority;
    line.appendChild(priority);

    const app = document.querySelector('td');
    app.innerHTML = `${job.exec} [${job.arg}]`;
    line.appendChild(app);

    const close = document.querySelector('td');
    close.innerHTML = '&times';
    close.dataset.close = idx;
    line.appendChild(close);

    container.appendChild(line);
  });
}

export class Device_Description_View{
  constructor(container, device, instance)
  {
    let temp = template_description.content.firstElementChild.cloneNode(true);

    this._instance = instance;

    this._title = temp.querySelector('.device-title');
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
    this._sensor_description = null;
    make_sensors(this._sensors, device, instance);

    //Commands
    this._commands = temp.querySelector('.detail-device-commands');
    this._force = this._commands.querySelector('.detail-device-command-force input')
    this._commands_gpios_out = this._commands.querySelectorAll('btn-on-off');
    this._time = this._commands.querySelector('.detail-time-value');
    this._ota_version = this._commands.querySelector('.detail-ota-version');
    this._ota_select_image = this._commands.querySelector('.detail-select-ota-image');
    this._app_select = this._commands.querySelector('.device-app-select-send');
    this._app_list = this._commands.querySelector('.detail-app-table-list');
    this._job_list = this._commands.querySelector('.detail-job-table-list');
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
        device: device.mac,
        name: this._name.textContent
      })
    });
    this._name.textContent = device.name;

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
                device: device.mac
              });
            break;
            case 'packet':
            case 'time':
            case 'system':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: device.mac
                });
            break;
            case 'fuse':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: device.mac,
                  payload: - new Date().getTimezoneOffset() * 60
                });
            break;
            case 'ota':
              if(!ev.detail.index) return;
              if(ev.detail.index == 'update_ota' && !this._ota_select_image.selectedOptions[0].value)
              {
                instance.report(report_commands.DEVICE,
                  report_types.warning,
                  device.mac,
                  'Image not selected'
                )
                return;
              }

              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: device.mac,
                  image: this._ota_select_image.selectedOptions[0].value
                });
            break;
            case 'app':
              if(ev.detail.index == 'send_app')
              {
                if(!this._app_select.selectedOptions[0].value) return;
                instance.send(message_types.DEVICE,
                  device_commands.REQUEST,
                  {
                    request: ev.detail.index,
                    device: device.mac,
                    app: this._app_select.selectedOptions[0].value
                  });
                return;
              }
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: device.mac
                });
              break;
            case 'job':
              if(ev.detail.index == 'send_job')
              {
                document.body.appendChild(add_job_modal(device, instance));
              }
              else if(ev.detail.index == 'get_job')
              {
                instance.send(message_types.DEVICE,
                  device_commands.REQUEST,
                  {
                    request: ev.detail.index,
                    device: device.mac
                  });
              }
            break;
            case 'custom':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {...{
                  request: 'custom',
                  device: device.mac,
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
    make_image_select(device, instance, this._ota_select_image);

    /**
     * Apps
     */
    make_app_select(device, instance, this._app_select);
    update_app_list(device, this._app_list);
    this._app_list.addEventListener('click', ev => {
      let el = ev.target;
      while(el != this._app_list)
      {
        if('close' in el.dataset)
        {
          instance.send(message_types.DEVICE,
            device_commands.REQUEST,
            {
              request: 'delete_app',
              device: device.mac,
              app: el.dataset.close
            });
          return;
        }
        if('exec' in el.dataset)
        {
          const input = el.parentNode.querySelector('input.argument');
          instance.send(message_types.DEVICE,
            device_commands.REQUEST,
            {
              request: 'execute_app',
              device: device.mac,
              app: el.dataset.exec,
              arg: input.value ? +input.value : 0
            });
          break;
        }
        el = el.parentNode;
      }
    });

    /**
     * Jobs
     */
    update_view_jobs(device, this._job_list);
    this._job_list.addEventListener('click', ev => {
      if(!('close' in ev.target.dataset)) return;

      const index = +ev.target.dataset.close;
      const jobs = device.jobs.filter((job, idx) => index != idx);

      instance.send(message_types.DEVICE,
        device_commands.REQUEST,
        {
          request: 'send_job',
          device: device.mac,
          jobs
        });
    });

    /**
     * Open sensor popup
     */
    this._sensors.addEventListener('click', ev => {
      let t = ev.target;
      while(t != this._sensors)
      {
        if('sensor' in t.dataset) break;
        t = t.parentNode;
      }
      if(!('sensor' in t.dataset))
      {
        return;
      }

      const sensor_desc = document.createElement('pop-modal');
      sensor_desc.id = 'sensor-description-popup';
      sensor_desc.addEventListener('cancel', ev => {
        this._sensor_description = null;
        sensor_desc.delete();
      });

      document.body.appendChild(sensor_desc);
      sensor_desc.show();

      let [type, index] = t.dataset.sensor.split('@');
      type = +type; index = +index;

      const sensor_type = instance.sensor_type_list.get_id(type),
            sensor = device.sensor_list.sensor(type, index);

      this._sensor_description = new Sensor_Description_View(sensor_desc, instance, sensor, device);
      this._sensor_description.update();
      this._sensor_description.graph.set_brush_selection(20);
    });

    /**
     *
     */
     temp.querySelector('.device-notify')
      .addEventListener('click', ev => notify_device(device, instance));

    /**
     *
     */
    container.innerHTML = '';
    container.appendChild(temp);

    this._graphs = {}
    this._graphs_container = temp.querySelector('.detail-device-graph-container');
    make_sensors_graph(this._graphs,
          this._graphs_container,
          device, instance,
          null,
          {zoom: false, brush: false},
          -20);

    const s = device.sensor_list.last_data(5, 0);
    s && this._commands_gpios_out.forEach(g => {
          g.state = s.value & (1 << (+g.dataset.index + 8 - 1));
        });
  }

  disable_commands(disable)
  {
    this._commands.dataset.disabled = disable;
    this._commands_gpios_out.forEach(g => {
      g.disabled = disable;
    });
  }

  update(device, data, force = false)
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
          if(shine(`version_${attr}`, data, this[`_${attr}`]) || force)
            this[`_${attr}`].textContent = attr == 'fw' ? device.firmware_version : device.hardware_version;
        break;
        case 'endpoint':
          if(shine('endpoint', data, this._endpoint) || force)
            this._endpoint.textContent = device.endpoint.addr + ':' + device.endpoint.port;
        break;
        case 'channel':
          if(shine('ch_conn', data, this._channel) || force)
            this._channel.textContent = `${device.channel} / ${device.channel_config}`;
        break;
        case 'children_table':
          if(shine('children_table', data, this._children) || force)
            this._children.textContent = device.children_table.join(' | ');
        break;
        case 'name':
          //Do not update while updating... ;-P
          if(this._name.contentEditable == 'false')
          {
            if(shine(attr, data, this[`_${attr}`]) || force)
              this[`_${attr}`].textContent = device[attr];
          }
          break;
        break;
        default:
          if(shine(attr, data, this[`_${attr}`]) || force)
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

    if(data && 'apps' in data)
    {
      update_app_list(device, this._app_list);
    }

    if(data && 'jobs' in data)
    {
      update_view_jobs(device, this._job_list);
    }

    if((data && 'sensor' in data)  || force)
    {
      make_sensors(this._sensors, device, this._instance, data.sensor);
      const s = device.sensor_list.last_data(5, 0);
      s && this._commands_gpios_out.forEach(g => {
            g.state = s.value & (1 << (+g.dataset.index + 8 - 1));
          });

      if(this._sensor_description)
      {
        this._sensor_description.update();
      }

      make_sensors_graph(this._graphs,
        this._graphs_container,
        device, this._instance,
        data.sensor,
        {zoom: false},
        -20);
    }
  }

  update_other(device, instance)
  {
    make_image_select(device, instance, this._ota_select_image);
    make_app_select(device, instance, this._app_list);
  }
}
