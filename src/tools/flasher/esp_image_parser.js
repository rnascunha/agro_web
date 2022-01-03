import {hex_sha256,
        blob_to_hex,
        digest_support,
        read_c_string} from './utility.js';

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
//     ESP_CHIP_ID_ESP32 = 0x0000,  /*!< chip ID: ESP32 */
//     ESP_CHIP_ID_ESP32S2 = 0x0002,  /*!< chip ID: ESP32-S2 */
//     ESP_CHIP_ID_ESP32C3 = 0x0005, /*!< chip ID: ESP32-C3 */
//     ESP_CHIP_ID_ESP32S3 = 0x0009, /*!< chip ID: ESP32-S3 */
//     ESP_CHIP_ID_ESP8684 = 0x000C, /*!< chip ID: ESP32-8684 */
// #if CONFIG_IDF_TARGET_ESP32H2_BETA_VERSION_2
//     ESP_CHIP_ID_ESP32H2 = 0x000E, /*!< chip ID: ESP32-H2 Beta2*/  // ESP32H2-TODO: IDF-3475
// #elif CONFIG_IDF_TARGET_ESP32H2_BETA_VERSION_1
//     ESP_CHIP_ID_ESP32H2 = 0x000A, /*!< chip ID: ESP32-H2 Beta1 */
// #endif
//     ESP_CHIP_ID_INVALID = 0xFFFF /*!< Invalid chip ID (we defined it to make sure the esp_chip_id_t is 2 bytes size) */
// } __attribute__((packed)) esp_chip_id_t;

const esp_chid_id = {
  0x0000: 'ESP32',
  0x0002: 'ESP32-S2',
  0x0005: 'ESP32-C3',
  0x0009: 'ESP32-S3',
  0x000C: 'ESP32-8684',
  0x000E: 'ESP32-H2 Beta2',
  0x000A: 'ESP32-H2 Beta1',
  0xFFFF: 'invalid',
}

/**
 * @brief SPI flash mode, used in esp_image_header_t
 */
// typedef enum {
//     ESP_IMAGE_SPI_MODE_QIO,         /*!< SPI mode QIO */
//     ESP_IMAGE_SPI_MODE_QOUT,        /*!< SPI mode QOUT */
//     ESP_IMAGE_SPI_MODE_DIO,         /*!< SPI mode DIO */
//     ESP_IMAGE_SPI_MODE_DOUT,        /*!< SPI mode DOUT */
//     ESP_IMAGE_SPI_MODE_FAST_READ,   /*!< SPI mode FAST_READ */
//     ESP_IMAGE_SPI_MODE_SLOW_READ    /*!< SPI mode SLOW_READ */
// } esp_image_spi_mode_t;
const spi_flash_mode = {
  0: 'QIO',
  1: 'QOUT',
  2: 'DIO',
  3: 'DOUT',
  4: 'FAST_READ',
  5: 'SLOW_READ',
};

/**
 * @brief SPI flash clock frequency
 */
// typedef enum {
//     ESP_IMAGE_SPI_SPEED_40M,        /*!< SPI clock frequency 40 MHz */
//     ESP_IMAGE_SPI_SPEED_26M,        /*!< SPI clock frequency 26 MHz */
//     ESP_IMAGE_SPI_SPEED_20M,        /*!< SPI clock frequency 20 MHz */
//     ESP_IMAGE_SPI_SPEED_80M = 0xF   /*!< SPI clock frequency 80 MHz */
// } esp_image_spi_freq_t;

const spi_image_frequency = {
  0: '40MHz',
  1: '26MHz',
  2: '20MHz',
  0xF: '80MHz'
}

/**
 * @brief Supported SPI flash sizes
 */
// typedef enum {
//     ESP_IMAGE_FLASH_SIZE_1MB = 0,   /*!< SPI flash size 1 MB */
//     ESP_IMAGE_FLASH_SIZE_2MB,       /*!< SPI flash size 2 MB */
//     ESP_IMAGE_FLASH_SIZE_4MB,       /*!< SPI flash size 4 MB */
//     ESP_IMAGE_FLASH_SIZE_8MB,       /*!< SPI flash size 8 MB */
//     ESP_IMAGE_FLASH_SIZE_16MB,      /*!< SPI flash size 16 MB */
//     ESP_IMAGE_FLASH_SIZE_MAX        /*!< SPI flash size MAX */
// } esp_image_flash_size_t;

const image_flash_size = {
  0: '1MB',
  1: '2MB',
  2: '4MB',
  3: '8MB',
  4: '16MB'
}

/**
 * @brief Main header of binary image
 */
// typedef struct {
//     0 uint8_t magic;              /*!< Magic word ESP_IMAGE_HEADER_MAGIC */
//     1 uint8_t segment_count;      /*!< Count of memory segments */
//     2 uint8_t spi_mode;           /*!< flash read mode (esp_image_spi_mode_t as uint8_t) */
//     3/2 uint8_t spi_speed: 4;       /*!< flash frequency (esp_image_spi_freq_t as uint8_t) */
//     3/2 uint8_t spi_size: 4;        /*!< flash chip size (esp_image_flash_size_t as uint8_t) */
//     4-7 uint32_t entry_addr;        /*!< Entry address */
//     8 uint8_t wp_pin;            /*!< WP pin when SPI pins set via efuse (read by ROM bootloader,
//                                 * the IDF bootloader uses software to configure the WP
//                                 * pin and sets this field to 0xEE=disabled) */
//     9-11 uint8_t spi_pin_drv[3];     /*!< Drive settings for the SPI flash pins (read by ROM bootloader) */
//     12-13 esp_chip_id_t chip_id;      /*!< Chip identification number */
//     14 uint8_t min_chip_rev;       /*!< Minimum chip revision supported by image */
//     15-22 uint8_t reserved[8];       /*!< Reserved bytes in additional header space, currently unused */
//     23 uint8_t hash_appended;      /*!< If 1, a SHA256 digest "simple hash" (of the entire image) is appended after the checksum.
//                                  * Included in image length. This digest
//                                  * is separate to secure boot and only used for detecting corruption.
//                                  * For secure boot signed images, the signature
//                                  * is appended after this (and the simple hash is included in the signed data). */
// } __attribute__((packed))  esp_image_header_t;
function parse_header(header)
{
  const view = new DataView(header),
        spi_mode = view.getUint8(2),
        spi_speed = view.getUint8(3) & 0xF,
        spi_size = ((view.getUint8(3) >> 4) & 0xF),
        chip_id = view.getUint16(12, true);

  return {
    magic: view.getUint8(0),
    segment_count: view.getUint8(1),
    spi_mode: {value: spi_mode, name: spi_mode in spi_flash_mode ? spi_flash_mode[spi_mode] : spi_mode},
    spi_speed: {value: spi_speed, name: spi_speed in spi_image_frequency ? spi_image_frequency[spi_speed] : spi_speed},
    spi_size: {value: spi_size, name: spi_size in image_flash_size ? image_flash_size[spi_size] : spi_size},
    entry_addr: view.getUint32(4, true),
    wp_pin: view.getUint8(8),
    spi_pin_drv: header.slice(9, 12),
    chip_id: {value: chip_id, name: chip_id in esp_chid_id ? esp_chid_id[chip_id] : chid_id},
    min_chip_rev: view.getUint8(14),
    hash_appended: view.getUint8(23)
  }
  // return {
  //   magic: new Uint8Array(header, 0, 1)[0],
  //   entry_addr: new Uint32Array(header.slice(5, 10), 0, 1)[0],
  //   chid_id: chip_id(new Uint16Array(header.slice(13, 15), 0, 1)[0]),
  //   min_chip_rev: new Uint8Array(header, 15, 1)[0],
  //   hash_appended: new Uint8Array(header, 23, 1)[0]
  // }
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
