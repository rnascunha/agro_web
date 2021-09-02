import {Storage} from './libs/storage.js';
import {run_page} from './libs/page.js';

if(!Storage.support())
{
  run_page('login', null);
}
else
{
  const db_name = 'agro';
  const db_version = 1;
  const db_scheme = [
      {name: 'sessions', options: { keyPath: 'index' }}
  ];

  const storage = new Storage(db_name, db_version, db_scheme)
                    .on_open(() => run_page('login', storage));
}

if ('serviceWorker' in navigator)
{
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js')
    .then(function(swReg) {
      console.log('Service Worker is registered', swReg);
    })
    .catch(function(error) {
      console.error('Service Worker Error', error);
    });
  });
}
