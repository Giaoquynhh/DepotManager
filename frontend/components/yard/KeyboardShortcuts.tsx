import React, { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onRefresh?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onToggleHeatmap?: () => void;
  onToggleDesign?: () => void;
  enabled?: boolean;
}

export default function KeyboardShortcuts({
  onRefresh,
  onSearch,
  onExport,
  onSettings,
  onToggleHeatmap,
  onToggleDesign,
  enabled = true
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Check for modifier keys
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    switch (event.key.toLowerCase()) {
      case 'r':
        if (isCtrl) {
          event.preventDefault();
          onRefresh?.();
        }
        break;
        
      case '/':
        if (!isCtrl && !isShift && !isAlt) {
          event.preventDefault();
          onSearch?.();
        }
        break;
        
      case 'e':
        if (isCtrl) {
          event.preventDefault();
          onExport?.();
        }
        break;
        
      case ',':
        if (isCtrl) {
          event.preventDefault();
          onSettings?.();
        }
        break;
        
      case 'h':
        if (isCtrl) {
          event.preventDefault();
          onToggleHeatmap?.();
        }
        break;
        
      case 'd':
        if (isCtrl) {
          event.preventDefault();
          onToggleDesign?.();
        }
        break;
        
      case 'escape':
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('.modal, .dropdown, .tooltip');
        modals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            modal.style.display = 'none';
          }
        });
        break;
        
      case ' ':
        if (!isCtrl && !isShift && !isAlt) {
          event.preventDefault();
          onRefresh?.();
        }
        break;
        
      case 'f':
        if (isCtrl) {
          event.preventDefault();
          onSearch?.();
        }
        break;
    }
  }, [enabled, onRefresh, onSearch, onExport, onSettings, onToggleHeatmap, onToggleDesign]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Show keyboard shortcuts help
  const showShortcutsHelp = useCallback(() => {
    const shortcuts = [
      { key: 'Ctrl + R', description: 'Làm mới dữ liệu' },
      { key: '/', description: 'Tìm kiếm container' },
      { key: 'Ctrl + E', description: 'Xuất báo cáo' },
      { key: 'Ctrl + ,', description: 'Mở cài đặt' },
      { key: 'Ctrl + H', description: 'Bật/tắt Heatmap' },
      { key: 'Ctrl + D', description: 'Chuyển đổi giao diện' },
      { key: 'Space', description: 'Làm mới nhanh' },
      { key: 'Esc', description: 'Đóng modal/dropdown' }
    ];

    // Create help modal
    const modal = document.createElement('div');
    modal.className = 'keyboard-shortcuts-help';
    modal.innerHTML = `
      <div class="shortcuts-modal">
        <div class="shortcuts-header">
          <h3>⌨️ Phím tắt</h3>
          <button class="close-btn" onclick="this.closest('.keyboard-shortcuts-help').remove()">×</button>
        </div>
        <div class="shortcuts-list">
          ${shortcuts.map(shortcut => `
            <div class="shortcut-item">
              <kbd class="shortcut-key">${shortcut.key}</kbd>
              <span class="shortcut-desc">${shortcut.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 5000);
  }, []);

  // Add help button to page
  useEffect(() => {
    if (!enabled) return;

    const helpButton = document.createElement('button');
    helpButton.className = 'keyboard-shortcuts-help-btn';
    helpButton.innerHTML = '⌨️';
    helpButton.title = 'Xem phím tắt (Ctrl + ?)';
    helpButton.onclick = showShortcutsHelp;
    
    // Position the button
    helpButton.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, var(--ocean-cyan) 0%, var(--ocean-electric) 100%);
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
      transition: all 0.3s ease;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    helpButton.addEventListener('mouseenter', () => {
      helpButton.style.transform = 'translateY(-4px) scale(1.1)';
      helpButton.style.boxShadow = '0 15px 35px rgba(0, 212, 255, 0.4)';
    });
    
    helpButton.addEventListener('mouseleave', () => {
      helpButton.style.transform = 'translateY(0) scale(1)';
      helpButton.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.3)';
    });
    
    document.body.appendChild(helpButton);
    
    // Add keyboard shortcut for help
    const handleHelpKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '?') {
        event.preventDefault();
        showShortcutsHelp();
      }
    };
    
    document.addEventListener('keydown', handleHelpKey);
    
    return () => {
      if (helpButton.parentNode) {
        helpButton.remove();
      }
      document.removeEventListener('keydown', handleHelpKey);
    };
  }, [enabled, showShortcutsHelp]);

  return null; // This component doesn't render anything visible
}




