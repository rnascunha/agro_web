
export function digest_support()
{
  return 'crypto' in window;
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

export function mac_to_string(mac)
{
  return `${to_hex(mac[0], 2)}:${to_hex(mac[1], 2)}:${to_hex(mac[2], 2)}:${to_hex(mac[3], 2)}:${to_hex(mac[4], 2)}:${to_hex(mac[5], 2)}`;
}
