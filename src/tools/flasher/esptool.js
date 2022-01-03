import {Serial_Device} from './serial.js';
import {SLIP} from './slip.js';
import {sleep, to_hex} from './utility.js';
import {ESP32_stub} from './stubs.js';

export const status_bytes = {
  success: 0,
  failure: 1
};

export const flash_end_flag = {
  'reboot': 0,
  'run_user_code': 1,
  'ignore': 2
}

export const rom_load_error = {
  0x05: 'Received message is invalid',
  0x06: 'Failed to act on received message',
  0x07: 'Invalid CRC in message',
  0x08: 'flash write error',
  0x09: 'flash read error',
  0x0a: 'flash read length error',
  0x0b: 'Deflate error'
};

export const software_load_error = {
  0xc0: 'ESP_BAD_DATA_LEN',
  0xc1: 'ESP_BAD_DATA_CHECKSUM',
  0xc2: 'ESP_BAD_BLOCKSIZE',
  0xc3: 'ESP_INVALID_COMMAND',
  0xc4: 'ESP_FAILED_SPI_OP',
  0xc5: 'ESP_FAILED_SPI_UNLOCK',
  0xc6: 'ESP_NOT_IN_FLASH_MODE',
  0xc7: 'ESP_INFLATE_ERROR',
  0xc8: 'ESP_NOT_ENOUGH_DATA',
  0xc9: 'ESP_TOO_MUCH_DATA',

  0xff: 'ESP_CMD_NOT_IMPLEMENTED'
}

export const command = {
  flash_begin: 0x02,
  flash_data: 0x03,
  flash_end: 0x04,
  mem_begin: 0x05,
  mem_end: 0x06,
  mem_data: 0x07,
  sync: 0x08,
  write_reg: 0x09,
  read_reg: 0x0a,
  spi_set_params: 0x0b,
  spi_attach: 0x0d,
  change_baudrate: 0xf,
  flash_defl_begin: 0x10,
  flash_defl_data: 0x11,
  flash_defl_end: 0x12,
  spi_flash_md5: 0x13,

  //software load only,
  erase_flash: 0xd0,
  erase_region: 0xd1,
  read_flash: 0xd2,
  run_user_code: 0xd3,
};

const register = {
  CHIP_DETECT_MAGIC: 0x40001000,
};

const ESP8266 = 0xfff0c101,
      ESP32 = 0x00f01d83,
      ESP32S2 = 0x000007c6;

const chips = {
  [ESP8266]: {name: 'ESP8266', efuses_addr: 0x3FF00050},
  [ESP32]: {name: 'ESP32', efuses_addr: 0x3FF5A000},
  [ESP32S2]: {name: 'ESP32-S2', efuses_addr: 0x6001A000}
}

const USB_RAM_BLOCK = 0x800,
      ESP_RAM_BLOCK = 0x1800;

const FLASH_WRITE_SIZE = 0x400,
      STUBLOADER_FLASH_WRITE_SIZE = 0x4000,
      FLASH_SECTOR_SIZE = 0x1000;

const ERASE_REGION_TIMEOUT_PER_MB = 30000;     // timeout (per megabyte) for erasing a region in ms

function get_op_name(op)
{
  const n = Object.entries(command).find(([key, value]) => value == op);
  return n ? n[0] : 'not found';
}

function get_status_error_name(status_error)
{
  if(status_error in rom_load_error) return rom_load_error[status_error];
  if(status_error in software_load_error) return software_load_error[status_error];
  return '<unrecognized>';
}

const default_timeout = 3000,
      erase_flash_timeout = 120000;

const sync_packet = [0x07, 0x07, 0x12, 0x20,
                    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
                    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
                    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
                    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55];

export class ESPTool extends Serial_Device{
  constructor(device, index)
  {
    super(device, index);

    this._chip = null;
    this._efuses = null;
    this._is_stub = false;
  }

  async signal_reset()
  {
    await this.signals({dataTerminalReady: false, requestToSend: true});
    await sleep(100);
    await this.signals({dataTerminalReady: true});
  }

  async signal_bootloader()
  {
    await this.signals({ dataTerminalReady: false, requestToSend: true });
    await this.signals({ dataTerminalReady: true, requestToSend: false });
    await sleep(1000);
  }

  async sync(retries = 5)
  {
    for(let i = 0; i < retries; i++)
    {
      console.log("Sending sync command[" + i + "]...");
      try{
        await this.command(command.sync, sync_packet, 0, 100);
        return true;
      }
      catch(e)
      {
          console.log('sync error', e);
      }
    }
    throw "Sync fail";
  }

  async erase_flash()
  {
    await this.command_until(command.erase_flash, [], 0, erase_flash_timeout);
  }

  async chip()
  {
    const reg = await this.read_register(register.CHIP_DETECT_MAGIC);
    this._chip = reg.value;
    if(reg.value in chips) return chips[reg.value].name;
    return '0x' + to_hex(reg.value, 8);
  }

  async efuses()
  {
    if(!this._chip || !(this._chip in chips))
    {
      throw 'chip not defined';
    }

    this._efuses = new Array(4).fill(0)
    try{
      for (let i = 0; i < 4; i++)
      {
        const packet = await this.read_register(chips[this._chip].efuses_addr + 4 * i);
        if(packet.error)
        {
          throw 'Error reading packet';
        }
        this._efuses[i] = packet.value;
      }
    }
    catch(e)
    {
      this._efuses = null;
      throw e;
    }

    return this._efuses;
  }

  mac()
  {
    if(!this._chip || !this._efuses)
    {
      return false
    }
    const mac = new Array(6).fill(0),
          mac0 = this._efuses[0],
          mac1 = this._efuses[1],
          mac2 = this._efuses[2],
          mac3 = this._efuses[3];

    switch(this._chip)
    {
      case ESP8266:
      {
        let oui;
        if (mac3 != 0)
        {
          oui = [(mac3 >> 16) & 0xFF, (mac3 >> 8) & 0xFF, mac3 & 0xFF];
        }
        else if (((mac1 >> 16) & 0xFF) == 0)
        {
          oui = [0x18, 0xFE, 0x34];
        }
        else if (((mac1 >> 16) & 0xFF) == 1)
        {
          oui = [0xAC, 0xD0, 0x74];
        }
        else
        {
          return false;
        }

        mac[0] = oui[0];
        mac[1] = oui[1];
        mac[2] = oui[2];
        mac[3] = (mac1 >> 8) & 0xFF;
        mac[4] = mac1 & 0xFF;
        mac[5] = (mac0 >> 24) & 0xFF;
      }
      break;
      case ESP32:
      {
        mac[0] = mac2 >> 8 & 0xFF;
        mac[1] = mac2 & 0xFF;
        mac[2] = mac1 >> 24 & 0xFF;
        mac[3] = mac1 >> 16 & 0xFF;
        mac[4] = mac1 >> 8 & 0xFF;
        mac[5] = mac1 & 0xFF;
      }
      break;
      case ESP32S2:
      {
        mac[0] = mac2 >> 8 & 0xFF;
        mac[1] = mac2 & 0xFF;
        mac[2] = mac1 >> 24 & 0xFF;
        mac[3] = mac1 >> 16 & 0xFF;
        mac[4] = mac1 >> 8 & 0xFF;
        mac[5] = mac1 & 0xFF;
      }
      break;
      default:
        return false;
    }
    return mac;
  }

  async command(op, data, checksum, timeout = default_timeout)
  {
    try{
      let error = 'error', packet = null;
      await this.write(SLIP.encoded_command(op, data, checksum));
      const response = await this.read_timeout(timeout),
            packets = SLIP.split_packet(response),
            ret = packets.packets.some(p => {
              packet = SLIP.decode(p, this._is_stub);
              if(!packet.error && packet.op == op)
              {
                return true;
              }
            });
      if(ret)
      {
        return packet;
      }
      else
      {
        throw packet;
      }
    }
    catch(e)
    {
      throw e;
    }
  }

  async command_until(op, data, checksum, timeout = default_timeout)
  {
    try{
      let error = 'error', packet = null, remain = null;
      await this.write(SLIP.encoded_command(op, data, checksum));
      let end = Date.now() + timeout;
      let now = Date.now();
      while(true)
      {
        const response = await this.read_timeout(end - Date.now());
        const packets = SLIP.split_packet(response, remain),
              ret = packets.packets.some(p => {
                packet = SLIP.decode(p, this._is_stub);
                if(!packet.error && packet.op == op)
                {
                  return true;
                }
              });
        if(ret)
        {
          return packet;
        }
        remain = packets.remain;
      }
    }
    catch(e)
    {
      throw e;
    }
  }

  async read_register(register, timeout = default_timeout)
  {
    return await this.command(command.read_reg, SLIP.uint32_to_arr(register), false, timeout);
  }

  async upload_stub()
  {
    let ram_block = ESP_RAM_BLOCK;

    console.log(ESP32_stub);

    // Upload
    console.log("Uploading stub...")
    for (let field of ['text', 'data'])
    {
      if(field in ESP32_stub)
      {
        const offset = ESP32_stub[field + "_start"],
              length = ESP32_stub[field].length,
              blocks = Math.floor((length + ram_block - 1) / ram_block);

        await this.mem_begin(length, blocks, ram_block, offset);
        for(let i = 0; i < blocks; i++)
        {
          const from_offs = i * ram_block;
          let to_offs = from_offs + ram_block;
          if (to_offs > length)
          {
            to_offs = length;
          }
          await this.mem_data(ESP32_stub[field].slice(from_offs, to_offs), i);
        }
      }
    }

    console.log("Running stub...");
    let end_packet;
    try{
      end_packet = await this.mem_end(0, ESP32_stub.entry, 50);
    }
    catch(e)
    {
      throw e;
    }

    try{
      let p = await this.read_timeout(500);
      if(String.fromCharCode(...SLIP.payload(SLIP.read_packet(p).packet)) != 'OHAI')
      {
        throw "Failed to start stub. Unexpected response: " + p;
      }
    }
    catch(e)
    {
      throw e;
    }
    this._is_stub = true;

    console.log("Stub is now running...");
  }

  mem_begin(total_size, block_num, block_size, offset)
  {
    return this.command(command.mem_begin,
      [...SLIP.uint32_to_arr(total_size),
        ...SLIP.uint32_to_arr(block_num),
        ...SLIP.uint32_to_arr(block_size),
        ...SLIP.uint32_to_arr(offset)],
      0);
  }

  mem_data(data, block_seq)
  {
    return this.command(command.mem_data,
          [...SLIP.uint32_to_arr(data.length),
          ...SLIP.uint32_to_arr(block_seq),
          ...SLIP.uint32_to_arr(0),
          ...SLIP.uint32_to_arr(0),
          ...data],
        SLIP.checksum(data));
  }

  mem_end(exec_flag, entry_addr, timeout = 500)
  {
    return this.command(command.mem_end,
          [...SLIP.uint32_to_arr(exec_flag),
          ...SLIP.uint32_to_arr(entry_addr)],
        0, timeout);
  }

  async flash_image(image, offset, options = {})
  {
    const ops = {...{end_flag: flash_end_flag.ignore, upload_progress: function(){}}, ...options};
    const file_size = image.byteLength,
          blocks = await this.flash_begin(file_size, offset),
          flash_write_size = this.flash_write_size();
    let block = [],
        seq = 0,
        written = 0,
        position = 0;

    while (file_size - position > 0)
    {
      ops.upload_progress({
        percent: Math.floor(100 * (seq + 1) / blocks),
        seq, blocks, file_size, position, written
      });
      if (file_size - position >= flash_write_size)
      {
        block = Array.from(new Uint8Array(image, position, flash_write_size));
      }
      else
      {
        // Pad the last block
        block = Array.from(new Uint8Array(image, position, file_size - position));
        block = block.concat(new Array(flash_write_size - block.length).fill(0xFF));
      }
      await this.flash_data(block, seq);
      seq += 1;
      written += block.length;
      position += flash_write_size;
    }

    if(ops.end_flag == flash_end_flag.reboot || ops.end_flag == flash_end_flag.run_user_code)
    {
      await flash_end(end_flag);
    }
  }

  async flash_begin(size = 0, offset = 0, encrypted = false)
  {
    const flash_write_size = this.flash_write_size();
    if (!this._is_stub && [ESP32, ESP32S2].includes(this._chip))
    {
      await this.command(command.spi_attach, new Array(8).fill(0));
    }
    if (this._chip == ESP32)
    {
      // We are hardcoded for 4MB flash on ESP32
      await this.command(command.spi_set_params,
                [...SLIP.uint32_to_arr(0),
                ...SLIP.uint32_to_arr(4 * 1024 * 1024),
                ...SLIP.uint32_to_arr(0x10000),
                ...SLIP.uint32_to_arr(4096),
                ...SLIP.uint32_to_arr(256),
                ...SLIP.uint32_to_arr(0xffff)]);
    }
    const num_blocks = Math.floor((size + flash_write_size - 1) / flash_write_size),
          erase_size = this.erase_size(offset, size);

    const timeout = this._is_stub ? default_timeout : ESPTool.timeout_per_mb(ERASE_REGION_TIMEOUT_PER_MB, size);

    let buffer = [...SLIP.uint32_to_arr(erase_size),
                  ...SLIP.uint32_to_arr(num_blocks),
                  ...SLIP.uint32_to_arr(flash_write_size),
                  ...SLIP.uint32_to_arr(offset)];

    if (this._chip == ESP32S2 && !this._is_stub)
    {
      buffer.push(...SLIP.uint32_to_arr(encrypted ? 1 : 0));
    }

    await this.command(command.flash_begin, buffer, 0, timeout);

    return num_blocks;
  }

  flash_data(data, seq, timeout = default_timeout)
  {
    return this.command_until(
      command.flash_data,
      [...SLIP.uint32_to_arr(data.length),
        ...SLIP.uint32_to_arr(seq),
        ...SLIP.uint32_to_arr(0),
        ...SLIP.uint32_to_arr(0),
        ...data],
      SLIP.checksum(data),
      timeout,
    );
  }

  flash_end(flag)
  {
    return this.command(command.flash_end, SLIP.uint32_to_arr(flag), 0);
  }

  flash_write_size()
  {
      return this._is_stub ? STUBLOADER_FLASH_WRITE_SIZE : FLASH_WRITE_SIZE;
  };

  erase_size(offset, size)
  {
    if (this._chip != ESP8266 || this._is_stub)
    {
      return size;
    }
    const sectors_per_block = 16,
          num_sectors = Math.floor((size + FLASH_SECTOR_SIZE - 1) / FLASH_SECTOR_SIZE),
          start_sector = Math.floor(offset / FLASH_SECTOR_SIZE);

    let head_sectors = sectors_per_block - (start_sector % sectors_per_block);
    if (num_sectors < head_sectors)
    {
      head_sectors = num_sectors;
    }

    if (num_sectors < 2 * head_sectors) {
      return Math.floor((num_sectors + 1) / 2 * FLASH_SECTOR_SIZE);
    }

    return (num_sectors - head_sectors) * FLASH_SECTOR_SIZE;
  };

  static timeout_per_mb(seconds_per_mb, size_bytes)
  {
      let result = Math.floor(seconds_per_mb * (size_bytes / 0x1e6));
      if (result < default_timeout)
      {
        return default_timeout;
      }
      return result;
  };
}
