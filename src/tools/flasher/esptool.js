import {Serial_Device} from './serial.js';
import {SLIP} from './slip.js';
import {sleep, to_hex} from './utility.js';

export const status_bytes = {
  success: 0,
  failure: 1
};

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

function get_op_name(op)
{
  const n = Object.entries(command).find(([key, value]) => value == op);
  return n ? n[0] : 'not found';
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
    await this.command(command.erase_flash, [], 0, erase_flash_timeout);
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
    for (let i = 0; i < 4; i++)
    {
      const packet = await this.read_register(chips[this._chip].efuses_addr + 4 * i);
      if(packet.error)
      {
        throw 'Error reading packet';
      }
      this._efuses[i] = packet.value;
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
    let oui;

    switch(this._chip)
    {
      case ESP8266:
      {
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
      if(op == command.erase_flash)
      {
        console.log(1);
        const data2 = SLIP.encoded_command(op, data, checksum);
        console.log(data2);
        await this.write(data2);
      }
      else
        await this.write(SLIP.encoded_command(op, data, checksum));
      const response = await this.read_timeout(timeout),
            packets = SLIP.split_packet(response),
            ret = packets.packets.some(p => {
                    packet = SLIP.decode(p);
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
        console.log('error', packet);
        throw 'packet error';
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
}
