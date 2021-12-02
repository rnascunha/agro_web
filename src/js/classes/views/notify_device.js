import device_notification from '../../containers/notification/device_notification.html'
import {make_sensor_name} from './sensor_helper.js'
import {message_types, notify_commands} from '../../messages/types.js'

function add_new_sensor_notify(device, instance, container, value = null)
{
  const nsensor = document.createElement('sensor-notify');

  Object.values(device.sensor_list.list).forEach(sensor => {
    const sensor_type = instance.sensor_type_list.get_id(sensor.type);
    nsensor.add_sensor(make_sensor_name(sensor, sensor_type), `${sensor.type}@${sensor.index}`);
  });

  if(value)
  {
    nsensor.value = value;
  }

  container.querySelector('.notify-sensor-list').appendChild(nsensor);
}

export function notify_device(device, instance)
{
  const modal = document.createElement('pop-modal');
  modal.classList.add('popup-modal', 'pop-modal-notify');

  modal.innerHTML = device_notification;
  modal.querySelectorAll('.notify-device input')
    .forEach(check => {
      const list = instance.notify.device_list;
      if(device.id in list)
      {
        if(list[device.id].find(op => op == check.value)) check.checked = true;
      }
    });

  //Inserting sensor notify
  if(device.id in instance.notify.sensor_list)
  {
    Object.entries(instance.notify.sensor_list[device.id]).forEach(([key, value]) => {
      const [type, index] = key.split('@');
      value.forEach(v => {
        add_new_sensor_notify(device, instance, modal, {...v, ...{sensor: {type: type, index: index}}});
      });
    })
  }

  modal.querySelector('.add-notify-sensor')
    .addEventListener('click', ev => add_new_sensor_notify(device, instance, modal));

  modal.querySelector('.notify-device-btn')
    .addEventListener('click', ev => {
      const dev_noti = [];
      modal.querySelectorAll('.notify-device input')
        .forEach(check => check.checked ? dev_noti.push(check.value) : null);
      instance.send(message_types.NOTIFY, notify_commands.DEVICE_SET, {
        id: device.id,
        device: device.mac,
        notify: dev_noti
      });

      const sensors_noti = [];
      modal.querySelectorAll('sensor-notify').forEach(sn => {
        sensors_noti.push(sn.value);
      });

      instance.send(message_types.NOTIFY, notify_commands.SENSOR_SET, {
          id: device.id,
          mac: device.mac,
          sensors: sensors_noti
      });
    });

  document.body.appendChild(modal);
  modal.show();

  modal.addEventListener('cancel', ev => {
    ev.target.delete();
  })
}
