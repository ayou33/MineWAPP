export enum TipType {
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
}

export enum TipPosition {
  TOP,
  CENTER,
  BOTTOM,
}

export enum USER_ROLE {
  PASSENGER,
  GUEST,
  USER,
  AUTHED,
  ADMIN,
}

export enum AUTH_SCOPE {
  PUBLIC = USER_ROLE.PASSENGER,
  TRIAL = USER_ROLE.GUEST,
  PRIVATE = USER_ROLE.USER,
  AUTHED = USER_ROLE.AUTHED,
  ADMIN = USER_ROLE.ADMIN,
}

export const SESSION_KEYS = {
  SYSTEM_NOTICE: '__session_system_notice_',
  DEACTIVATED_FROM: '__session_deactivated_from_',
}

export const LOCAL_SYS_KEYS = {
  FOOT_PRINT: 'foot_print',
}

export const LOCAL_USER_KEYS = {
  FLAG: 'flag',
  USER: 'user',
  LOCALE: 'locale',
}

export const EVENTS = {
  LOGIN: '_event_of_login_',
  LOGOUT: '_event_of_logout_',
  TOKEN_ERROR: '_event_of_token_error_',
  WAKEUP: '_event_of_wakeup_',
  CONSUME: '_event_of_consume_',
  BALANCE_CHANGED: '_event_of_balance_changed_',
}

export const AUTH_PATH = '/auth'
