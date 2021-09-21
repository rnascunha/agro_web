import {get_user_device} from '../helper/user_info.js'

'use strict';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
// const applicationServerPublicKey = 'BAffSuWmvVXgwT1ZvqHy6P2Y7N9-MFP3ulJXufUeIIez2qzxjjp_bnf4IV6oqPYgRN9SMUMs5UDiXKt95zgkXo0';

export class Notify_Container{
  constructor()
  {
    const //notify_switch = document.querySelector('#main #notify-switch'),
          // notify_container = document.querySelector('#main #notify-switch-container'),
          // notify_label = document.querySelector('#main #notify-label'),
          notify_disabled = document.querySelector('#main #notify-disabled'),
          notify_enable = document.querySelector('#main #notify-enable');

    // this._container = notify_container;
    // this._label = notify_label;
    // this._switch = notify_switch;
    this._notify_disabled = notify_disabled;
    this._notify_enable = notify_enable;
  }

  addEventListener(type, callback)
  {
    // this._container.addEventListener(type, ev => {
    //   let path = ev.composedPath()[0];
    //   if(path != this._switch)
    //     this._switch.dispatchEvent(new Event('click'));
    //   callback(ev);
    // });

    this._notify_disabled.addEventListener(type, ev => {
      callback(ev);
    });

    this._notify_enable.addEventListener(type, ev => {
      callback(ev);
    })
  }

  enable()
  {
      // this._container.removeAttribute('disabled');
      // this._switch.disabled = false;
      this._notify_enable.removeAttribute('disabled');
      this._notify_disabled.removeAttribute('disabled', 'true');

      // this._container.title = 'Notify is supported';
      this._notify_enable.title = 'Notify is supported';
  }

  disable(denied = false)
  {
      // this._container.setAttribute('disabled', '');
      // this._switch.disabled = true;
      this._notify_enable.setAttribute('disabled', '');
      this._notify_disabled.setAttribute('disabled', '');

      // this._container.title = denied ? 'Notify was denied' : 'Notify isn\'t supported';
      this._notify_disabled.title = denied ? 'Notify was denied' : 'Notify isn\'t supported';
  }

  check()
  {
    // this._container.setAttribute('checked', '');
    // this._switch.checked = true;
    this._notify_enable.setAttribute('checked','');
    this._notify_disabled.setAttribute('checked','');

    // this._container.title = 'Notify is enabled';
    this._notify_enable.title = 'Notify is enabled';
  }

  uncheck()
  {
    // this._container.removeAttribute('checked');
    // this._switch.checked = false;
    this._notify_enable.removeAttribute('checked');
    this._notify_disabled.removeAttribute('checked');

    // this._container.title = 'Notify is disabled';
    this._notify_disabled.title = 'Notify is disabled';
  }
}

export class Notify{
  constructor(ws, user, application_key, registration, container)
  {
    this._ws = ws;
    this._user = user;
    this._app_key = urlB64ToUint8Array(application_key);
    this._registration = registration;
    this._is_subscribed = false;
    this._subscription = null;
    this._container = container;

    container.addEventListener('click', ev => {
      if (this._is_subscribed)
      {
        this.unsubscribe();
      }
      else
      {
        this.subscribe();
      }
    });
  }

  send_subscribe()
  {
    if(this._is_subscribed)
      this._ws.send(JSON.stringify({
        type: 'user',
        command: 'push_subscribe',
        data: {
          user: this._user,
          user_agent: get_user_device(),
          subscription: this._subscription,
        }
      })
    )
  }

  send_unsubscribe()
  {
    this._ws.send(JSON.stringify({
        type: 'user',
        command: 'push_unsubscribe',
        data: {
          user: this._user,
          user_agent: get_user_device()
        }
      })
    )
  }

  get_subscription()
  {
    if(!this._registration) return;

    this._registration.pushManager.getSubscription()
      .then(subscription => {
        this._subscription = subscription;
        this._is_subscribed = !(subscription === null);

      this.send_subscribe();
      this._update_container()
    });
  }

  subscribe()
  {
    if(!this._registration) return;

    this._registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this._app_key
    })
    .then(subscription => {
      this._is_subscribed = true;
      this._subscription = subscription;
      this.send_subscribe();

      this._update_container()
    })
    .catch(err => {
      console.log('Failed to subscribe the user: ', err);
      this._update_container()
    });
  }

  unsubscribe()
  {
    this._subscription.unsubscribe()
      .catch(error => {
        console.log('Error unsubscribing', error);
      })
      .then(() => {
        console.log('User is unsubscribed.');
        this._is_subscribed = false;

        this.send_unsubscribe();

        this._update_container()
    });
  }

  _update_container()
  {
    if (Notification.permission === 'denied')
    {
        this._container.disable(true);
        this.send_unsubscribe();
        return;
    }

    this._container.enable();
    if(this._is_subscribed)
    {
      this._container.check();
    }
    else
    {
      this._container.uncheck();
    }
  }

  static support()
  {
      return 'serviceWorker' in navigator && 'PushManager' in window;
  }
}
