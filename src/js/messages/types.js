
export const message_types = {
  USER: 'user',
  DEVICE: 'device',
  REPORT: 'report',
  IMAGE: 'image',
  APP: 'app',
  SENSOR: 'sensor',
  NOTIFY: 'notify'
}
Object.freeze(message_types);

export const user_commands = {
  USER_GROUP_POLICIES: 'user_group_policies',
  NOTIFY_KEY: 'notify_key',
  LOGOUT: 'logout',
  ADD_USER: 'add_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  ADD_GROUP: 'add_group',
  DELETE_GROUP: 'delete_group',
  PUSH_SUBSCRIBE: 'push_subscribe',
  PUSH_UNSUBSCRIBE: 'push_unsubscribe'
}
Object.freeze(user_commands);

export const device_commands = {
  LIST: 'list',
  DATA: 'data',
  TREE: 'tree',
  EDIT: 'edit',
  REQUEST: 'request',
  CUSTOM_RESPONSE: 'custom_response',
}
Object.freeze(device_commands);

export const sensor_commands = {
  LIST: 'list',
  ADD: 'add',
  EDIT: 'edit',
  REMOVE: 'remove',
  EXPORT: 'export'
}
Object.freeze(sensor_commands);

export const image_commands = {
  LIST: 'list',
  DELETE: 'delete',
  EDIT: 'edit',
  DOWNLOAD: 'download'
}

export const app_commands = {
  LIST: 'list',
  DELETE: 'delete',
  EDIT: 'edit',
  DOWNLOAD: 'download'
}

export const report_commands = {
  LIST: 'list',
  DEVICE: 'device',
  IMAGE: 'image',
  APP: 'app',
  NOTIFY: 'notify'
}

export const report_types = {
  error: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info'
}

export const sensor_unit_type = {
  0: {value: 0, name: 'integer', title: 'Integer'},
  1: {value: 1, name: 'unsigned', title: 'Unsigned'},
  2: {value: 2, name: 'float', title: 'Float'},
  // 3: {value: 3, name: 'array', title: 'Array'}
}

export const notify_commands = {
  GENERAL_LIST: 'general_list',
  GENERAL_SET: 'general_set',
  DEVICE_LIST: 'device_list',
  DEVICE_SET: 'device_set',
  SENSOR_LIST: 'sensor_list',
  SENSOR_SET: 'sensor_set',
  CREDENTIAL_LIST: 'credential_list',
  UPDATE_CREDENTIAL: 'update_credential',
}
