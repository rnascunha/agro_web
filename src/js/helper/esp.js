
export const esp_reset_reason = {
		0: {value: 0, string: 'not determined', short_string: 'ESP_RST_UNKNOWN'},
		1: {value: 1, string: 'power-on event', short_string: 'ESP_RST_POWERON'},
		2: {value: 2, string: 'external pin', short_string: 'ESP_RST_EXT' },
		3: {value: 3, string: 'software reset', short_string: 'ESP_RST_SW' },
    4: {value: 4, string: 'exception/panic', short_string: 'ESP_RST_PANIC' },
    5: {value: 5, string: 'interrupt watchdog', short_string: 'ESP_RST_INT_WDT' },
    6: {value: 6, string: 'task watchdog', short_string: 'ESP_RST_TASK_WDT' },
    7: {value: 7, string: 'other watchdogs', short_string: 'ESP_RST_WDT' },
    8: {value: 8, string: 'exiting deep sleep', short_string: 'ESP_RST_DEEPSLEEP' },
    9: {value: 9, string: 'brownout', short_string: 'ESP_RST_BROWNOUT' },
    10: {value: 10, string: 'over SDIO', short_string: 'ESP_RST_BROWNOUT' },
}
Object.freeze(esp_reset_reason)

export function esp_reset_reason_string(reset_reason)
{
  if(reset_reason in esp_reset_reason)
    return esp_reset_reason[reset_reason].string;

  return 'not recognized';
}
