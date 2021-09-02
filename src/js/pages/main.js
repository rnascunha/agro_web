import {Page, add_page_list} from '../libs/page.js'

function run_main(data)
{
  console.log('data main', data);
  console.log('This is the main page running[' + data.username + ' / ' + data.server_addr + ']');

  if(data.storage)
  {
    data.storage.save('sessions', {
      index: `${data.username}@${data.server_addr}`,
      username: data.username,
      server_addr: data.server_addr,
      autoconnect: data.autoconnect,
      sessionid: data.sessionid,
      date: new Date()
    })
  }
}

add_page_list('main', new Page('Agro Telemetry', '#template-main', run_main));
