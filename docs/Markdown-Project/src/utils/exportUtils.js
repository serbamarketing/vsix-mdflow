"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToHTML = exportToHTML;
exports.exportToPDF = exportToPDF;
exports.exportToCSV = exportToCSV;
const jspdf_1 = __importDefault(require("jspdf"));
const feature_1 = require("@/models/feature");
// 1. Export as Interactive Standalone HTML with Mindmap, Table, and Kanban views
function exportToHTML(features, title = 'Markdown Project Export') {
    const flat = (0, feature_1.flattenFeatures)(features);
    const metaKeys = (0, feature_1.getAllMetadataKeys)(features);
    // Build Table rows HTML
    const rowsHtml = flat
        .map((node) => {
        const metaTds = metaKeys
            .map((k) => `<td style="color: ${k === 'status' ? (0, feature_1.getStatusColor)(node.metadata[k]) : '#cbd5e1'}; font-weight: ${k === 'status' ? '600' : 'normal'};">${node.metadata[k] ? escapeHtml(node.metadata[k]) : '—'}</td>`)
            .join('');
        const indent = (node.level - 1) * 18;
        return `<tr>
        <td style="padding-left: ${indent + 12}px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(0, feature_1.getStatusColor)(node.metadata.status)}; margin-right: 8px;"></span>
          <strong>${escapeHtml(node.title)}</strong>
          ${node.description ? `<br><small style="color: #94a3b8; font-size: 11px; margin-left: 14px;">${escapeHtml(node.description)}</small>` : ''}
        </td>
        <td><span class="badge">H${node.level}</span></td>
        ${metaTds}
      </tr>`;
    })
        .join('');
    const headersHtml = metaKeys.map((k) => `<th style="text-transform: capitalize;">${escapeHtml(k)}</th>`).join('');
    // Build Kanban columns HTML
    const statusGroups = {
        'Todo': [],
        'Progress': [],
        'Done': [],
        'Other': [],
    };
    for (const f of flat) {
        const s = (f.metadata.status || '').toLowerCase();
        if (s.includes('done'))
            statusGroups['Done'].push(f);
        else if (s.includes('progress'))
            statusGroups['Progress'].push(f);
        else if (s.includes('todo'))
            statusGroups['Todo'].push(f);
        else
            statusGroups['Other'].push(f);
    }
    const kanbanHtml = Object.entries(statusGroups)
        .map(([colName, items]) => {
        const cardsHtml = items
            .map((item) => `
        <div class="card">
          <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 4px;">${escapeHtml(item.title)}</div>
          ${item.description ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">${escapeHtml(item.description)}</div>` : ''}
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${item.metadata.priority ? `<span class="tag" style="background: #451a03; color: #f59e0b;">${escapeHtml(item.metadata.priority)}</span>` : ''}
            ${item.metadata.pic ? `<span class="tag" style="background: #082f49; color: #38bdf8;">👤 ${escapeHtml(item.metadata.pic)}</span>` : ''}
            ${item.metadata.deadline ? `<span class="tag" style="background: #4c0519; color: #f43f5e;">📅 ${escapeHtml(item.metadata.deadline)}</span>` : ''}
          </div>
        </div>
      `)
            .join('');
        return `
      <div class="kanban-col">
        <div class="kanban-header">${colName} (${items.length})</div>
        <div class="kanban-cards">${cardsHtml || '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 20px;">Kosong</div>'}</div>
      </div>
    `;
    })
        .join('');
    // Build Mindmap Markdown payload for Markmap
    function buildMarkmapMd(nodes, depth = 0) {
        return nodes
            .map((n) => {
            const prefix = '#'.repeat(depth + 1);
            const badge = n.metadata.status ? ` \`${n.metadata.status}\`` : '';
            const children = buildMarkmapMd(n.children, depth + 1);
            return `${prefix} ${n.title}${badge}${children ? '\n' + children : ''}`;
        })
            .join('\n');
    }
    const mindmapMarkdown = `# ${escapeHtml(title)}\n` + buildMarkmapMd(features, 1);
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — MarkdownFlow</title>
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-lib"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090a10; color: #f8fafc; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    header { background: #11131f; border-bottom: 1px solid #2c324e; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    h1 { font-size: 16px; margin: 0; color: #fff; font-weight: 700; }
    .tabs { display: flex; gap: 8px; }
    .tab-btn { background: #191c2d; color: #94a3b8; border: 1px solid #2c324e; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
    .tab-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
    main { flex: 1; overflow: hidden; position: relative; }
    .view-panel { display: none; width: 100%; height: 100%; overflow: auto; padding: 24px; }
    .view-panel.active { display: flex; flex-direction: column; }
    
    /* Table View */
    table { width: 100%; border-collapse: collapse; background: #11131f; border-radius: 12px; overflow: hidden; border: 1px solid #2c324e; font-size: 12.5px; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #191c2d; }
    th { background: #191c2d; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    tr:hover { background: #191c2d; }
    .badge { background: #191c2d; color: #a78bfa; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; }

    /* Kanban View */
    .kanban-board { display: flex; gap: 16px; height: 100%; overflow-x: auto; }
    .kanban-col { width: 280px; background: #11131f; border: 1px solid #2c324e; border-radius: 12px; display: flex; flex-direction: column; max-height: 100%; }
    .kanban-header { padding: 12px 16px; border-bottom: 1px solid #2c324e; font-weight: bold; font-size: 13px; color: #fff; }
    .kanban-cards { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .card { background: #191c2d; border: 1px solid #2c324e; border-radius: 8px; padding: 12px; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }

    /* Mindmap */
    #mindmap-svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('mindmap')">🧠 Mindmap</button>
      <button class="tab-btn" onclick="switchTab('table')">📊 Database Table</button>
      <button class="tab-btn" onclick="switchTab('kanban')">📋 Kanban Board</button>
    </div>
  </header>

  <main>
    <!-- 1. Mindmap Panel -->
    <div id="mindmap" class="view-panel active" style="padding: 0;">
      <svg id="mindmap-svg"></svg>
    </div>

    <!-- 2. Table Panel -->
    <div id="table" class="view-panel">
      <table>
        <thead>
          <tr>
            <th>Item / Task</th>
            <th>Level</th>
            ${headersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <!-- 3. Kanban Panel -->
    <div id="kanban" class="view-panel">
      <div class="kanban-board">
        ${kanbanHtml}
      </div>
    </div>
  </main>

  <script>
    function switchTab(viewId) {
      document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      event.target.classList.add('active');

      if (viewId === 'mindmap' && window.markmapInstance) {
        window.markmapInstance.fit();
      }
    }

    // Render Markmap
    try {
      const transformer = new markmap.Transformer();
      const markdown = ${JSON.stringify(mindmapMarkdown)};
      const { root } = transformer.transform(markdown);
      const svg = document.getElementById('mindmap-svg');
      window.markmapInstance = markmap.Markmap.create(svg, {
        color: () => ['#818cf8', '#a78bfa', '#38bdf8', '#34d399', '#f472b6'][Math.floor(Math.random() * 5)],
        fitRatio: 0.95
      }, root);
    } catch(e) {
      console.error(e);
    }
  </script>
</body>
</html>`;
    downloadFile(title.replace(/\.[^/.]+$/, '') + '.html', html, 'text/html;charset=utf-8;');
}
// 2. Direct PDF File Download using jsPDF
function exportToPDF(features, title = 'Markdown Project Export') {
    const flat = (0, feature_1.flattenFeatures)(features);
    const metaKeys = (0, feature_1.getAllMetadataKeys)(features).slice(0, 4); // fit in A4 page
    const doc = new jspdf_1.default({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`MarkdownFlow Project Report — Total Items: ${flat.length} | Generated: ${new Date().toLocaleDateString()}`, 14, 24);
    // Table header
    let y = 32;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('ITEM / TASK', 16, y);
    doc.text('LVL', 105, y);
    let xOffset = 115;
    for (const k of metaKeys) {
        doc.text(k.toUpperCase().slice(0, 10), xOffset, y);
        xOffset += 18;
    }
    y += 7;
    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const node of flat) {
        if (y > 275) {
            doc.addPage();
            y = 20;
        }
        const indent = Math.min((node.level - 1) * 3, 15);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        // Truncate title if too long
        const cleanTitle = (node.title.length > 45 ? node.title.substring(0, 42) + '...' : node.title);
        doc.text(cleanTitle, 16 + indent, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`H${node.level}`, 105, y);
        let xVal = 115;
        for (const k of metaKeys) {
            const val = node.metadata[k] || '—';
            const cleanVal = val.length > 10 ? val.substring(0, 9) + '..' : val;
            doc.text(cleanVal, xVal, y);
            xVal += 18;
        }
        // Line separator
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 2, 196, y + 2);
        y += 7;
    }
    doc.save(title.replace(/\.[^/.]+$/, '') + '.pdf');
}
// 3. Export as CSV
function exportToCSV(features, fileName = 'project-export.csv') {
    const flat = (0, feature_1.flattenFeatures)(features);
    const metaKeys = (0, feature_1.getAllMetadataKeys)(features);
    const headers = ['ID', 'Title', 'Level', 'Description', ...metaKeys];
    const escapeCSV = (str) => {
        if (!str)
            return '""';
        const clean = str.replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${clean}"`;
    };
    const rows = flat.map((node) => {
        const metaValues = metaKeys.map((k) => escapeCSV(node.metadata[k] ?? ''));
        return [
            escapeCSV(node.id),
            escapeCSV(node.title),
            escapeCSV(`H${node.level}`),
            escapeCSV(node.description ?? ''),
            ...metaValues,
        ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    downloadFile(fileName.replace(/\.[^/.]+$/, '') + '.csv', csvContent, 'text/csv;charset=utf-8;');
}
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
//# sourceMappingURL=exportUtils.js.map