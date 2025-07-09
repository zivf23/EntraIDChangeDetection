/*
  File: frontend/src/components/JsonDiffViewer.jsx
  Description: MAJOR REWRITE. Now uses MutationObserver for reliable change detection.
*/
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import DiffMinimap from './DiffMinimap';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

const JsonDiffViewer = ({ previousData, currentData }) => {
  const previousString = useMemo(() => JSON.stringify(previousData, null, 2) || '{}', [previousData]);
  const currentString = useMemo(() => JSON.stringify(currentData, null, 2) || '{}', [currentData]);

  const [changeElements, setChangeElements] = useState([]);
  const [minimapMarkers, setMinimapMarkers] = useState([]);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);
  const diffContainerRef = useRef(null);

  // --- FIX: Using MutationObserver to reliably detect when the diff is rendered ---
  useEffect(() => {
    const container = diffContainerRef.current;
    if (!container) return;

    // This function scans the DOM for changes.
    const scanForChanges = () => {
      const addedLines = Array.from(container.querySelectorAll('td.line-diff-add'));
      const removedLines = Array.from(container.querySelectorAll('td.line-diff-remove'));
      
      const allChangeRows = [...addedLines, ...removedLines]
        .map(td => td.closest('tr'))
        .filter((tr, index, self) => tr && self.indexOf(tr) === index);

      allChangeRows.sort((a, b) => a.offsetTop - b.offsetTop);

      // Only update state if the found changes are different from what we already have
      if (allChangeRows.length !== changeElements.length) {
        setChangeElements(allChangeRows);

        const totalLines = Math.max(previousString.split('\n').length, currentString.split('\n').length);
        const markers = allChangeRows.map(row => {
          const lineNumberEl = row.querySelector('.line-number');
          const lineNumber = lineNumberEl ? parseInt(lineNumberEl.innerText, 10) : 0;
          const isAdded = row.querySelector('.line-diff-add') !== null;
          
          return { lineNumber, type: isAdded ? 'add' : 'remove', element: row };
        });
        
        setMinimapMarkers(markers);
        setCurrentChangeIndex(-1);
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(scanForChanges);

    // Start observing the target node for configured mutations
    observer.observe(container, { childList: true, subtree: true });

    // Initial scan in case the content is already there
    scanForChanges();

    // Cleanup function to stop observing when the component unmounts
    return () => observer.disconnect();

  }, [previousString, currentString, changeElements.length]); // Re-run if data changes

  // Navigation logic (no changes needed here)
  const navigateToChange = useCallback((direction) => {
    if (changeElements.length === 0) return;
    const newIndex = currentChangeIndex + direction;
    if (newIndex >= 0 && newIndex < changeElements.length) {
      setCurrentChangeIndex(newIndex);
      changeElements[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [changeElements, currentChangeIndex]);

  const handleMarkerClick = useCallback((element) => {
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const index = changeElements.findIndex(el => el === element);
    if (index !== -1) setCurrentChangeIndex(index);
  }, [changeElements]);

  const hasChanges = changeElements.length > 0;
  const totalLines = Math.max(previousString.split('\n').length, currentString.split('\n').length);

  return (
    <div className="json-diff-viewer-container">
      {/* Navigation Controls */}
      <div className="diff-nav-controls">
        <span className="diff-nav-status">
          {hasChanges ? `שינוי ${currentChangeIndex > -1 ? currentChangeIndex + 1 : '1'} מתוך ${changeElements.length}` : 'לא נמצאו שינויים'}
        </span>
        <div className="flex-grow"></div>
        <button onClick={() => navigateToChange(-1)} disabled={!hasChanges || currentChangeIndex <= 0} className="btn-icon" aria-label="Previous change">
          <ArrowUpIcon />
        </button>
        <button onClick={() => navigateToChange(1)} disabled={!hasChanges || currentChangeIndex >= changeElements.length - 1} className="btn-icon" aria-label="Next change">
          <ArrowDownIcon />
        </button>
      </div>

      {/* Main content area with Diff and Minimap */}
      <div className="diff-content-area">
        <div ref={diffContainerRef} className="diff-viewer-wrapper" tabIndex={-1}>
          <ReactDiffViewer
            oldValue={previousString}
            newValue={currentString}
            splitView={true}
            useDarkTheme={true}
            showDiffOnly={false}
            extraLinesSurroundingDiff={3}
            styles={{
              variables: { dark: { color: '#F1F5F9', background: '#0F172A', addedBackground: '#15323C', addedColor: '#6EE7B7', removedBackground: '#451A2B', removedColor: '#FDA4AF', wordAddedBackground: '#216353', wordRemovedBackground: '#772C49' }},
              diffContainer: { backgroundColor: '#0F172A' },
              gutter: { backgroundColor: '#1E293B', '&:hover': { background: '#334155' } },
              line: { '&:hover': { background: '#1E293B' } },
            }}
          />
        </div>
        <DiffMinimap 
          markers={minimapMarkers}
          onMarkerClick={handleMarkerClick}
          totalLines={totalLines}
        />
      </div>
    </div>
  );
};

export default JsonDiffViewer;