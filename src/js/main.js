import {Storage} from './libs/storage.js';
import {page_manager} from './libs/page.js';

function init_db()
{
  if(!Storage.support())
  {
    return Promise.resolve(false);
  }
  else
  {
    const db_name = 'agro';
    const db_version = 1;
    const db_scheme = [
        {name: 'instance'},
        {name: 'sessions', options: { keyPath: 'index' }}
    ];

    return new Promise((resolve, reject) => {
      const storage = new Storage(db_name, db_version, db_scheme).on_open()
      storage.on_open(() => resolve(storage));
    });
  }
}

function init_service_worker()
{
  if ('serviceWorker' in navigator)
  {
    return navigator.serviceWorker.register('sw.js');
  }
  return Promise.resolve(false);
}

Promise.all([init_db(), init_service_worker()]).then(values => {
  page_manager.run('login', {storage: values[0], registration: values[1]});
});
