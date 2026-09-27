import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Copy, Check, Hash, Tag, Settings, Sparkles, HelpCircle, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/hooks/useAppStore'
import { translations } from '@/data/translations'

const sampleTemplate = `# Proyek Roblox 2026

## 🎵 Music Player
Sistem musik background dan sound effect untuk seluruh area game.

**Status:** 🟢 Done
**Priority:** 🔴 High
**Type:** System
**PIC:** @audiodev
**Deadline:** 2026-08-25

### Playlist
Fitur daftar putar lagu favorit pemain.

**Status:** 🟢 Done
**Priority:** 🟡 Medium

### Queue & Volume
Pengaturan antrean lagu dan slider volume personal.

**Status:** 🟡 Progress
**Priority:** 🔴 High
**PIC:** @uidev

## 📷 Camera System
Kamera dinamis dengan berbagai preset sinematik.

**Status:** 🟡 Progress
**Priority:** 🔴 High
**Type:** Core
**PIC:** @cameraman

### Free Cam & Tripod
Mode foto bebas untuk konten creator.

**Status:** 🔴 Todo
**Priority:** 🟢 Low

## 💰 Economy & Shop
Sistem mata uang game koin dan toko avatar.

**Status:** 🔴 Todo
**Priority:** 🔴 High
**Type:** Economy
**PIC:** @economist
**Deadline:** 2026-09-01
`

export function DocsView() {
  const { state } = useAppStore()
  const t = translations[state.language].docs
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isEN = state.language === 'en'

  return (
    <div className="w-full h-full overflow-y-auto select-none">
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl border glass-panel relative overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: 'var(--color-brand-glow)', border: '1px solid var(--color-brand)' }}
            >
              <BookOpen size={28} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1.5 flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                {t.title}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Grid 2 Columns: Struktur & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Hierarki Heading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-2xl border space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}>
                <Hash size={20} />
              </div>
              <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
                {isEN ? '1. Feature Hierarchy (Heading)' : '1. Hierarki Fitur (Heading)'}
              </h2>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {isEN
                ? <>Use <code className="font-mono font-bold" style={{ color: 'var(--color-brand)' }}>#</code> symbols to define depth of the feature tree/hierarchy:</>
                : <>Gunakan tanda <code className="font-mono font-bold" style={{ color: 'var(--color-brand)' }}>#</code> untuk menentukan kedalaman pohon/hierarki fitur:</>
              }
            </p>

            <div className="p-4 rounded-xl font-mono text-xs space-y-2 border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <div><span className="font-bold" style={{ color: 'var(--color-brand)' }}># {isEN ? 'Project' : 'Proyek'}</span> <span style={{ color: 'var(--color-text-dim)' }}>→ {isEN ? 'Main Root' : 'Root Utama'}</span></div>
              <div><span className="font-bold" style={{ color: 'var(--color-brand)' }}>## {isEN ? 'Main Feature' : 'Fitur Utama'}</span> <span style={{ color: 'var(--color-text-dim)' }}>→ {isEN ? 'Feature Parent' : 'Parent Fitur'}</span></div>
              <div><span className="font-bold" style={{ color: 'var(--color-brand)' }}>### {isEN ? 'Sub-Feature' : 'Sub-Fitur'}</span> <span style={{ color: 'var(--color-text-dim)' }}>→ {isEN ? 'Child of Main Feature' : 'Child dari Fitur Utama'}</span></div>
              <div><span className="font-bold" style={{ color: 'var(--color-brand)' }}>#### {isEN ? 'Detail Item' : 'Detail Item'}</span> <span style={{ color: 'var(--color-text-dim)' }}>→ {isEN ? 'Next sub-child' : 'Sub-child berikutnya'}</span></div>
            </div>
          </motion.div>

          {/* Card 2: Metadata Key: Value */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-2)', color: '#38bdf8' }}>
                <Tag size={20} />
              </div>
              <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
                {isEN ? '2. Metadata & Custom Fields' : '2. Metadata & Custom Field'}
              </h2>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {isEN
                ? <>Write metadata using bold format <code className="font-mono text-sky-500 font-bold">**Key:** Value</code> directly below the heading:</>
                : <>Tulis metadata dengan format tebal <code className="font-mono text-sky-500 font-bold">**Key:** Value</code> tepat di bawah heading:</>
              }
            </p>

            <div className="p-4 rounded-xl font-mono text-xs space-y-1.5 border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <div><strong style={{ color: 'var(--color-text)' }}>**Status:**</strong> 🟢 Done <span style={{ color: 'var(--color-text-dim)' }}>({isEN ? 'Kanban Column' : 'Kolom Kanban'})</span></div>
              <div><strong style={{ color: 'var(--color-text)' }}>**Priority:**</strong> 🔴 High</div>
              <div><strong style={{ color: 'var(--color-text)' }}>**PIC:**</strong> @johndoe</div>
              <div><strong style={{ color: 'var(--color-text)' }}>**Deadline:**</strong> 2026-08-30</div>
              <div><strong style={{ color: 'var(--color-text)' }}>**Image:**</strong> https://... <span style={{ color: 'var(--color-text-dim)' }}>({isEN ? 'Thumbnail / Preview' : 'Thumbnail / Preview'})</span></div>
              <div><strong style={{ color: 'var(--color-text)' }}>**Link:**</strong> https://... <span style={{ color: 'var(--color-text-dim)' }}>({isEN ? 'External link' : 'Tautan eksternal'})</span></div>
              <div><strong style={{ color: 'var(--color-text)' }}>**Sprint:**</strong> Sprint 2 <span style={{ color: 'var(--color-text-dim)' }}>({isEN ? 'Create your own!' : 'Bebas buat baru!'})</span></div>
            </div>
          </motion.div>
        </div>

        {/* Legend Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-2)', color: '#a78bfa' }}>
              <Sparkles size={20} />
            </div>
            <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
              {isEN ? '3. Legend & Standard Values' : '3. Legend & Standar Nilai'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Status Legend */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-dim)' }}>
                {isEN ? 'Status Legend (Kanban)' : 'Legend Status (Kanban)'}
              </h3>
              <div className="space-y-1.5 text-xs font-display">
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🔴 Todo</span>
                  <span className="text-rose-500 font-medium">{isEN ? 'Not started' : 'Belum dimulai'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🟡 Progress</span>
                  <span className="text-amber-500 font-medium">{isEN ? 'In progress' : 'Sedang dikerjakan'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🟢 Done</span>
                  <span className="text-emerald-500 font-medium">{isEN ? 'Completed' : 'Selesai'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🔵 In Review / 🟣 Blocked</span>
                  <span className="text-indigo-400 font-medium">{isEN ? 'Custom Status' : 'Status Kustom'}</span>
                </div>
              </div>
            </div>

            {/* Priority Legend */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-dim)' }}>
                {isEN ? 'Priority Legend' : 'Legend Priority'}
              </h3>
              <div className="space-y-1.5 text-xs font-display">
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🔴 High</span>
                  <span className="text-rose-500 font-medium">{isEN ? 'Main / Urgent' : 'Prioritas Utama / Mendesak'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🟡 Medium</span>
                  <span className="text-amber-500 font-medium">{isEN ? 'Normal Priority' : 'Prioritas Normal'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>🟢 Low</span>
                  <span className="text-emerald-500 font-medium">{isEN ? 'Low / Optional' : 'Prioritas Rendah / Opsional'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cara Penggunaan Aplikasi */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}>
              <Settings size={20} />
            </div>
            <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
              {isEN ? '4. Tips & Key App Features' : '4. Tips & Fitur Utama Aplikasi'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold flex items-center gap-1.5 font-display" style={{ color: 'var(--color-text)' }}>
                <ArrowRight size={14} style={{ color: 'var(--color-brand)' }} /> {isEN ? 'Two-Way Sync' : 'Sinkronisasi Dua Arah'}
              </h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {isEN
                  ? 'Every time you edit a title, description, status, or metadata in the web app, your local Markdown file will be automatically updated.'
                  : 'Setiap kali Anda mengedit judul, deskripsi, status, atau metadata di aplikasi web, file Markdown di komputer lokal Anda akan otomatis diperbarui.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold flex items-center gap-1.5 font-display" style={{ color: 'var(--color-text)' }}>
                <ArrowRight size={14} className="text-sky-400" /> Kanban Drag & Drop
              </h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {isEN
                  ? 'Drag feature cards from one column to another (e.g. from Todo to Done). Card status in your Markdown file will change instantly!'
                  : 'Tarik kartu fitur dari satu kolom ke kolom lain (misal dari Todo ke Done). Status kartu di file Markdown akan langsung berubah!'}
              </p>
            </div>

            <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold flex items-center gap-1.5 font-display" style={{ color: 'var(--color-text)' }}>
                <ArrowRight size={14} className="text-purple-400" /> {isEN ? 'Column Settings' : 'Pengaturan Kolom'}
              </h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {isEN
                  ? 'Open the Settings menu in the header (gear icon) to choose which columns and badges to display in Mindmap, Table, Tree, and Kanban.'
                  : 'Buka menu Settings (ikon gear) di header untuk memilih kolom apa saja yang ingin Anda tampilkan di Mindmap, Table, Tree, dan Kanban.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Copyable Markdown Template */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 rounded-2xl border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} style={{ color: 'var(--color-brand)' }} />
              <h2 className="text-base font-bold font-display" style={{ color: 'var(--color-text)' }}>
                {isEN ? 'Ready-to-Use Markdown Template' : 'Contoh Template Markdown Siap Pakai'}
              </h2>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md font-display"
              style={{ background: copied ? '#22c55e' : 'var(--color-brand)', color: '#050c14' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? (isEN ? 'Copied to Clipboard!' : 'Tersalin ke Clipboard!') : (isEN ? 'Copy Template' : 'Salin Template')}
            </button>
          </div>

          <pre
            className="p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {sampleTemplate}
          </pre>
        </motion.div>
      </div>
    </div>
  )
}
