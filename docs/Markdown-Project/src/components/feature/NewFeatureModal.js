"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewFeatureModal = NewFeatureModal;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const framer_motion_1 = require("framer-motion");
const useAppStore_1 = require("@/hooks/useAppStore");
const translations_1 = require("@/data/translations");
const feature_1 = require("@/models/feature");
function NewFeatureModal() {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const t = translations_1.translations[state.language].newFeatureModal;
    const [title, setTitle] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)('🔴 Todo');
    const [priority, setPriority] = (0, react_1.useState)('🔴 High');
    const [pic, setPic] = (0, react_1.useState)('');
    const [deadline, setDeadline] = (0, react_1.useState)('');
    const [type, setType] = (0, react_1.useState)('');
    if (!state.isNewFeatureModalOpen)
        return null;
    const parentNode = state.newFeatureParentId
        ? (0, feature_1.findFeatureById)(state.features, state.newFeatureParentId)
        : null;
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim())
            return;
        const newId = (0, feature_1.generateFeatureId)(title);
        const level = parentNode ? parentNode.level + 1 : 2;
        const meta = {};
        if (status)
            meta.status = status;
        if (priority)
            meta.priority = priority;
        if (pic.trim())
            meta.pic = pic.trim();
        if (deadline.trim())
            meta.deadline = deadline.trim();
        if (type.trim())
            meta.type = type.trim();
        const newNode = {
            id: newId,
            title: title.trim(),
            level,
            description: description.trim() || undefined,
            metadata: meta,
            children: [],
        };
        dispatch({
            type: 'ADD_FEATURE_NODE',
            payload: { parentId: state.newFeatureParentId, node: newNode },
        });
        // Reset
        setTitle('');
        setDescription('');
        setPic('');
        setDeadline('');
        setType('');
    };
    return (<framer_motion_1.AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

        {/* Modal Content */}
        <framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden glass-panel" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <lucide_react_1.Sparkles size={18} style={{ color: 'var(--color-brand)' }}/>
              <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
                {parentNode ? `${t.title} (${parentNode.title})` : t.title}
              </h2>
            </div>
            <button onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--color-text-dim)' }}>
              <lucide_react_1.X size={18}/>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                Judul Fitur <span className="text-rose-500">*</span>
              </label>
              <input type="text" placeholder="Misal: 🎵 Music Player" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border outline-none" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/>
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                  Status
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  {state.customStatuses.map((st) => (<option key={st.id} value={st.label}>
                      {st.label}
                    </option>))}
                  <option value="">— Tanpa Status</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                  Priority
                </label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  <option value="🔴 High">🔴 High</option>
                  <option value="🟡 Medium">🟡 Medium</option>
                  <option value="🟢 Low">🟢 Low</option>
                  <option value="">— Tanpa Priority</option>
                </select>
              </div>
            </div>

            {/* PIC & Deadline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                  PIC (Penanggung Jawab)
                </label>
                <input type="text" placeholder="@johndoe" value={pic} onChange={(e) => setPic(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-xl border outline-none" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                  Deadline
                </label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-xl border outline-none" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-display" style={{ color: 'var(--color-text-dim)' }}>
                Deskripsi
              </label>
              <textarea rows={3} placeholder="Penjelasan detail tentang fitur ini..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border outline-none resize-y" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button type="button" onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })} className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer" style={{ color: 'var(--color-text-dim)' }}>
                Batal
              </button>
              <button type="submit" className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-lg font-display" style={{ background: 'var(--color-brand)', color: '#050c14' }}>
                <lucide_react_1.Plus size={14}/> Simpan Fitur
              </button>
            </div>
          </form>
        </framer_motion_1.motion.div>
      </div>
    </framer_motion_1.AnimatePresence>);
}
//# sourceMappingURL=NewFeatureModal.js.map