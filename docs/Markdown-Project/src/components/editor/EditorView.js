"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorView = EditorView;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAppStore_1 = require("@/hooks/useAppStore");
const translations_1 = require("@/data/translations");
const markdownParser_1 = require("@/features/parser/markdownParser");
function EditorView() {
    const { state, dispatch, saveNow } = (0, useAppStore_1.useAppStore)();
    const t = translations_1.translations[state.language].editor;
    const [localContent, setLocalContent] = (0, react_1.useState)('');
    // Sync state.rawMarkdown with local editor state when view is loaded
    (0, react_1.useEffect)(() => {
        if (state.rawMarkdown !== null) {
            setLocalContent(state.rawMarkdown);
        }
    }, [state.rawMarkdown]);
    const handleTextChange = (val) => {
        setLocalContent(val);
        // Parse on-the-fly and update store
        try {
            const parsedFeatures = (0, markdownParser_1.parseMarkdown)(val);
            dispatch({
                type: 'UPDATE_FEATURES',
                payload: {
                    features: parsedFeatures,
                    content: val,
                },
            });
        }
        catch (e) {
            console.warn('Malformed markdown formatting:', e);
        }
    };
    return (<div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 text-xs gap-3 select-none" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <lucide_react_1.FileText size={15} className="text-indigo-400"/>
          <span className="font-bold text-white">{t.title}</span>
          <span className="hidden md:inline text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
            • {t.instruction}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Explicit Save button */}
          <button type="button" onClick={() => saveNow()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors">
            <lucide_react_1.Save size={13}/>
            <span>{t.saveDiskBtn}</span>
          </button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers fake column */}
        <div className="w-12 py-4 select-none text-right pr-3 font-mono text-[11px] border-r flex flex-col items-stretch" style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-dim)',
            opacity: 0.5,
        }}>
          {Array.from({ length: Math.max(20, localContent.split('\n').length) }).map((_, i) => (<div key={i}>{i + 1}</div>))}
        </div>

        {/* Text Area */}
        <textarea value={localContent} onChange={(e) => handleTextChange(e.target.value)} spellCheck={false} className="flex-1 h-full p-4 font-mono text-xs leading-relaxed outline-none resize-none overflow-y-auto" style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text-muted)',
        }} placeholder={t.placeholder}/>
      </div>
    </div>);
}
//# sourceMappingURL=EditorView.js.map