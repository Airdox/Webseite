import React, { useState } from 'react';
import { Download, KeyRound, RotateCcw, Search, Trash2 } from 'lucide-react';
import { TABLE_DEFINITIONS, TABLE_NAMES } from '../lib/tableDefinitions.js';

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return 'n/a';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const TableToolbar = ({ tableName, setTableName, search, setSearch, onExportJson, onExportCsv, onRefresh }) => (
  <section className="fd-toolbar-band">
    <div className="fd-field-group compact">
      <label htmlFor="fd-table-select">Tabelle</label>
      <select id="fd-table-select" value={tableName} onChange={(event) => setTableName(event.target.value)}>
        {TABLE_NAMES.map((name) => (
          <option key={name} value={name}>{TABLE_DEFINITIONS[name].label}</option>
        ))}
      </select>
    </div>
    <div className="fd-search-box">
      <Search size={16} />
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtern..." />
    </div>
    <div className="fd-toolbar-actions">
      <button type="button" className="fd-button secondary" onClick={onExportCsv}>
        <Download size={16} />
        CSV
      </button>
      <button type="button" className="fd-button secondary" onClick={onExportJson}>
        <Download size={16} />
        JSON
      </button>
      <button type="button" className="fd-button" onClick={onRefresh}>
        <RotateCcw size={16} />
        Refresh
      </button>
    </div>
  </section>
);

const TrackStatsEditor = ({ rows, onSave, onDelete }) => (
  <div className="fd-record-stack">
    {rows.map((row) => (
      <form
        className="fd-record-card"
        key={row.id}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSave({
            id: row.id,
            plays: formData.get('plays'),
            likes: formData.get('likes'),
            dislikes: formData.get('dislikes'),
            last_played_at: formData.get('last_played_at'),
          });
        }}
      >
        <div className="fd-record-head">
          <strong>{row.id}</strong>
          <button type="button" className="fd-icon-button danger" onClick={() => onDelete(row.id)} aria-label={`Delete ${row.id}`}>
            <Trash2 size={16} />
          </button>
        </div>
        <div className="fd-inline-form">
          <label>Plays<input name="plays" type="number" defaultValue={row.plays} /></label>
          <label>Likes<input name="likes" type="number" defaultValue={row.likes} /></label>
          <label>Dislikes<input name="dislikes" type="number" defaultValue={row.dislikes} /></label>
          <label>Last Played<input name="last_played_at" type="datetime-local" defaultValue={row.last_played_at ? String(row.last_played_at).slice(0, 16) : ''} /></label>
        </div>
        <button type="submit" className="fd-button">Save Row</button>
      </form>
    ))}
  </div>
);

const SubscriberEditor = ({ rows, onSave, onDelete }) => (
  <div className="fd-record-stack">
    {rows.map((row) => (
      <form
        className="fd-record-card"
        key={row.id}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSave({
            id: row.id,
            email: formData.get('email'),
            status: formData.get('status'),
          });
        }}
      >
        <div className="fd-record-head">
          <strong>{row.email}</strong>
          <button type="button" className="fd-icon-button danger" onClick={() => onDelete(row.id)} aria-label={`Delete ${row.email}`}>
            <Trash2 size={16} />
          </button>
        </div>
        <div className="fd-inline-form">
          <label>Email<input name="email" defaultValue={row.email} /></label>
          <label>Status
            <select name="status" defaultValue={row.status}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="unsubscribed">unsubscribed</option>
            </select>
          </label>
        </div>
        <button type="submit" className="fd-button">Save Subscriber</button>
      </form>
    ))}
  </div>
);

const UserAdmin = ({ rows, onCreate, onDelete, onResetPassword }) => {
  const [createState, setCreateState] = useState({ username: '', email: '', password: '' });
  const [resetState, setResetState] = useState({});

  return (
    <div className="fd-panel-stack">
      <form
        className="fd-surface"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(createState);
          setCreateState({ username: '', email: '', password: '' });
        }}
      >
        <div className="fd-section-head">
          <h3>VIP User anlegen</h3>
          <span>Admin Action</span>
        </div>
        <div className="fd-inline-form">
          <label>Username<input value={createState.username} onChange={(event) => setCreateState((prev) => ({ ...prev, username: event.target.value }))} required /></label>
          <label>Email<input type="email" value={createState.email} onChange={(event) => setCreateState((prev) => ({ ...prev, email: event.target.value }))} required /></label>
          <label>Password<input type="password" value={createState.password} onChange={(event) => setCreateState((prev) => ({ ...prev, password: event.target.value }))} required /></label>
        </div>
        <button type="submit" className="fd-button">Create User</button>
      </form>

      <div className="fd-record-stack">
        {rows.map((row) => (
          <section className="fd-record-card" key={row.id}>
            <div className="fd-record-head">
              <strong>{row.username}</strong>
              <button type="button" className="fd-icon-button danger" onClick={() => onDelete(row.id)} aria-label={`Delete ${row.username}`}>
                <Trash2 size={16} />
              </button>
            </div>
            <p>{row.email}</p>
            <div className="fd-inline-form">
              <label>Neues Passwort
                <input
                  type="password"
                  value={resetState[row.id] || ''}
                  onChange={(event) => setResetState((prev) => ({ ...prev, [row.id]: event.target.value }))}
                  placeholder="********"
                />
              </label>
              <button
                type="button"
                className="fd-button secondary"
                onClick={() => {
                  onResetPassword({ userId: row.id, password: resetState[row.id] });
                  setResetState((prev) => ({ ...prev, [row.id]: '' }));
                }}
                disabled={!resetState[row.id]}
              >
                <KeyRound size={16} />
                Reset
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const SessionsAdmin = ({ rows, onRevoke }) => (
  <div className="fd-record-stack">
    {rows.map((row) => (
      <section className="fd-record-card" key={row.id}>
        <div className="fd-record-head">
          <strong>{row.username}</strong>
          <button type="button" className="fd-icon-button danger" onClick={() => onRevoke(row.id)} aria-label={`Revoke ${row.id}`}>
            <Trash2 size={16} />
          </button>
        </div>
        <p>{row.email}</p>
        <small>{formatCell(row.created_at)} -> {formatCell(row.expires_at)}</small>
      </section>
    ))}
  </div>
);

const GenericTable = ({ definition, rows, onDelete }) => (
  <div className="fd-data-grid">
    <div className="fd-table-head" style={{ gridTemplateColumns: `repeat(${definition.columns.length + (onDelete ? 1 : 0)}, minmax(0, 1fr))` }}>
      {definition.columns.map((column) => <span key={column}>{column}</span>)}
      {onDelete && <span>Action</span>}
    </div>
    {rows.map((row) => (
      <div className="fd-table-row" key={row[definition.primaryKey]} style={{ gridTemplateColumns: `repeat(${definition.columns.length + (onDelete ? 1 : 0)}, minmax(0, 1fr))` }}>
        {definition.columns.map((column) => (
          <span key={column} className={column.includes('id') ? 'fd-code-cell' : ''}>{formatCell(row[column])}</span>
        ))}
        {onDelete && (
          <button type="button" className="fd-icon-button danger" onClick={() => onDelete(row[definition.primaryKey])} aria-label={`Delete ${row[definition.primaryKey]}`}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    ))}
  </div>
);

const DataExplorerTab = ({
  tableName,
  setTableName,
  search,
  setSearch,
  rows,
  filteredRows,
  queryText,
  setQueryText,
  queryResult,
  onRefresh,
  onExportJson,
  onExportCsv,
  onSaveTrackStats,
  onSaveSubscriber,
  onDeleteRow,
  onCreateVipUser,
  onResetVipPassword,
  onRevokeSession,
  onRunQuery,
}) => {
  const definition = TABLE_DEFINITIONS[tableName];

  return (
    <div className="fd-panel-stack">
      <TableToolbar
        tableName={tableName}
        setTableName={setTableName}
        search={search}
        setSearch={setSearch}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        onRefresh={onRefresh}
      />

      {tableName === 'track_stats' && (
        <TrackStatsEditor rows={filteredRows} onSave={onSaveTrackStats} onDelete={onDeleteRow} />
      )}

      {tableName === 'subscribers' && (
        <SubscriberEditor rows={filteredRows} onSave={onSaveSubscriber} onDelete={onDeleteRow} />
      )}

      {tableName === 'users' && (
        <UserAdmin rows={filteredRows} onCreate={onCreateVipUser} onDelete={onDeleteRow} onResetPassword={onResetVipPassword} />
      )}

      {tableName === 'sessions' && (
        <SessionsAdmin rows={filteredRows} onRevoke={onRevokeSession} />
      )}

      {tableName !== 'track_stats' && tableName !== 'subscribers' && tableName !== 'users' && tableName !== 'sessions' && (
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>{definition.label}</h3>
            <span>{rows.length} Rows</span>
          </div>
          <GenericTable definition={definition} rows={filteredRows} onDelete={tableName === 'bookings' ? onDeleteRow : null} />
        </section>
      )}

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Read-only SQL</h3>
          <span>SELECT / WITH / EXPLAIN</span>
        </div>
        <textarea
          className="fd-sql-editor"
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          spellCheck={false}
        />
        <div className="fd-toolbar-actions">
          <button type="button" className="fd-button" onClick={onRunQuery}>Run Query</button>
        </div>
        {queryResult && (
          <div className="fd-query-result">
            <strong>{queryResult.rowCount} rows</strong>
            <pre>{JSON.stringify(queryResult.rows, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  );
};

export default DataExplorerTab;
