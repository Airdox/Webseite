import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('flightDeckApi', {
  isElectron: true,
  getState: () => ipcRenderer.invoke('flightdeck:get-state'),
  getSettings: () => ipcRenderer.invoke('flightdeck:get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('flightdeck:save-settings', patch),
  selectWorkspace: () => ipcRenderer.invoke('flightdeck:select-workspace'),
  pickImportFiles: () => ipcRenderer.invoke('flightdeck:pick-import-files'),
  prepareImport: (payload) => ipcRenderer.invoke('flightdeck:prepare-import', payload),
  publishSet: (payload) => ipcRenderer.invoke('flightdeck:publish-set', payload),
  listTable: (payload) => ipcRenderer.invoke('flightdeck:list-table', payload),
  updateTrackStats: (payload) => ipcRenderer.invoke('flightdeck:update-track-stats', payload),
  updateSubscriber: (payload) => ipcRenderer.invoke('flightdeck:update-subscriber', payload),
  deleteRecords: (payload) => ipcRenderer.invoke('flightdeck:delete-records', payload),
  createVipUser: (payload) => ipcRenderer.invoke('flightdeck:create-vip-user', payload),
  resetVipPassword: (payload) => ipcRenderer.invoke('flightdeck:reset-vip-password', payload),
  revokeSession: (payload) => ipcRenderer.invoke('flightdeck:revoke-session', payload),
  runReadonlyQuery: (payload) => ipcRenderer.invoke('flightdeck:run-readonly-query', payload),
  syncTrackStats: (payload) => ipcRenderer.invoke('flightdeck:sync-track-stats', payload),
  exportRecords: (payload) => ipcRenderer.invoke('flightdeck:export-records', payload),
  revealPath: (payload) => ipcRenderer.invoke('flightdeck:reveal-path', payload),
});
