/*
  File: frontend/src/components/DiffMinimap.jsx (NEW FILE)
  Description: A new component that renders a minimap of the diff,
  showing the location of changes and allowing for quick navigation.
*/
import React from 'react';

const DiffMinimap = ({ markers, onMarkerClick, totalLines }) => {
  if (totalLines === 0) return null;

  return (
    <div className="minimap-container">
      <div className="minimap-track">
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`minimap-marker ${marker.type === 'add' ? 'added' : 'removed'}`}
            style={{ top: `${(marker.lineNumber / totalLines) * 100}%` }}
            onClick={() => onMarkerClick(marker.element)}
            title={`Go to change at line ${marker.lineNumber}`}
            role="button"
            aria-label={`Go to change at line ${marker.lineNumber}`}
          />
        ))}
      </div>
    </div>
  );
};

export default DiffMinimap;