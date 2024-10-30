'use client'
import React, { useState } from 'react';

const Page = () => {
  const [activeView, setActiveView] = useState(''); // Estado para manejar la vista activa
  const views = {
    view1: 'Contenido de la Vista 1',
    view2: 'Contenido de la Vista 2',
    view3: 'Contenido de la Vista 3',
  };

  return (
    
    <div style={styles.container}>
      
      <div style={styles.header}>
        {Object.keys(views).map((view, index) => (
          <button
            key={view}
            style={styles.button}
            onClick={() => setActiveView(view)}
          >
            Botón {index + 1}
          </button>
        ))}
      </div>
      <div style={styles.contentContainer}>
        <div style={styles.content}>
          {views[activeView] || 'Selecciona una vista'}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    height: '60px',
    backgroundColor: '#6200ee',
  },
  button: {
    flex: 1,
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
  contentContainer: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#ffffff',
  },
};

export default Page;
