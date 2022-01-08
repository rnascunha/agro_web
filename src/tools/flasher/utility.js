
export function digest_support()
{
  return 'crypto' in window && 'subtle' in window.crypto;
}

export function compression_support()
{
  return 'CompressionStream' in window;
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
export function blob_to_hex(blob)
{
  const hashArray = Array.from(new Uint8Array(blob));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

export async function read_file(file)
{
  return Promise.resolve({
    then: function(resolve){
      let reader = new FileReader(),
          rawData = new ArrayBuffer();

      reader.loadend = function() {

      }

      reader.onload = async (e) => {
        resolve(e.target.result);
      }

      reader.readAsArrayBuffer(file);
    }
  })
}

export async function hex_sha256(blob)
{
  const hashBuffer = await crypto.subtle.digest('SHA-256', blob);           // hash the message
  return blob_to_hex(hashBuffer);
}

export function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function to_hex(value, size = 2)
{
  return value.toString(16).padStart(size, '0');
}

export function to_hex_string(value)
{
  let hex = '';
  for(let i = 0; i < value.length; i++)
  {
    hex += to_hex(value[i], 2);
  }
  return hex;
}

export function mac_to_string(mac)
{
  return `${to_hex(mac[0], 2)}:${to_hex(mac[1], 2)}:${to_hex(mac[2], 2)}:${to_hex(mac[3], 2)}:${to_hex(mac[4], 2)}:${to_hex(mac[5], 2)}`;
}

export function to_byte_array(str)
{
  let byte_array = [];
  for (let i = 0; i < str.length; i++)
  {
    let charcode = str.charCodeAt(i);
    if (charcode <= 0xFF)
    {
      byte_array.push(charcode);
    }
  }
  return byte_array;
}

export function read_c_string(string, char = '\x00')
{
  return string.substring(0, string.indexOf(char));
}

export function is_hex_string(str)
{
  return /^0?x?[0-9a-fA-F]{0,}$/.test(str);
}

export function is_hex_char(key)
{
  // if(key.length > 1) return 0;
  return /[0-9a-fA-F]/.test(key);
}

export function pad_to(data, align, char = 0x00)
{
  const mod = data.length % align;
  for(let i = 0; i < mod; i++)
  {
    data.push(char);
  }
  return data;
}

export function compress_buffer(input, type = 'gzip')
{
  return new Response(
          new Response(input)
            .body
            .pipeThrough(
              new CompressionStream(type)
            )
          ).arrayBuffer();
}
