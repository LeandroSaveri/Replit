// ============================================
// USE KEYBOARD HOOK - Atalhos de Teclado
// ============================================

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

export function useKeyboard(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Preset shortcuts for the editor
export function useEditorKeyboard({
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onSelectAll,
  onSave,
  onEscape,
}: {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}) {
  useKeyboard([
    { key: 'z', ctrl: true, action: () => onUndo?.(), preventDefault: true },
    { key: 'z', ctrl: true, shift: true, action: () => onRedo?.(), preventDefault: true },
    { key: 'y', ctrl: true, action: () => onRedo?.(), preventDefault: true },
    { key: 'Delete', action: () => onDelete?.() },
    { key: 'Backspace', action: () => onDelete?.() },
    { key: 'c', ctrl: true, action: () => onCopy?.(), preventDefault: true },
    { key: 'v', ctrl: true, action: () => onPaste?.(), preventDefault: true },
    { key: 'a', ctrl: true, action: () => onSelectAll?.(), preventDefault: true },
    { key: 's', ctrl: true, action: () => onSave?.(), preventDefault: true },
    { key: 'Escape', action: () => onEscape?.() },
  ]);
}
