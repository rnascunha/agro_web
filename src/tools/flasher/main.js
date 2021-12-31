import {esp_image_parse, esp_hash, error_code} from './esp_image_parser.js';
import {digest_support, read_file} from './utility.js';
import {Serial} from './serial.js';
import {Serial_View} from './serial_view.js';
import {ESPTool} from './esptool.js';

function make_file_size(size)
{
  return size > 1024 ? `${Math.floor(size / 1024)} kb` : `${size} b`;
}

function make_file_date(date)
{
    return `${date.getFullYear()}/${`${date.getMonth()}`.padStart(2, '0')}/${`${date.getDate()}`.padStart(2, '0')} ` +
            `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

function make_info(name, data, title = null)
{
  return `<span class=info-content ${title ? `title=${title}` : ''}><span class=info-title>${name}</span><span class=info-data>${data}</span></span>`;
}

async function make_file_info(file)
{
  const data = make_info('File', file.name) +
             make_info('Size', make_file_size(file.size), `${file.size} bytes`) +
             make_info('Date Modified', make_file_date(file.lastModifiedDate));

  const image = await read_file(file);

  const parse = esp_image_parse(image);
  if(parse.error)
  {
    make_report('ERROR! ' + parse.error_message, 'error');
    return data;
  }

  const header = parse.header;
  const header_data = make_info('Header magic', '0x' + header.magic.toString(16).padStart(2, '0')) +
                    make_info('Entry addr', '0x' + header.entry_addr.toString(16).padStart(2, '0')) +
                    make_info('Chip ID', header.chid_id) +
                    make_info('Min chip rev', header.min_chip_rev) +
                    make_info('Hash appended', header.hash_appended);

  const header_segment = parse.header_segment;
  const segment_data = make_info('Load addr', '0x' + header_segment.load_addr.toString(16)) +
                       make_info('Data length', header_segment.data_len);

  const description = parse.description;
  const desc_data = make_info('Magic word', '0x' + description.magic_word.toString(16)) +
                    make_info('Secure version', description.secure_version) +
                    make_info('Version', description.version) +
                    make_info('Project name', description.project_name) +
                    make_info('time', description.time) +
                    make_info('date', description.date) +
                    make_info('IDF version', description.idf_ver) +
                    make_info('ELF hash', description.app_elf_sha256.slice(-10), description.app_elf_sha256);

  const hashs = await esp_hash(image);
  if('error' in hashs && hashs.error && hashs.error_code == error_code.NOT_SUPPORTED)
  {
    make_report('WARN! Your browser does not support Crypto API', 'warning');
    return data + header_data + segment_data + desc_data;
  }

  if(hashs[1] != hashs[2])
  {
    make_report('ERROR! Hash image and calculated hash does not match', 'error');
  }

  return data +
        make_info('File hash', hashs[0].slice(-10), hashs[0]) +
        make_info('Caculated hash', hashs[1].slice(-10), hashs[1]) +
        make_info('Image hash', hashs[2].slice(-10), hashs[2]) +
        header_data + segment_data + desc_data;
}

function check_support()
{
  const inform = document.querySelector('#support-inform');
  if(!Serial.support())
  {
    inform.innerHTML = "<div class='inform report warning'><span>Your browser doesn\'t support the <em><a target=_blank href=https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API>WebSerial API</a></em>. It won't be possible to flash image.</span><span class=close>&times</span></div>";
  }

  if(!digest_support())
  {
    inform.innerHTML += "<div class='inform report warning'><span>Your browser doesn't support the <em><a target=_blank href=https://developer.mozilla.org/en-US/docs/Web/API/Crypto>Crypto API</a></em>. It won't be possible to check the image integraty.</span><span class=close>&times</span></div>"
  }

  inform.querySelectorAll('.close').forEach(e => {
    e.addEventListener('click', ev => {
      ev.target.parentNode.outerHTML = '';
    })
  })
}

check_support();

let file = null;
const file_name = document.querySelector('#file-name'),
      file_input = document.querySelector('#file-input'),
      upload_btn = document.querySelector('#button-upload'),
      erase_input = document.querySelector('#erase-file'),
      report  = document.querySelector('#report'),
      file_info = document.querySelector('#file-info');

if(!Serial.support())
{
  upload_btn.classList.add('disabled');
  upload_btn.title = 'WebSerial API not supported';
}

erase_input.addEventListener('click', ev => {
  file_name.textContent = '';
  file = null;
  file_info.textContent = '';
  file_input.value = '';
  make_report();
});

file_input.addEventListener('change', ev => {
  if(!ev.target.files.length) return;

  file = ev.target.files[0];
  file_name.textContent = ev.target.files[0].name;
  make_file_info(file).then(data => {
      file_info.innerHTML = data;
  });
});

function make_report(message, type)
{
  switch(type)
  {
    case 'success':
      report.classList.remove('warning', 'error');
      report.classList.add('success');
      report.textContent = message;
      break;
    case 'warning':
      report.classList.remove('error', 'success');
      report.classList.add('warning');
      report.textContent = message;
      break;
    case 'error':
      report.classList.remove('warning', 'success');
      report.classList.add('error');
      report.textContent = message;
      break;
    default:
      report.textContent =  '';
      break;
  }
}

/**
 * Serial
 */
if(Serial.support())
{
    const serial = new Serial(ESPTool, Serial_View, document.querySelector('#serial-container'),
                              document.querySelector('#terminal-container'));
}
