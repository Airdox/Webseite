const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flightDeckApi', {
  isElectron: true,
  getState: () => ipcRenderer.invoke('flightdeck:get-state'),
  getSettings: () => ipcRenderer.invoke('flightdeck:get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('flightdeck:save-settings', patch),
  getManniCampaignState: (payload) => ipcRenderer.invoke('flightdeck:get-manni-campaign-state', payload),
  updateManniOperationApproval: (payload) => ipcRenderer.invoke('flightdeck:update-manni-operation-approval', payload),
  createMarketingDraftRequest: (payload) => ipcRenderer.invoke('flightdeck:create-marketing-draft-request', payload),
  selectWorkspace: () => ipcRenderer.invoke('flightdeck:select-workspace'),
  pickImportFiles: () => ipcRenderer.invoke('flightdeck:pick-import-files'),
  getAudioMasteringProfiles: () => ipcRenderer.invoke('flightdeck:get-audio-mastering-profiles'),
  getAudioOutputFormats: () => ipcRenderer.invoke('flightdeck:get-audio-output-formats'),
  pickAudioMasteringFile: () => ipcRenderer.invoke('flightdeck:pick-audio-mastering-file'),
  pickAudioMasteringOutputDirectory: () => ipcRenderer.invoke('flightdeck:pick-audio-mastering-output-directory'),
  analyzeAudio: (payload) => ipcRenderer.invoke('flightdeck:analyze-audio', payload),
  masterAudio: (payload) => ipcRenderer.invoke('flightdeck:master-audio', payload),
  cancelAudioMastering: (payload) => ipcRenderer.invoke('flightdeck:cancel-audio-mastering', payload),
  onAudioMasteringProgress: (callback) => {
    const listener = (_event, update) => callback(update);
    ipcRenderer.on('flightdeck:audio-mastering-progress', listener);
    return () => ipcRenderer.removeListener('flightdeck:audio-mastering-progress', listener);
  },
  prepareImport: (payload) => ipcRenderer.invoke('flightdeck:prepare-import', payload),
  publishSet: (payload) => ipcRenderer.invoke('flightdeck:publish-set', payload),
  listTable: (payload) => ipcRenderer.invoke('flightdeck:list-table', payload),
  updateTrackStats: (payload) => ipcRenderer.invoke('flightdeck:update-track-stats', payload),
  updateSubscriber: (payload) => ipcRenderer.invoke('flightdeck:update-subscriber', payload),
  deleteRecords: (payload) => ipcRenderer.invoke('flightdeck:delete-records', payload),
  createUser: (payload) => ipcRenderer.invoke('flightdeck:create-user', payload),
  resetUserPassword: (payload) => ipcRenderer.invoke('flightdeck:reset-user-password', payload),
  revokeSession: (payload) => ipcRenderer.invoke('flightdeck:revoke-session', payload),
  runReadonlyQuery: (payload) => ipcRenderer.invoke('flightdeck:run-readonly-query', payload),
  syncTrackStats: (payload) => ipcRenderer.invoke('flightdeck:sync-track-stats', payload),
  exportRecords: (payload) => ipcRenderer.invoke('flightdeck:export-records', payload),
  revealPath: (payload) => ipcRenderer.invoke('flightdeck:reveal-path', payload),
  openDesignStudio: () => ipcRenderer.invoke('flightdeck:open-design-studio'),
  // New admin API handlers
  getAnalyticsData: (payload) => ipcRenderer.invoke('flightdeck:get-analytics-data', payload),
  exportAnalyticsReport: (payload) => ipcRenderer.invoke('flightdeck:export-analytics-report', payload),
  getSystemStats: (payload) => ipcRenderer.invoke('flightdeck:get-system-stats', payload),
  clearCache: (payload) => ipcRenderer.invoke('flightdeck:clear-cache', payload),
  optimizeSystem: (payload) => ipcRenderer.invoke('flightdeck:optimize-system', payload),
  askAssistant: (payload) => ipcRenderer.invoke('flightdeck:assistant-ask', payload),
  // Design Agent Integration
  renderDesign: (payload) => ipcRenderer.invoke('flightdeck:render-design', payload),
  getDesignPreview: (payload) => ipcRenderer.invoke('flightdeck:get-design-preview', payload),
  onDesignLog: (callback) => {
    const listener = (_event, log) => callback(log);
    ipcRenderer.on('flightdeck:design-log', listener);
    return () => ipcRenderer.removeListener('flightdeck:design-log', listener);
  }
});
