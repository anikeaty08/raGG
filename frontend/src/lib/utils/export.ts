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
  // For PDF export, we'll use the browser's print functionality
  // Create a temporary window with formatted content
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export as PDF')
    return
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${sessionName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .message {
          margin-bottom: 30px;
          padding: 15px;
          border-radius: 8px;
        }
        .user {
          background-color: #e3f2fd;
          border-left: 4px solid #2196f3;
        }
        .assistant {
          background-color: #f5f5f5;
          border-left: 4px solid #9e9e9e;
        }
        .role {
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .timestamp {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }
        .content {
          white-space: pre-wrap;
        }
        .citations {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .citation {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        code {
          background-color: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>${sessionName}</h1>
      <div class="meta">Exported on ${new Date().toLocaleString()}</div>
  `

  messages.forEach(msg => {
    const roleClass = msg.role === 'user' ? 'user' : 'assistant'
    const roleName = msg.role === 'user' ? 'You' : 'Assistant'
    
    html += `
      <div class="message ${roleClass}">
        <div class="role">${roleName}</div>
        <div class="timestamp">${msg.timestamp.toLocaleString()}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
    `
    
    if (msg.citations && msg.citations.length > 0) {
      html += '<div class="citations"><strong>Citations:</strong>'
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
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
