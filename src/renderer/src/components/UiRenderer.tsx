import React, { useState } from 'react';
import { UiDescriptor, AppEvent } from '../../../shared/types';

interface Props {
  descriptor: UiDescriptor;
  onAction: (event: AppEvent) => void;
  pluginResponse: AppEvent | null;
}

/**
 * Automatically renders a standard form based solely on a JSON Descriptor.
 * Ensures an identical design system across all plugins without manual JSX writing.
 */
export const UiRenderer: React.FC<Props> = ({ descriptor, onAction, pluginResponse }) => {
  // Local state maintaining form field values
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFieldChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{descriptor.title}</h2>
      <p style={styles.desc}>{descriptor.description}</p>
      
      <div style={styles.form}>
        {descriptor.fields.map((field) => (
          <div key={field.id} style={styles.fieldGroup}>
            <label style={styles.label}>{field.label}</label>
            <input
              type={field.type}
              required={field.required}
              style={styles.input}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        ))}

        <div style={styles.actions}>
          {descriptor.actions.map((action) => (
            <button
              key={action.id}
              style={styles.button}
              onClick={() => {
                // Publish action to the central EventBus
                onAction({
                  type: action.eventType,
                  payload: formData,
                  source: 'renderer',
                  timestamp: Date.now(),
                });
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render incoming response purely as a demonstration that IPC works */}
      {pluginResponse && (
        <div style={styles.responseBox}>
          <strong>Response from Plugin:</strong>
          <pre style={styles.pre}>{JSON.stringify(pluginResponse.payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Inline styles for quick functional UI setup
const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#0f3460',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    maxWidth: '500px',
    margin: '20px auto',
  },
  title: { margin: '0 0 10px 0', fontSize: '1.5rem', color: '#e94560' },
  desc: { margin: '0 0 20px 0', fontSize: '0.9rem', color: '#a0a0a0' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#e0e0e0' },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #16213e',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    outline: 'none',
  },
  actions: { display: 'flex', gap: '12px', marginTop: '10px' },
  button: {
    padding: '10px 16px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  responseBox: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderLeft: '4px solid #e94560',
    borderRadius: '4px',
  },
  pre: { margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }
};
