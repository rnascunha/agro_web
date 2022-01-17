import {Serial_Device} from './serial.js';
import {SLIP} from './slip.js';
import {sleep, to_hex, pad_to} from './utility.js';
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
};

const fs256kb = 0x12,
      fs512kb = 0x13,
      fs1mb = 0x14,
      fs2mb = 0x15,
      fs4mb = 0x16,
      fs8mb = 0x17,
      fs16mb = 0x18;

const flash_sizes = {
  [fs256kb]: {name: '256KB', value: 256 * 1024},
  [fs512kb]: {name: '512KB', value: 512 * 1024},
  [fs1mb]: {name: '1MB', value: 1 * 1024 * 1024},
  [fs2mb]: {name: '2MB', value: 2 * 1024 * 1024},
  [fs4mb]: {name: '4MB', value: 4 * 1024 * 1024},
  [fs8mb]: {name: '8MB', value: 8 * 1024 * 1024},
  [fs16mb]: {name: '16MB', value: 16 * 1024 * 1024},
};

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
  [ESP8266]: {name: 'ESP8266', efuses_addr: 0x3FF00050,
              mac: function(efuses){
                let oui;
                if (efuses[3] != 0)
                {
                  oui = [(efuses[3] >> 16) & 0xFF, (efuses[3] >> 8) & 0xFF, efuses[3] & 0xFF];
                }
                else if (((efuses[1] >> 16) & 0xFF) == 0)
                {
                  oui = [0x18, 0xFE, 0x34];
                }
                else if (((efuses[1] >> 16) & 0xFF) == 1)
                {
                  oui = [0xAC, 0xD0, 0x74];
                }
                else
                {
                  return false;
                }

                return [oui[0],
                        oui[1],
                        oui[2],
                        (efuses[1] >> 8) & 0xFF,
                        efuses[1] & 0xFF,
                        (efuses[0] >> 24) & 0xFF];
              },
              SPI_REG_BASE: 0x60000200,
              SPI_USR_OFFS: 0x1c,
              SPI_USR1_OFFS: 0x20,
              SPI_USR2_OFFS: 0x24,
              SPI_MOSI_DLEN_OFFS: null,
              SPI_MISO_DLEN_OFFS: null,
              SPI_W0_OFFS: 0x40
            },
  [ESP32]: {name: 'ESP32', efuses_addr: 0x3FF5A000,
            mac: function(efuses){
              return [efuses[2] >> 8 & 0xFF,
                      efuses[2] & 0xFF,
                      efuses[1] >> 24 & 0xFF,
                      efuses[1] >> 16 & 0xFF,
                      efuses[1] >> 8 & 0xFF,
                      efuses[1] & 0xFF];
            },
            SPI_REG_BASE: 0x3ff42000,
            SPI_USR_OFFS: 0x1c,
            SPI_USR1_OFFS: 0x20,
            SPI_USR2_OFFS: 0x24,
            SPI_MOSI_DLEN_OFFS: 0x28,
            SPI_MISO_DLEN_OFFS: 0x2c,
            SPI_W0_OFFS: 0x80
          },
  [ESP32S2]: {name: 'ESP32-S2', efuses_addr: 0x6001A000,
              mac: function(efuses){
                return [efuses[2] >> 8 & 0xFF,
                        efuses[2] & 0xFF,
                        efuses[1] >> 24 & 0xFF,
                        efuses[1] >> 16 & 0xFF,
                        efuses[1] >> 8 & 0xFF,
                        efuses[1] & 0xFF];
              },
              SPI_REG_BASE: 0x3f402000,
              SPI_USR_OFFS: 0x18,
              SPI_USR1_OFFS: 0x1c,
              SPI_USR2_OFFS: 0x20,
              SPI_MOSI_DLEN_OFFS: 0x24,
              SPI_MISO_DLEN_OFFS: 0x28,
              SPI_W0_OFFS: 0x58
            }
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

    this._baudrate = null;
    this._chip = null;
    this._efuses = null;
    this._is_stub = false;
    this._flash_size = fs4mb;  //default 4MB
  }

  open(baud)
  {
    this._baudrate = baud;
    return super.open(baud);
  }

  close()
  {
    this._baudrate = null;
    return super.close();
  }

  set_port_baudrate(baud)
  {
    return super.set_baudrate(baud);
  }

  async signal_reset()
  {
    await this.signals({dataTerminalReady: false, requestToSend: true});
    await sleep(100);
    await this.signals({dataTerminalReady: true});
  }

  async signal_bootloader()
  {
    // await this.signals({ dataTerminalReady: false, requestToSend: true });
    // await this.signals({ dataTerminalReady: true, requestToSend: false });
    // await sleep(1000);

    await this.signals({ dataTerminalReady: false, requestToSend: true });
    await sleep(100);
    //if esp32r0_delay
    //await sleep(1200);

    await this.signals({ dataTerminalReady: true, requestToSend: false });
    await sleep(50);
    //if esp32r0_delay
    //await sleep(400);
    await this.signals({ dataTerminalReady: false});

    await sleep(1000);
  }

  async sync(retries = 5)
  {
    for(let i = 0; i < retries; i++)
    {
      try{
        await this.command(command.sync, sync_packet, 0, 100);
        return true;
      }
      catch(e)
      {
          // console.log('sync error', e);
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

    this._efuses = [];
    try{
      for (let i = 0; i < 4; i++)
      {
        const packet = await this.read_register(chips[this._chip].efuses_addr + 4 * i);
        if(packet.error)
        {
          throw 'Error reading packet';
        }
        this._efuses.push(packet.value);
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

    return this._chip in chips ? chips[this._chip].mac(this._efuses) : false;
  }

  async command(op, data, checksum, timeout = default_timeout)
  {
    try{
      let error = 'error', packet = null;
      await this.write(SLIP.encoded_command(op, data, checksum));
      if(timeout == 0) return {};
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
    let error = 'error', packet = null, remain = null;
    await this.write(SLIP.encoded_command(op, data, checksum));
    let end = Date.now() + timeout;
    let now = Date.now();
    if(timeout == 0) return {};
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

  async read_register(register, timeout = default_timeout)
  {
    return await this.command_until(command.read_reg, SLIP.pack32(register), 0, timeout);
  }

  async write_register(address, value, mask = 0xFFFFFFFF, delay_us = 0, timeout = default_timeout)
  {
    return await this.command_until(command.write_reg,
                        SLIP.pack32(address, value, mask, delay_us),
                        0, timeout);
  }

  async upload_stub()
  {
    let ram_block = ESP_RAM_BLOCK;

    // Upload
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
  }

  mem_begin(total_size, block_num, block_size, offset)
  {
    return this.command(command.mem_begin,
                  SLIP.pack32(total_size, block_num, block_size, offset),
                  0);
  }

  mem_data(data, block_seq)
  {
    return this.command(command.mem_data,
          SLIP.pack32(data.length, block_seq, 0, 0).concat(...data),
          SLIP.checksum(data));
  }

  mem_end(exec_flag, entry_addr, timeout = 500)
  {
    return this.command(command.mem_end,
          SLIP.pack32(exec_flag, entry_addr),
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

      ops.upload_progress({
        percent: Math.floor(100 * (seq + 1) / blocks),
        seq, blocks, file_size, position, written
      });
    }

    if(ops.end_flag == flash_end_flag.reboot || ops.end_flag == flash_end_flag.run_user_code)
    {
      await this.flash_end(ops.end_flag);
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
      await this.command(command.spi_set_params,
                SLIP.pack32(0, this.flash_size.value, 0x10000, 4096, 256, 0xffff));
    }
    const num_blocks = Math.floor((size + flash_write_size - 1) / flash_write_size),
          erase_size = this.erase_size(offset, size);

    const timeout = this._is_stub ? default_timeout : ESPTool.timeout_per_mb(ERASE_REGION_TIMEOUT_PER_MB, size);

    let buffer = SLIP.pack32(erase_size, num_blocks, flash_write_size, offset);

    if (this._chip == ESP32S2 && !this._is_stub)
    {
      buffer.push(...SLIP.pack32(encrypted ? 1 : 0));
    }

    await this.command(command.flash_begin, buffer, 0, timeout);

    return num_blocks;
  }

  flash_data(data, seq, timeout = default_timeout)
  {
    return this.command_until(
          command.flash_data,
          SLIP.pack32(data.length, seq, 0, 0).concat(data),
          SLIP.checksum(data),
          timeout);
  }

  async flash_end(flag)
  {
    await this.command(command.flash_end, SLIP.pack32(flag), 0);
  }

  async flash_image_deflate(image_compressed, original_size, offset, options = {})
  {
    const ops = {...{end_flag: flash_end_flag.ignore, upload_progress: function(){}}, ...options};
    const file_size = original_size,
          compressed_size = image_compressed.byteLength,
          blocks = await this.flash_begin_deflate(file_size, compressed_size, offset),
          flash_write_size = this.flash_write_size();

    let block = [],
        seq = 0,
        written = 0,
        position = 0;

    while (compressed_size - position > 0)
    {
      if (compressed_size - position >= flash_write_size)
      {
        block = Array.from(new Uint8Array(image_compressed, position, flash_write_size));
      }
      else
      {
        // Pad the last block
        block = Array.from(new Uint8Array(image_compressed, position, compressed_size - position));
        block = block.concat(new Array(flash_write_size - block.length).fill(0xFF));
      }
      await this.flash_data_deflate(block, seq);
      seq += 1;
      written += block.length;
      position += flash_write_size;

      ops.upload_progress({
        percent: Math.floor(100 * (seq) / blocks),
        seq, blocks, file_size: compressed_size, position, written
      });
    }

    if(ops.end_flag == flash_end_flag.reboot || ops.end_flag == flash_end_flag.run_user_code)
    {
      await this.flash_end_deflate(ops.end_flag);
    }
  }

  async flash_begin_deflate(size, compressed_size, offset, encrypted = false)
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
                SLIP.pack32(0, this.flash_size.value, 0x10000, 4096, 256, 0xffff));
    }
    const num_blocks = Math.floor((compressed_size + flash_write_size - 1) / flash_write_size),
          erase_size = this.erase_size(offset, size);

    const timeout = this._is_stub ? default_timeout : ESPTool.timeout_per_mb(ERASE_REGION_TIMEOUT_PER_MB, size);

    let buffer = SLIP.pack32(erase_size, num_blocks, flash_write_size, offset);

    if (this._chip == ESP32S2 && !this._is_stub)
    {
      buffer.push(...SLIP.pack32(encrypted ? 1 : 0));
    }

    await this.command(command.flash_defl_begin, buffer, 0, timeout);

    return num_blocks;
  }

  async flash_data_deflate(data, seq, timeout = default_timeout)
  {
    return this.command_until(
          command.flash_defl_data,
          SLIP.pack32(data.length, seq, 0, 0).concat(data),
          SLIP.checksum(data),
          timeout);
  }

  async flash_end_deflate(flag)
  {
    await this.command(command.flash_defl_end, SLIP.pack32(flag), 0);
  }

  async flash_md5_calc(offset, size)
  {
    const packet = await this.command_until(command.spi_flash_md5,
                            SLIP.pack32(offset, size, 0, 0),
                      0, this._is_stub ? 3000 : 120000);

    if(this._is_stub)
    {
      let hex = '';
      for(let i = 0; i < packet.data.length - 2; i++)
      {
        hex += to_hex(packet.data[i], 2);
      }
      return hex;
    }
    return String.fromCharCode(...packet.data);//.slice(0, -4));
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

  /*
   * Don't know if is possible to change baudRate with Serial API
   */
  async set_baudrate(baud)
  {
    if(this._chip && this._chip == ESP8266)
    {
      throw 'invalid chip';
    }

    await this.command(command.change_baudrate,
            SLIP.pack32(baud, this._is_stub ? this._baudrate : 0),
       0);
    await super.set_baudrate(baud);
    await sleep(50);
  }

  async flash_id()
  {
    const SPIFLASH_RDID = 0x9F;
    return await this.command_spiflash(SPIFLASH_RDID, [], 24);
  }

  get flash_size()
  {
    return flash_sizes[this._flash_size];
  }

  async detect_flash_size()
  {
    const value = await this.flash_id();
    if(value.data[0] != status_bytes.success)
    {
      this._flash_size = fs4mb;
      return false;
    }
    const id = value.value >> 16;
    if(id in flash_sizes)
    {
      this._flash_size = id;
      return true;
    }
    return false;
  }

  /*
   Run an arbitrary SPI flash command.

   This function uses the "USR_COMMAND" functionality in the ESP
   SPI hardware, rather than the precanned commands supported by
   hardware. So the value of spiflash_command is an actual command
   byte, sent over the wire.

   After writing command byte, writes 'data' to MOSI and then
   reads back 'read_bits' of reply on MISO. Result is a number.
   */
  async command_spiflash(command, data, read_bits = 0)
  {
    if(!this._chip || !(this._chip in chips))
    {
      throw 'chip not defined';
    }
    if(read_bits > 32)
    {
        throw "Reading more than 32 bits back from a SPI flash operation is unsupported";
    }

    const chip = chips[this._chip];

    //SPI_USR register flags
    let SPI_USR_COMMAND = (1 << 31),
        SPI_USR_MISO    = (1 << 28),
        SPI_USR_MOSI    = (1 << 27);

    //SPI registers, base address differs ESP32* vs 8266
    let base = chip.SPI_REG_BASE,
        SPI_CMD_REG       = base + 0x00,
        SPI_USR_REG       = base + chip.SPI_USR_OFFS,
        SPI_USR1_REG      = base + chip.SPI_USR1_OFFS,
        SPI_USR2_REG      = base + chip.SPI_USR2_OFFS,
        SPI_W0_REG        = base + chip.SPI_W0_OFFS;

    let set_data_lengths;
    //following two registers are ESP32 & 32S2/32C3 only
    if(chip.SPI_MOSI_DLEN_OFFS)
    {
      //ESP32/32S2/32C3 has a more sophisticated way to set up "user" commands
      set_data_lengths = async (mosi_bits, miso_bits) => {
        let SPI_MOSI_DLEN_REG = base + chip.SPI_MOSI_DLEN_OFFS,
            SPI_MISO_DLEN_REG = base + chip.SPI_MISO_DLEN_OFFS;
        if(mosi_bits > 0)
        {
          await this.write_register(SPI_MOSI_DLEN_REG, mosi_bits - 1);
        }
        if(miso_bits > 0)
        {
          await this.write_register(SPI_MISO_DLEN_REG, miso_bits - 1)
        }
      }
    }
    else
    {
      set_data_lengths = async (mosi_bits, miso_bits) => {
      let SPI_DATA_LEN_REG = SPI_USR1_REG,
          SPI_MOSI_BITLEN_S = 17,
          SPI_MISO_BITLEN_S = 8;
        mosi_mask = (mosi_bits == 0) ? 0 : (mosi_bits - 1)
        miso_mask = (miso_bits == 0) ? 0 : (miso_bits - 1)
        await this.write_register(SPI_DATA_LEN_REG,
                       (miso_mask << SPI_MISO_BITLEN_S) | (
                           mosi_mask << SPI_MOSI_BITLEN_S))
      }
    }

    //SPI peripheral "command" bitmasks for SPI_CMD_REG
    let SPI_CMD_USR  = (1 << 18);
    //shift values
    let SPI_USR2_COMMAND_LEN_SHIFT = 28;

    let data_bits = data.length * 8,
        old_spi_usr = await this.read_register(SPI_USR_REG),
        old_spi_usr2 = await this.read_register(SPI_USR2_REG),
        flags = SPI_USR_COMMAND;

    if(data.length > 64)
    {
        throw "Writing more than 64 bytes of data with one SPI command is unsupported";
    }

    if(read_bits > 0)
    {
      flags |= SPI_USR_MISO;
    }
    if(data_bits > 0)
    {
      flags |= SPI_USR_MOSI;
    }

    await set_data_lengths(data_bits, read_bits);
    await this.write_register(SPI_USR_REG, flags);
    await this.write_register(SPI_USR2_REG, (7 << SPI_USR2_COMMAND_LEN_SHIFT) | command);

    if(data_bits == 0)
    {
      await this.write_register(SPI_W0_REG, 0) // clear data register before we read it
    }
    else
    {
      data = pad_to(data, 4, 0x00); // pad to 32-bit multiple
      let next_reg = SPI_W0_REG
      for(let d in data)
      {
        await this.write_register(next_reg, word)
        next_reg += 4
      }
    }

    await this.write_register(SPI_CMD_REG, SPI_CMD_USR)

    const wait_done = async () => {
      for(let i = 0; i < 10; i++)
      {
        const r = await this.read_register(SPI_CMD_REG);
        if((r.value & SPI_CMD_USR) == 0)
          return;
      }
      throw "SPI command did not complete in time";
    };
    await wait_done();

    let status = await this.read_register(SPI_W0_REG);
    //restore some SPI controller registers
    await this.write_register(SPI_USR_REG, old_spi_usr.value);
    await this.write_register(SPI_USR2_REG, old_spi_usr2.value);

    return status
  }

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
