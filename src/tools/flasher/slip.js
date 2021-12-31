const checksum_seed = 0xef;

export class SLIP{
  static encode(buffer)
  {
    const encoded = [0xC0];
    for(let byte of buffer)
    {
      switch(byte)
      {
        case 0xDB:
          encoded.push(0xDB, 0xDD);
          break;
        case 0xC0:
          encoded.push(0xDB, 0xDC);
          break;
        default:
          encoded.push(byte);
      }
    }
    encoded.push(0xC0);
    return encoded;
  }

  static split_packet(data, remain = null)
  {
    let packets = [];
    let i = 0, in_packet = remain ? true : false, packet = remain ? remain : [];
    for(; i < data.length; i++)
    {
      if(data[i] == 0xC0)
      {
        //is a control character
        if(in_packet)
        {
          packet.push(data[i]);
          packets.push(packet);
          in_packet = false;
          packet = [];
        }
        else
        {
          packet = [data[i]];
          in_packet = true;
        }
      }
      else if(in_packet)
      {
        //is not a control character
        packet.push(data[i]);
      }
      // else
      // {
      //   console.log('out', data[i]);
      // }
    }
    return {packets, remain}
  }

  static decode(buffer)
  {
    if(buffer[0] != 0xC0 || buffer[buffer.length - 1] != 0xC0)
    {
      return {error: true, error_message: 'missing control bytes'};
    }

    const decoded = [];
    for(let i = 1; i < buffer.length - 1; i++)
    {
      if(buffer[i] == 0xDB)
      {
        i++;
        if(i < (buffer.length - 1))
        {
          switch(buffer[i])
          {
            case 0xDD:
              decoded.push(0xDB);
            break;
            case 0xDC:
              decoded.push(0xC0);
            break;
            default:
              decoded.push(0xDB, buffer[i]);
            break;
          }
        }
        else
        {
          decoded.push(0xDB);
        }
      }
      else
      {
        decoded.push(buffer[i]);
      }
    }

    if(decoded.length < 12 /* minimum response header + status byte */)
    {
      return {error: true, error_message: 'packet too small'};
    }

    if(decoded[0] != 0x01 /* response */)
    {
      return {error: true, error_message: 'not a response'}
    }

    const arr = new Uint8Array(decoded),
          view = new DataView(arr.buffer),
          data = arr.slice(8),
          status = data[data.length - 4],
          status_error = data[data.length - 3];

    return {
      error: false,
      direction: view.getUint8(0),
      op: view.getUint8(1),
      size: view.getUint16(2, true),
      value: view.getUint32(4, true),
      data,
      status,
      status_error
     }
  }

  static encoded_command(op, buffer, checksum = 0)
  {
    return new Uint8Array(SLIP.encode(SLIP.command(op, buffer, checksum)));
  }

  static encoded_read_register(register)
  {
    return new Uint8Array(SLIP.encode(SLIP.read_register(register)));
  }

  static command(op, buffer, checksum = 0)
  {
    return [0x00, op, ...SLIP.uint16_to_arr(buffer.length), ...SLIP.uint32_to_arr(checksum), ...buffer];
  }

  static checksum(data, seed = checksum_seed)
  {
    for (const b of data)
    {
      seed ^= b;
    }
    return seed;
  }

  static uint16_to_arr(value)
  {
    let value_arr = new DataView(new ArrayBuffer(2));
    value_arr.setUint16(0, value, true /* little endian */);

    return [value_arr.getUint8(0), value_arr.getUint8(1)];
  }

  static uint32_to_arr(value)
  {
    let value_arr = new DataView(new ArrayBuffer(4));
    value_arr.setUint32(0, value, true /* little endian */);

    return [value_arr.getUint8(0), value_arr.getUint8(1), value_arr.getUint8(2), value_arr.getUint8(3)];
  }
}
