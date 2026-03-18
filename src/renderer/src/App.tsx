import React, { useEffect, useState } from 'react';
import { useIpc } from './hooks/useIpc';
import { UiDescriptor, AppEvent } from '../../shared/types';
import { Events } from '../../shared/events';
import { UiRenderer } from './components/UiRenderer';

import { Login } from './components/Login';
import { Register } from './components/Register';

const App: React.FC = () => {
  const { lastEvent, publish } = useIpc();
  // Navigation State Value
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return sessionStorage.getItem('teif_session') ? 'hello' : 'login';
  });
  const [descriptors, setDescriptors] = useState<UiDescriptor[]>([]);
  // Correlated plugin responses (for simplistic mapping)
  const [pluginResponses, setPluginResponses] = useState<Record<string, AppEvent>>({});

  useEffect(() => {
    // Notify Main process that React is ready
    publish({
      type: Events.UI_READY,
      payload: {},
      timestamp: Date.now(),
      source: 'renderer'
    });
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === Events.UI_DESCRIPTOR_REGISTERED) {
      const descriptor = lastEvent.payload.descriptor as UiDescriptor;
      setDescriptors((prev) => {
        // Prevent duplicate descriptors
        if (prev.find((d) => d.pluginId === descriptor.pluginId)) return prev;
        return [...prev, descriptor];
      });
    }

    // Explicitly listening for the hello world response to update the UI
    if (lastEvent.type === Events.HELLO_WORLD_RESPONSE) {
      setPluginResponses((prev) => ({
        ...prev,
        [lastEvent.source || 'unknown']: lastEvent,
      }));
    }
  }, [lastEvent]);

  // Dynamic router logic
  const renderPage = () => {
    if (currentPage === 'login') {
      return (
        <Login 
          publish={publish} 
          lastEvent={lastEvent}
          onRegisterClick={() => setCurrentPage('register')}
          onLoginSuccess={(id) => {
            sessionStorage.setItem('teif_session', id);
            setCurrentPage('hello');
          }}
        />
      );
    }

    if (currentPage === 'register') {
      return (
        <Register 
          publish={publish}
          lastEvent={lastEvent}
          onBack={() => setCurrentPage('login')}
        />
      );
    }

    if (currentPage === 'hello') {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          backgroundColor: '#0a0a1a', 
          color: '#e94560', 
          fontSize: '3rem', 
          fontWeight: 'bold',
          letterSpacing: '10px'
        }}>
          HELLO
        </div>
      );
    }

    // For backwards compatibility with the dynamic rendering (if ever revisited)
    if (currentPage === 'home') {
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ color: '#e94560' }}>TEIF Invoicing Backend</h1>
          <p>The stable Microkernel architecture is running.</p>
          {descriptors.length === 0 ? (
            <p>Loading Plugin UIs...</p>
          ) : (
            descriptors.map(desc => (
              <button 
                key={desc.pluginId}
                onClick={() => setCurrentPage(desc.pluginId)}
                style={{
                  padding: '10px 20px', backgroundColor: '#0f3460', color: 'white', 
                  border: 'none', borderRadius: '8px', cursor: 'pointer', margin: '5px'
                }}
              >
                Open {desc.title}
              </button>
            ))
          )}
        </div>
      );
    }

    // Dynamically render a plugin's UI
    const activeDescriptor = descriptors.find((d) => d.pluginId === currentPage);
    if (activeDescriptor) {
        return (
          <div>
            <button onClick={() => setCurrentPage('home')} style={{
              margin: '20px', padding: '8px 16px', background: 'transparent',
              color: '#a0a0a0', cursor: 'pointer', border: '1px solid #a0a0a0', borderRadius: '6px'
            }}>
              &larr; Back to Home
            </button>
            <UiRenderer
              descriptor={activeDescriptor}
              onAction={publish}
              pluginResponse={pluginResponses[activeDescriptor.pluginId] || null}
            />
          </div>
        );
    }

    return <div>Page Not Found</div>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a1a' }}>
      {renderPage()}
    </div>
  );
};

export default App;
