export const TABLE_DEFINITIONS = {
  track_stats: {
    label: 'Track Stats',
    primaryKey: 'id',
    searchableColumns: ['id'],
    columns: ['id', 'plays', 'likes', 'dislikes', 'last_played_at'],
    exportable: true,
    editable: true,
  },
  analytics_logs: {
    label: 'Analytics Logs',
    primaryKey: 'id',
    searchableColumns: ['event_type', 'item_id', 'country', 'city', 'region', 'device_type', 'browser', 'os', 'referrer'],
    columns: ['id', 'event_type', 'item_id', 'session_id', 'country', 'city', 'region', 'device_type', 'browser', 'os', 'referrer', 'created_at'],
    exportable: true,
    editable: false,
  },
  bookings: {
    label: 'Bookings',
    primaryKey: 'id',
    searchableColumns: ['name', 'email', 'event', 'message'],
    columns: ['id', 'name', 'email', 'event', 'message', 'created_at'],
    exportable: true,
    editable: false,
  },
  subscribers: {
    label: 'Subscribers',
    primaryKey: 'id',
    searchableColumns: ['email', 'status'],
    columns: ['id', 'email', 'status', 'created_at'],
    exportable: true,
    editable: true,
  },
  users: {
    label: 'VIP Users',
    primaryKey: 'id',
    searchableColumns: ['username', 'email'],
    columns: ['id', 'username', 'email', 'created_at'],
    exportable: true,
    editable: false,
  },
  sessions: {
    label: 'Sessions',
    primaryKey: 'id',
    searchableColumns: ['id', 'username', 'email'],
    columns: ['id', 'user_id', 'username', 'email', 'created_at', 'expires_at'],
    exportable: true,
    editable: false,
  },
};

export const TABLE_NAMES = Object.keys(TABLE_DEFINITIONS);
