import { autocompletion } from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { ViewPlugin, EditorView, keymap } from '@codemirror/view';
import { emacs } from '@replit/codemirror-emacs';
import { vim } from '@replit/codemirror-vim';
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap';
import _CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useMemo } from 'react';
import strudelTheme from '../themes/strudel-theme';
import { strudelAutocomplete } from './Autocomplete';
import {
  highlightExtension,
  flashField,
  flash,
  highlightMiniLocations,
  updateMiniLocations,
} from '@strudel/codemirror';
import './style.css';
import { sliderPlugin } from '@strudel/codemirror/slider.mjs';

export { flash, highlightMiniLocations, updateMiniLocations };

const staticExtensions = [javascript(), flashField, highlightExtension, sliderPlugin];

export default function CodeMirror({
  value,
  onChange,
  onViewChanged,
  onSelectionChange,
  onDocChange,
  onEvaluate,
  onReEvaluate,
  onPanic,
  onStop,
  theme,
  keybindings,
  isLineNumbersDisplayed,
  isAutoCompletionEnabled,
  isLineWrappingEnabled,
  fontSize = 18,
  fontFamily = 'monospace',
}) {
  const handleOnChange = useCallback(
    (value) => {
      onChange?.(value);
    },
    [onChange],
  );

  const handleOnCreateEditor = useCallback(
    (view) => {
      onViewChanged?.(view);
    },
    [onViewChanged],
  );

  const handleOnUpdate = useCallback(
    (viewUpdate) => {
      if (viewUpdate.docChanged && onDocChange) {
        onDocChange?.(viewUpdate);
      }
      if (viewUpdate.selectionSet && onSelectionChange) {
        onSelectionChange?.(viewUpdate.state.selection);
      }
    },
    [onSelectionChange],
  );

  const vscodePlugin = ViewPlugin.fromClass(
    class {
      constructor(view) {}
    },
    {
      provide: (plugin) => {
        return Prec.highest(keymap.of([...vscodeKeymap]));
      },
    },
  );

  const vscodeExtension = (options) => [vscodePlugin].concat(options ?? []);

  const extensions = useMemo(() => {
    let _extensions = [...staticExtensions];
    let bindings = {
      vim,
      emacs,
      vscode: vscodeExtension,
    };

    if (bindings[keybindings]) {
      _extensions.push(bindings[keybindings]());
    }

    if (isAutoCompletionEnabled) {
      _extensions.push(javascriptLanguage.data.of({ autocomplete: strudelAutocomplete }));
    } else {
      _extensions.push(autocompletion({ override: [] }));
    }

    _extensions.push(
      keymap.of([
        {
          key: 'Ctrl-Enter',
          run: () => onEvaluate?.(),
        },
        {
          key: 'Alt-Enter',
          run: () => onEvaluate?.(),
        },
        {
          key: 'Ctrl-.',
          run: () => onStop?.(),
        },
        {
          key: 'Alt-.',
          run: (_, e) => {
            e.preventDefault();
            onStop?.();
          },
        },
        {
          key: 'Ctrl-Shift-.',
          run: () => (onPanic ? onPanic() : onStop?.()),
        },
        {
          key: 'Ctrl-Shift-Enter',
          run: () => (onReEvaluate ? onReEvaluate() : onEvaluate?.()),
        },
      ]),
    );

    if (isLineWrappingEnabled) {
      _extensions.push(EditorView.lineWrapping);
    }

    return _extensions;
  }, [keybindings, isAutoCompletionEnabled, isLineWrappingEnabled, onEvaluate, onStop]);

  const basicSetup = useMemo(() => ({ lineNumbers: isLineNumbersDisplayed }), [isLineNumbersDisplayed]);

  return (
    <div style={{ fontSize, fontFamily }} className="w-full">
      <_CodeMirror
        value={value}
        theme={theme || strudelTheme}
        onChange={handleOnChange}
        onCreateEditor={handleOnCreateEditor}
        onUpdate={handleOnUpdate}
        extensions={extensions}
        basicSetup={basicSetup}
      />
    </div>
  );
}
