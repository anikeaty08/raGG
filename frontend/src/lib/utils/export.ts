import { Message } from '@/app/chat/page'

export function exportToJSON(messages: Message[], sessionName: string): void {
  const data = {
    sessionName,
    exportedAt: new Date().toISOString(),
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
      timestamp: msg.timestamp.toISOString()
    }))
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sessionName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToMarkdown(messages: Message[], sessionName: string): void {
  let markdown = `# ${sessionName}\n\n`
  markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`
  markdown += '---\n\n'

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '**You**' : '**Assistant**'
    const timestamp = msg.timestamp.toLocaleString()

    markdown += `${role} *(${timestamp})*\n\n`
    markdown += `${msg.content}\n\n`

    if (msg.citations && msg.citations.length > 0) {
      markdown += '**Citations:**\n'
      msg.citations.forEach((citation, i) => {
        markdown += `${i + 1}. ${citation.source}`
        if (citation.line) markdown += `:${citation.line}`
        if (citation.page) markdown += ` (Page ${citation.page})`
        markdown += '\n'
      })
      markdown += '\n'
    }

    markdown += '---\n\n'
  })

  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sessionName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToPDF(messages: Message[], sessionName: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export as PDF')
    return
  }

  const totalQuestions = messages.filter(m => m.role === 'user').length
  const totalAnswers = messages.filter(m => m.role === 'assistant').length
  const totalCitations = messages.reduce((sum, m) => sum + (m.citations?.length || 0), 0)

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${sessionName} — Neuron Study Notes</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.7;
          color: #1f2937;
        }
        .header {
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          color: white;
          padding: 30px;
          border-radius: 16px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
          border: none;
          padding: 0;
          color: white;
        }
        .header .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          font-size: 13px;
        }
        .stats span {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
        }
        .message {
          margin-bottom: 24px;
          padding: 20px;
          border-radius: 12px;
          page-break-inside: avoid;
        }
        .user {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
        }
        .assistant {
          background: #faf5ff;
          border-left: 4px solid #a855f7;
        }
        .role {
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .user .role { color: #2563eb; }
        .assistant .role { color: #7c3aed; }
        .timestamp {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 12px;
        }
        .content {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.8;
        }
        .citations {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .citations strong {
          font-size: 12px;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .citation {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          padding-left: 12px;
          border-left: 2px solid #e5e7eb;
        }
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 13px;
        }
        pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 13px;
        }
        pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
          .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .message { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧠 ${escapeHtml(sessionName)}</h1>
        <div class="subtitle">Neuron Study Notes — Exported ${new Date().toLocaleString()}</div>
        <div class="stats">
          <span>📝 ${totalQuestions} Questions</span>
          <span>💡 ${totalAnswers} Answers</span>
          <span>📚 ${totalCitations} Citations</span>
        </div>
      </div>
  `

  messages.forEach(msg => {
    const roleClass = msg.role === 'user' ? 'user' : 'assistant'
    const roleName = msg.role === 'user' ? '📝 You Asked' : '💡 Neuron'

    html += `
      <div class="message ${roleClass}">
        <div class="role">${roleName}</div>
        <div class="timestamp">${msg.timestamp.toLocaleString()}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
    `

    if (msg.citations && msg.citations.length > 0) {
      html += '<div class="citations"><strong>📖 Sources:</strong>'
      msg.citations.forEach((citation, i) => {
        html += `<div class="citation">${i + 1}. ${escapeHtml(citation.source)}`
        if (citation.line) html += `:${citation.line}`
        if (citation.page) html += ` (Page ${citation.page})`
        html += '</div>'
      })
      html += '</div>'
    }

    html += '</div>'
  })

  html += `
      <div class="footer">
        <p>Generated by <strong>Neuron</strong> — AI Study Assistant</p>
        <p>${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
