import {esp_image_parse, esp_hash, error_code} from './esp_image_parser.js';
import {digest_support,
        is_hex_string,
        to_hex_string,
        to_hex,
        sleep,
        compress_buffer,
        compression_support} from './utility.js';
import {Serial} from './serial.js';
import {Serial_View} from './serial_view.js';
import {ESPTool, flash_end_flag} from './esptool.js';
import {ArrayBuffer as md5_digest} from 'spark-md5';

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

async function make_file_info(file, image)
{
  const data = make_info('File', file.name) +
             make_info('Size', make_file_size(file.size), `${file.size} bytes`) +
             make_info('Date Modified', make_file_date(new Date(file.lastModified)));

  const parse = esp_image_parse(image);
  if(parse.error)
  {
    make_report('ERROR! ' + parse.error_message, 'error');
    return {error: true, error_message: 'error parsing', data, image};
  }

  const header = parse.header;
  const header_data = make_info('Header magic', '0x' + header.magic.toString(16).padStart(2, '0')) +
                    make_info('SPI', `${header.spi_mode.name} ${header.spi_speed.name} ${header.spi_size.name}`) +
                    make_info('Entry addr', '0x' + header.entry_addr.toString(16).padStart(2, '0')) +
                    make_info('Chip ID', header.chip_id.name) +
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

  // return {error: false, data: data + header_data + segment_data + desc_data, image};
  const hashs = await esp_hash(image);
  if('error' in hashs && hashs.error && hashs.error_code == error_code.NOT_SUPPORTED)
  {
    // make_report('WARN! Your browser does not support Crypto API', 'warning');
    return {error: false, data: data + header_data + segment_data + desc_data, image};
  }

  if(hashs[1] != hashs[2])
  {
    make_report('ERROR! Hash image and calculated hash does not match', 'error');
    return {error: true, error_message: 'hash not match', data: data +
            make_info('File hash', hashs[0].slice(-10), hashs[0]) +
            make_info('Caculated hash', hashs[1].slice(-10), hashs[1]) +
            make_info('Image hash', hashs[2].slice(-10), hashs[2]) +
            header_data + segment_data + desc_data, image};
  }

  return {error: false,
          data: data +
          make_info('File hash', hashs[0].slice(-10), hashs[0]) +
          make_info('Caculated hash', hashs[1].slice(-10), hashs[1]) +
          make_info('Image hash', hashs[2].slice(-10), hashs[2]) +
          header_data + segment_data + desc_data, image};
}

function check_support()
{
  const inform = document.querySelector('#support-inform');
  if(!Serial.support())
  {
    inform.innerHTML = "<div class='inform report warning'><span>Your browser doesn\'t support the <em><a target=_blank href=https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API>WebSerial API</a></em>. It won't be possible to flash image.</span><span class=close>&times</span></div>";
    upload_image.disabled = true;
    upload_all.disabled = true;
    document.querySelector('#serial-container').style.display = 'none';
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

const upload_image = document.querySelector('#upload-image'),
      report  = document.querySelector('#report'),
      file_info = document.querySelector('#file-info'),
      progress_bar = document.querySelector('#upload-progress'),
      reset_after = document.querySelector('#reset-after-check'),
      verify_check = document.querySelector('#verify-upload'),
      upload_all = document.querySelector('#upload-all-btn');

check_support();

upload_image.addEventListener('file', ev => {
  make_report();
  file_info.textContent = '';
  if(!ev.detail.file)
  {
    return;
  }

  make_file_info(ev.detail.file, ev.detail.image).then(data => {
    file_info.innerHTML = data.data;
    if(data.error)
    {
      make_report(data.error_message, 'error');
      return;
    }
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
  serial_container();
}

function serial_container()
{
  const serial = new Serial(ESPTool,
                            Serial_View, document.querySelector('#serial-container'));

  upload_image.addEventListener('upload', async ev => {
    make_report();
    const data = ev.detail;

    let esptool;
    try{
      esptool = await get_esptool(serial);
      if(!esptool) return;
    }
    catch(e)
    {
      serial.view.write("Error initating serial [" + e + "]");
      return;
    }

    if(!data.file)
    {
      make_report("Upload image FAIL: Missing file", 'error');
      serial.view.write('Aborting! No file selected');
      return;
    }
    if(!data.image)
    {
      make_report("Upload image FAIL: invalid image", 'error');
      serial.view.write('Aborting! Invalid image');
      return;
    }
    if(!data.offset.length || !is_hex_string(data.offset))
    {
      make_report("Upload image FAIL: invalid offset [" + data.offset + "]", 'error');
      serial.view.write('Aborting! Offset not defined [' + data.offset + "]");
      return;
    }

    upload_image.disabled = true;
    progress_bar.update(0, '0/100');
    const offset = parseInt(data.offset, 16);

    try{
      await write_images(esptool, data, serial)
      make_report(`Upload image '${data.file.name}' succeced`, 'success');
      serial.view.write(`Upload image '${data.file.name}' succeced`);
      if(reset_after.checked)
      {
        serial.view.write('Resetting device...\r\n');
        serial.view.reset();
      }
    }
    catch(e)
    {
      make_report(`Upload image FAIL`, 'error');
      serial.view.write('Upload image FAIL');
    }
    upload_image.disabled = false;
  });

  upload_all.addEventListener('click', async ev => {
    let esptool;
    try{
      esptool = await get_esptool(serial);
      if(!esptool) return;
    }
    catch(e)
    {
      serial.view.write("Error initating serial [" + e + "]");
      return;
    }

    const images = [];
    let error = upload_image.value.some(image => {
      if(!image.checked)
      {
        serial.view.write(`Ignoring image '${image.file.name}' [not selected]`);
        return;
      }
      if(!image.file) return;
      if(!image.image) return;

      if(!image.offset.length)
      {
        serial.view.write(`Aborting! Image '${image.file.name}' offset not defined`);
        make_report("Upload image FAIL: offset not defined", 'error');
        return true;
      }
      if(!is_hex_string(image.offset))
      {
        serial.view.write(`Aborting! Image '${image.file.name}' invalid offset`);
        make_report("Upload image FAIL: invalid offset [" + image.offset + "]", 'error');
        return true;
      }
      images.push(image);
    });

    if(error)
    {
      return;
    }

    if(!images.length)
    {
      serial.view.write(`Aborting! No image selected`);
      make_report("Upload image FAIL: no image selected", 'warning');
      return;
    }

    images.sort(function(a, b){ return parseInt(a.offset, 16) - parseInt(b.offset, 16); });
    make_report('Upload images', 'success');

    upload_image.disabled = true;
    try{
      await write_images(esptool, images, serial)
      make_report(`Upload images succeced`, 'success');
      if(reset_after.checked)
      {
        serial.view.reset();
      }
    }
    catch(e)
    {
      make_report(`Upload image FAIL`, 'error');
      serial.view.write("Images upload FAIL");
    }
    upload_image.disabled = false;
  });
}

async function write_images(esptool, images, serial)
{
  if(!Array.isArray(images))
  {
    images = [images];
  }

  const new_images = [];
  if(compression_support())
  {
    serial.view.write('Compression supported!');
    for(let i = 0; i < images.length; i++)
    {
      const image_compress = await compress_buffer(images[i].image, 'deflate');
      new_images.push({compressed: image_compress, image: images[i], size: image_compress.byteLength});
      serial.view.write(`Compressed ${images[i].file.name}: ${images[i].image.byteLength} > ${image_compress.byteLength}`);
    }
  }
  else
  {
    serial.view.write('Compression NOT supported!');
    images.forEach(image => new_images.push({image, size: image.image.byteLength}));
  }

  progress_bar.update(0, '0/100');
  const total_bytes = new_images.reduce((total, image) => total + image.size, 0);
  let total_written = 0;

  for(let i = 0; i < new_images.length; i++)
  {
    const offset = parseInt(images[i].offset, 16);
    const verification = await write_image(esptool, new_images[i], offset, {
      upload_progress: function({percent,seq, blocks, file_size, position, written}){
        const p = Math.floor((100 * (total_written + written)) / total_bytes);
        progress_bar.update(p, `[${images[i].file.name} at 0x${images[i].offset}] ${p}/100`);
        serial.view.write(`[${images[i].file.name} at 0x${images[i].offset}] ${`${percent}`.padStart(3, '0')}/100\r`, false);
      }
    }, serial);
    if(!verification)
    {
      throw 'image verification fail';
    }
    total_written += new_images[i].size;
  }
}

async function write_image(esptool, image, offset, options, serial)
{
  if(compression_support())
  {
    make_report(`Image compressed [${image.image.image.byteLength} > ${image.size}]`, 'success');
    await esptool.flash_image_deflate(image.compressed, image.image.image.byteLength, offset, options)
  }
  else
  {
    make_report(`Compressed not supported [${image.size}]`, 'success');
    await esptool.flash_image(image.image.image, offset, options)
  }

  if(verify_check.checked)
  {
    const md5 = await esptool.flash_md5_calc(offset, image.image.image.byteLength);
    serial.view.write(`\r\n[${image.image.file.name}] hash flashed: ` + md5);
    const md5i = md5_digest.hash(image.image.image);
    serial.view.write(`[${image.image.file.name}] hash image:   ` + md5i);
    if(md5 != md5i)
    {
      serial.view.write(`Verification FAIL! Image and flashed hash does not match. [${md5}]`);
      return false;
    }
    serial.view.write("Verification succeced!");
  }
  return true;
}

async function get_esptool(serial)
{
  const esptool = serial.view.selected_device();
  if(!esptool)
  {
    serial.view.write('Aborting! Serial not found!');
    make_report("Upload image FAIL: serial not found", 'warning');
    return false;
  }

  if(esptool.is_open())
  {
    serial.view.write('Found serial ' + esptool.name);
    return esptool;
  }

  return await serial.view.open_bootloader();
}
