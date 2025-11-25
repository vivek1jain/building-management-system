import { AlertCircle, CheckCircle, HelpCircle, Search, Smartphone, Tablet, Monitor, Maximize, Zap, Target, Type } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../UI';

interface Issue {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  elements: Array<{
    selector: string;
    html: string;
    path: string;
  }>;
  count: number;
}

interface UIDiagnosticsProps {
  onIssuesFound?: (issues: Issue[]) => void;
}

const UIDiagnostics: React.FC<UIDiagnosticsProps> = ({ onIssuesFound }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [showTouchTargets, setShowTouchTargets] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  const getElementPath = (element: Element): string => {
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c).slice(0, 2).join('.');
        if (classes) selector += `.${classes}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  };

  const runScan = () => {
    setIsScanning(true);
    setIssues([]);

    setTimeout(() => {
      const foundIssues: Issue[] = [];

      // 1. Buttons without labels
      const buttonsWithoutLabels = Array.from(document.querySelectorAll('button:not([aria-label]):not([title])'))
        .filter(btn => !btn.textContent?.trim());
      if (buttonsWithoutLabels.length > 0) {
        foundIssues.push({
          id: 'missing-button-labels',
          title: 'Buttons Without Labels',
          severity: 'high',
          description: 'Buttons must have text content, aria-label, or title for accessibility',
          count: buttonsWithoutLabels.length,
          elements: buttonsWithoutLabels.slice(0, 5).map((el, i) => ({
            selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 2. Form inputs without labels
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="tel"], input[type="url"]'));
      const inputsWithoutLabels = inputs.filter((input) => {
        const hasLabel = input.getAttribute('aria-label') || 
                        input.getAttribute('placeholder') || 
                        document.querySelector(`label[for="${input.id}"]`) ||
                        input.closest('label');
        return !hasLabel;
      });
      
      if (inputsWithoutLabels.length > 0) {
        foundIssues.push({
          id: 'inputs-no-labels',
          title: 'Form Inputs Without Labels',
          severity: 'high',
          description: 'All form inputs must have associated labels or aria-label',
          count: inputsWithoutLabels.length,
          elements: inputsWithoutLabels.slice(0, 5).map(el => ({
            selector: `input[type="${el.getAttribute('type')}"]`,
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 3. Images without alt text
      const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])'));
      if (imagesWithoutAlt.length > 0) {
        foundIssues.push({
          id: 'images-no-alt',
          title: 'Images Without Alt Text',
          severity: 'high',
          description: 'All images must have alt attributes for screen readers',
          count: imagesWithoutAlt.length,
          elements: imagesWithoutAlt.slice(0, 5).map(el => ({
            selector: 'img',
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 4. Links without text
      const links = Array.from(document.querySelectorAll('a'));
      const linksWithoutText = links.filter((link) => {
        return !link.textContent?.trim() && !link.getAttribute('aria-label') && !link.querySelector('img[alt]');
      });
      
      if (linksWithoutText.length > 0) {
        foundIssues.push({
          id: 'links-no-text',
          title: 'Links Without Text',
          severity: 'high',
          description: 'Links must have text content or aria-label',
          count: linksWithoutText.length,
          elements: linksWithoutText.slice(0, 5).map(el => ({
            selector: 'a',
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 5. Duplicate IDs
      const allIds = Array.from(document.querySelectorAll('[id]')).map(el => ({ id: el.id, el }));
      const idCounts = new Map<string, Element[]>();
      allIds.forEach(({ id, el }) => {
        if (!idCounts.has(id)) idCounts.set(id, []);
        idCounts.get(id)!.push(el);
      });
      const duplicateIds = Array.from(idCounts.entries()).filter(([_, elements]) => elements.length > 1);
      
      if (duplicateIds.length > 0) {
        foundIssues.push({
          id: 'duplicate-ids',
          title: 'Duplicate IDs',
          severity: 'high',
          description: 'Each ID must be unique in the document',
          count: duplicateIds.reduce((sum, [_, els]) => sum + els.length, 0),
          elements: duplicateIds.slice(0, 5).map(([id, elements]) => ({
            selector: `#${id}`,
            html: `ID="${id}" appears ${elements.length} times`,
            path: getElementPath(elements[0])
          }))
        });
      }

      // 6. Heading hierarchy issues
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
      const hierarchyIssues: Element[] = [];
      
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i-1] > 1) {
          hierarchyIssues.push(headings[i]);
        }
      }
      
      if (hierarchyIssues.length > 0) {
        foundIssues.push({
          id: 'heading-hierarchy',
          title: 'Heading Hierarchy Issues',
          severity: 'medium',
          description: 'Headings should not skip levels (e.g., h1 → h3 without h2)',
          count: hierarchyIssues.length,
          elements: hierarchyIssues.slice(0, 5).map(el => ({
            selector: el.tagName.toLowerCase(),
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 7. Empty headings
      const emptyHeadings = headings.filter(h => !h.textContent?.trim());
      if (emptyHeadings.length > 0) {
        foundIssues.push({
          id: 'empty-headings',
          title: 'Empty Headings',
          severity: 'medium',
          description: 'Headings must contain text content',
          count: emptyHeadings.length,
          elements: emptyHeadings.slice(0, 5).map(el => ({
            selector: el.tagName.toLowerCase(),
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 8. Tables without headers
      const tables = Array.from(document.querySelectorAll('table'));
      const tablesWithoutHeaders = tables.filter(table => !table.querySelector('th'));
      if (tablesWithoutHeaders.length > 0) {
        foundIssues.push({
          id: 'tables-no-headers',
          title: 'Tables Without Headers',
          severity: 'medium',
          description: 'Tables should have <th> elements for accessibility',
          count: tablesWithoutHeaders.length,
          elements: tablesWithoutHeaders.slice(0, 5).map(el => ({
            selector: 'table',
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 9. Keyboard inaccessible elements
      const nonAccessibleInteractive = Array.from(document.querySelectorAll('[tabindex="-1"][onclick], [tabindex="-1"][role="button"]'));
      if (nonAccessibleInteractive.length > 0) {
        foundIssues.push({
          id: 'keyboard-inaccessible',
          title: 'Keyboard Inaccessible Elements',
          severity: 'high',
          description: 'Interactive elements with tabindex="-1" cannot be reached via keyboard',
          count: nonAccessibleInteractive.length,
          elements: nonAccessibleInteractive.slice(0, 5).map(el => ({
            selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 10. Iframes without titles (excluding third-party like Google)
      const iframesWithoutTitle = Array.from(document.querySelectorAll('iframe:not([title])'))
        .filter(iframe => {
          // Exclude Google iframes (reCAPTCHA, Identity Services, etc.)
          const src = iframe.getAttribute('src') || '';
          const id = iframe.id || '';
          return !src.includes('google.com') && !id.startsWith('I0_');
        });
      if (iframesWithoutTitle.length > 0) {
        foundIssues.push({
          id: 'iframes-no-title',
          title: 'Iframes Without Titles',
          severity: 'medium',
          description: 'Iframes must have title attributes describing their content',
          count: iframesWithoutTitle.length,
          elements: iframesWithoutTitle.slice(0, 5).map(el => ({
            selector: 'iframe',
            html: el.outerHTML.substring(0, 80) + '...',
            path: getElementPath(el)
          }))
        });
      }

      // 11. Missing landmark roles
      const hasMain = document.querySelector('main, [role="main"]');
      const hasNav = document.querySelector('nav, [role="navigation"]');
      const landmarkIssues: string[] = [];
      if (!hasMain) landmarkIssues.push('No <main> or role="main"');
      if (!hasNav) landmarkIssues.push('No <nav> or role="navigation"');
      
      if (landmarkIssues.length > 0) {
        foundIssues.push({
          id: 'missing-landmarks',
          title: 'Missing Landmark Roles',
          severity: 'low',
          description: 'Page should have main and navigation landmarks for screen readers',
          count: landmarkIssues.length,
          elements: landmarkIssues.map(issue => ({
            selector: 'document',
            html: issue,
            path: 'document'
          }))
        });
      }

      setIssues(foundIssues);
      if (onIssuesFound) {
        onIssuesFound(foundIssues);
      }
      setIsScanning(false);
    }, 2000);
  };

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
    
    if (!isDebugMode) {
      document.body.classList.add('debug-mode');
      document.head.insertAdjacentHTML('beforeend', `
        <style id="debug-styles">
          .debug-mode * {
            outline: 1px solid rgba(255, 0, 0, 0.3) !important;
          }
        </style>
      `);
    } else {
      document.body.classList.remove('debug-mode');
      document.getElementById('debug-styles')?.remove();
    }
  };

  const openViewport = (width: number, height: number, name: string) => {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(
      window.location.href,
      name,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const viewports = [
    { icon: Smartphone, width: 375, height: 667, name: 'Mobile', title: 'iPhone SE (375x667)' },
    { icon: Smartphone, width: 414, height: 896, name: 'Mobile XL', title: 'iPhone 11 Pro Max (414x896)' },
    { icon: Tablet, width: 768, height: 1024, name: 'Tablet', title: 'iPad (768x1024)' },
    { icon: Monitor, width: 1920, height: 1080, name: 'Desktop', title: 'Desktop (1920x1080)' }
  ];

  const toggleSlowMotion = () => {
    setIsSlowMotion(!isSlowMotion);
    
    if (!isSlowMotion) {
      document.head.insertAdjacentHTML('beforeend', `
        <style id="slow-motion-styles">
          *, *::before, *::after {
            animation-duration: 3s !important;
            animation-delay: 0s !important;
            transition-duration: 1s !important;
          }
        </style>
      `);
    } else {
      document.getElementById('slow-motion-styles')?.remove();
    }
  };

  const toggleTouchTargets = () => {
    setShowTouchTargets(!showTouchTargets);
    
    if (!showTouchTargets) {
      // Highlight interactive elements smaller than 44x44px
      const style = document.createElement('style');
      style.id = 'touch-target-styles';
      style.textContent = `
        button, a, input, select, textarea, [role="button"], [onclick] {
          position: relative;
        }
        button::after, a::after, input::after, select::after, textarea::after, 
        [role="button"]::after, [onclick]::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          border: 2px solid transparent;
        }
      `;
      document.head.appendChild(style);
      
      // Find and highlight small touch targets
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [onclick]');
      interactiveElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          (el as HTMLElement).style.outline = '2px solid rgba(255, 0, 0, 0.5)';
          (el as HTMLElement).setAttribute('data-small-target', 'true');
        }
      });
    } else {
      document.getElementById('touch-target-styles')?.remove();
      document.querySelectorAll('[data-small-target]').forEach((el) => {
        (el as HTMLElement).style.outline = '';
        el.removeAttribute('data-small-target');
      });
    }
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(50, Math.min(200, fontSize + delta));
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = '100%';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Search className="h-4 w-4 text-green-700" />
          </div>
          <h3 className="text-base font-semibold">UI Diagnostics</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Comprehensive UI Diagnostics</p>
            <p className="mb-2">Scans for accessibility and HTML issues including:</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Missing labels and alt text</li>
              <li>Heading hierarchy</li>
              <li>Keyboard accessibility</li>
              <li>Duplicate IDs</li>
              <li>And more...</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Debug Mode Toggle */}
        <div className="flex items-center justify-between mb-2 bg-neutral-50 rounded px-2 py-1 border border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">Debug Mode</span>
          <button 
            onClick={toggleDebugMode}
            className="relative"
            type="button"
            title="Shows red outlines on all elements for layout debugging"
          >
            <div className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
              isDebugMode ? 'bg-green-500' : 'bg-neutral-300'
            }`}>
              <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${
                isDebugMode ? 'ml-4' : 'ml-0.5'
              }`}></div>
            </div>
          </button>
        </div>

        {/* Viewport Testing */}
        <div className="flex items-center justify-between mb-2 bg-neutral-50 rounded px-2 py-1 border border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">Viewports</span>
          <div className="flex gap-1">
            {viewports.map((viewport, idx) => {
              const Icon = viewport.icon;
              return (
                <button
                  key={idx}
                  onClick={() => openViewport(viewport.width, viewport.height, viewport.name)}
                  className="p-1 hover:bg-neutral-200 rounded transition-colors"
                  type="button"
                  title={viewport.title}
                >
                  <Icon className="w-3 h-3 text-neutral-600" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Slow Motion Mode */}
        <div className="flex items-center justify-between mb-2 bg-neutral-50 rounded px-2 py-1 border border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">Slow Motion</span>
          <button 
            onClick={toggleSlowMotion}
            className="relative"
            type="button"
            title="Slows down all animations and transitions for debugging"
          >
            <div className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
              isSlowMotion ? 'bg-purple-500' : 'bg-neutral-300'
            }`}>
              <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${
                isSlowMotion ? 'ml-4' : 'ml-0.5'
              }`}></div>
            </div>
          </button>
        </div>

        {/* Touch Targets */}
        <div className="flex items-center justify-between mb-2 bg-neutral-50 rounded px-2 py-1 border border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">Touch Targets</span>
          <button 
            onClick={toggleTouchTargets}
            className="relative"
            type="button"
            title="Highlights interactive elements smaller than 44x44px (mobile minimum)"
          >
            <div className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
              showTouchTargets ? 'bg-orange-500' : 'bg-neutral-300'
            }`}>
              <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${
                showTouchTargets ? 'ml-4' : 'ml-0.5'
              }`}></div>
            </div>
          </button>
        </div>

        {/* Font Size Tester */}
        <div className="flex items-center justify-between mb-2 bg-neutral-50 rounded px-2 py-1 border border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">Font Size</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-600 min-w-[3ch]">{fontSize}%</span>
            <button
              onClick={() => adjustFontSize(-10)}
              disabled={fontSize <= 50}
              className="px-1.5 py-0.5 text-xs bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              type="button"
              title="Decrease font size"
            >
              −
            </button>
            <button
              onClick={resetFontSize}
              disabled={fontSize === 100}
              className="px-1.5 py-0.5 text-xs bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              type="button"
              title="Reset to 100%"
            >
              ↺
            </button>
            <button
              onClick={() => adjustFontSize(10)}
              disabled={fontSize >= 200}
              className="px-1.5 py-0.5 text-xs bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              type="button"
              title="Increase font size"
            >
              +
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex-1 flex items-center justify-center">
          {isScanning ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-xs text-neutral-600">Scanning...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-600">Click Run Scan to check for issues</p>
            </div>
          ) : (
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-900">{issues.length} issue{issues.length !== 1 ? 's' : ''} found</p>
              <p className="text-xs text-neutral-600">See details below</p>
            </div>
          )}
        </div>

        {/* Run Scan Button */}
        <div className="flex justify-end mt-2">
          <Button
            onClick={runScan}
            disabled={isScanning}
            className="text-xs px-3 py-1.5 h-7 flex items-center justify-center"
          >
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UIDiagnostics;
export type { Issue };
