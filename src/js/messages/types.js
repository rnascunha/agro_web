
export const message_types = {
  USER: 'user',
  DEVICE: 'device',
  REPORT: 'report',
  IMAGE: 'image',
  APP: 'app'
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
  DELETE_GROUP: 'delete_group'
}
Object.freeze(user_commands);

export const device_commands = {
  LIST: 'list',
  DATA: 'data',
  TREE: 'tree',
  EDIT: 'edit',
  REQUEST: 'request'
}

export const image_commands = {
  LIST: 'list',
  DELETE: 'delete',
  EDIT: 'edit',
}

export const app_commands = {
  LIST: 'list',
  DELETE: 'delete',
  EDIT: 'edit'
}

export const report_commands = {
  LIST: 'list',
  DEVICE: 'device',
  IMAGE: 'image',
  APP: 'app'
}

export const report_types = {
  error: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info'
}
