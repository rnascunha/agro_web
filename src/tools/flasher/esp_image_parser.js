import {hex_sha256, blob_to_hex, digest_support} from './utility.js';

const header_size = 24,
      header_segment_size = 8,
      description_size = 256;
const ESP_IMAGE_HEADER_MAGIC = 0xe9;

export const error_code = {
  NO_ERROR: 0,
  WRONG_MAGIC_WORD: 1,
  HASH_NOT_MATCH: 2,
  NOT_SUPPORTED: 3
};

/**
 * @brief ESP chip ID
 *
 */
// typedef enum {
//     ESP_CHIP_ID_ESP32 = 0x0000,  /*!< chip ID: ESP32 */                                                                /**< ESP_CHIP_ID_ESP32 */
//     ESP_CHIP_ID_ESP32S2 = 0x0002, /*!< chip ID: ESP32-S2 */                                                           /**< ESP_CHIP_ID_ESP32S2 */
//     ESP_CHIP_ID_ESP32S3 = 0x0004, /*!< chip ID: ESP32-S3 */                                                            /**< ESP_CHIP_ID_ESP32S3 */
//     ESP_CHIP_ID_ESP32C3 = 0x0005, /*!< chip ID: ESP32-C3 */                                                            /**< ESP_CHIP_ID_ESP32C3 */
//     ESP_CHIP_ID_INVALID = 0xFFFF /*!< Invalid chip ID (we defined it to make sure the esp_chip_id_t is 2 bytes size) *//**< ESP_CHIP_ID_INVALID */
// } __attribute__((packed)) esp_chip_id_t;

function chip_id(id)
{
  switch(id)
  {
    case 0x0000:
      return 'ESP32';
    case 0x0002:
      return 'ESP32-S2';
    case 0x0004:
    return 'ESP32-S3';
    case 0x0005:
      return 'ESP32-C3';
    case 0xFFFF:
      return 'invalid';
    default:
      return id;
  }
}

function read_c_string(string, char = '\x00')
{
  return string.substring(0, string.indexOf(char));
}

/**
 * @brief Main header of binary image
 */
// typedef struct {
//     0 uint8_t magic;              /*!< Magic word ESP_IMAGE_HEADER_MAGIC */
//     1 uint8_t segment_count;      /*!< Count of memory segments */
//     2 uint8_t spi_mode;           /*!< flash read mode (esp_image_spi_mode_t as uint8_t) */
//     3 uint8_t spi_speed: 4;       /*!< flash frequency (esp_image_spi_freq_t as uint8_t) */
//     4 uint8_t spi_size: 4;        /*!< flash chip size (esp_image_flash_size_t as uint8_t) */
//     5-8 uint32_t entry_addr;        /*!< Entry address */
//     9 uint8_t wp_pin;            /*!< WP pin when SPI pins set via efuse (read by ROM bootloader,
//                                 * the IDF bootloader uses software to configure the WP
//                                 * pin and sets this field to 0xEE=disabled) */
//     10 uint8_t spi_pin_drv[3];     /*!< Drive settings for the SPI flash pins (read by ROM bootloader) */
//     11-12 esp_chip_id_t chip_id;      /*!< Chip identification number */
//     13 uint8_t min_chip_rev;       /*!< Minimum chip revision supported by image */
//     14-22 uint8_t reserved[8];       /*!< Reserved bytes in additional header space, currently unused */
//     23 uint8_t hash_appended;      /*!< If 1, a SHA256 digest "simple hash" (of the entire image) is appended after the checksum.
//                                  * Included in image length. This digest
//                                  * is separate to secure boot and only used for detecting corruption.
//                                  * For secure boot signed images, the signature
//                                  * is appended after this (and the simple hash is included in the signed data). */
// } __attribute__((packed))  esp_image_header_t;
function parse_header(header)
{
  return {
    magic: new Uint8Array(header, 0, 1)[0],
    entry_addr: new Uint32Array(header.slice(5, 10), 0, 1)[0],
    chid_id: chip_id(new Uint16Array(header.slice(13, 15), 0, 1)[0]),
    min_chip_rev: new Uint8Array(header, 15, 1)[0],
    hash_appended: new Uint8Array(header, 23, 1)[0]
  }
}

/**
 * @brief Header of binary image segment
 */
// typedef struct {
//     uint32_t load_addr;     /*!< Address of segment */
//     uint32_t data_len;      /*!< Length of data */
// } esp_image_segment_header_t;

function parse_header_segment(seg)
{
  const arr = new Uint32Array(seg);
  return {
    load_addr: arr[0],
    data_len: arr[1]
  }
}

/**
 * @brief Description about application.
 */
// typedef struct {
//     std::uint32_t magic_word;        /*!< Magic word ESP_APP_DESC_MAGIC_WORD */
//     std::uint32_t secure_version;    /*!< Secure version */
//     std::uint32_t reserv1[2];        /*!< reserv1 */
//     char version[32];           /*!< Application version */
//     char project_name[32];      /*!< Project name */
//     char time[16];              /*!< Compile time */
//     char date[16];              /*!< Compile date*/
//     char idf_ver[32];           /*!< Version IDF */
//     std::uint8_t app_elf_sha256[32]; /*!< sha256 of elf file */
//     std::uint32_t reserv2[20];       /*!< reserv2 */
// } esp_app_desc_t;

function parse_description(description)
{
  return {
    magic_word: new Uint32Array(description, 0, 1)[0],
    secure_version: new Uint32Array(description, 4, 1)[0],
    version: read_c_string(new TextDecoder().decode(new Uint8Array(description, 16, 32))),
    project_name: read_c_string(new TextDecoder().decode(new Uint8Array(description, 48, 32))),
    time: read_c_string(new TextDecoder().decode(new Uint8Array(description, 80, 16))),
    date: read_c_string(new TextDecoder().decode(new Uint8Array(description, 96, 16))),
    idf_ver: read_c_string(new TextDecoder().decode(new Uint8Array(description, 112, 32))),
    app_elf_sha256: blob_to_hex(description.slice(144, 176))
  }
}

export function esp_image_parse(image_blob)
{
  const mw = new Uint8Array(image_blob, 0, 1)[0];
  if(mw != ESP_IMAGE_HEADER_MAGIC)
  {
    return {
      error: true,
      error_code: error_code.WRONG_MAGIC_WORD,
      error_message: `Image header magic word doesn't match ['${mw.toString(16).padStart(2, '0')}' != '${ESP_IMAGE_HEADER_MAGIC.toString(16).padStart(2, '0')}']`
    }
  }

  const header = image_blob.slice(0, header_size),
        header_segment = image_blob.slice(header_size, header_size + header_segment_size),
        description = image_blob.slice(header_size + header_segment_size, header_size + header_segment_size + description_size);

  return {
    error: false,
    error_code: error_code.NO_ERROR,
    error_message: '',
    header: parse_header(header),
    header_segment: parse_header_segment(header_segment),
    description: parse_description(description)
  }
}

export function esp_hash(image)
{
  if(digest_support())
  {
    const image_hash = image.slice(-32),
          image_file = image.slice(0, -32);

    return Promise.all([hex_sha256(image), hex_sha256(image_file), blob_to_hex(image_hash)])
      // .then(values => Promise.resolve({then: {
      //     error: false,
      //     error_code: error_code.NO_ERROR,
      //     error_message: '',
      //     hash: {
      //       file: values[0],
      //       image: values[1],
      //       calculated: values[2]
      //     }
      //   }}));
  }
  else
  {
    return Promise.resolve({
      then: function(resolve){
          resolve({
            error: true,
            error_code: error_code.NOT_SUPPORTED,
            error_message: 'Crypto API not supported',
          });
        }
      });
  }
}
