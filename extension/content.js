/**
 * PhishAware — Gmail Content Script
 * Injects a risk score badge into every open email in Gmail.
 * Uses MutationObserver to detect when emails are opened.
 */

const API_BASE = "http://localhost:8000/api";

// ─── Risk Badge Injection ────────────────────────────────────

function createRiskBadge(riskLabel, riskScore, explanation) {
  const badge = document.createElement("div");
  badge.className = `phishaware-badge phishaware-${riskLabel.toLowerCase()}`;
  badge.innerHTML = `
    <div class="phishaware-icon">${getRiskIcon(riskLabel)}</div>
    <div class="phishaware-content">
      <span class="phishaware-label">PhishAware: ${riskLabel}</span>
      <span class="phishaware-score">Risk Score: ${riskScore}/100</span>
      <span class="phishaware-explanation">${explanation}</span>
    </div>
    <button class="phishaware-details" onclick="window.open('http://localhost:3000', '_blank')">
      Details →
    </button>
  `;
  return badge;
}

function getRiskIcon(label) {
  const icons = {
    SAFE: "✅",
    SUSPICIOUS: "⚠️",
    DANGEROUS: "🚨"
  };
  return icons[label] || "🔍";
}

// ─── Email Extraction ─────────────────────────────────────────

function extractEmailData(emailContainer) {
  try {
    // Extract sender
    const senderEl = emailContainer.querySelector('[email]') ||
                     emailContainer.querySelector('.gD');
    const senderEmail = senderEl?.getAttribute('email') || '';
    const senderName = senderEl?.getAttribute('name') || '';

    // Extract subject
    const subjectEl = document.querySelector('h2.hP');
    const subject = subjectEl?.textContent?.trim() || '';

    // Extract body text
    const bodyEl = emailContainer.querySelector('.a3s.aiL') ||
                   emailContainer.querySelector('.ii.gt');
    const bodyText = bodyEl?.innerText?.trim() || '';

    // Extract links
    const linkEls = emailContainer.querySelectorAll('a[href]');
    const links = Array.from(linkEls)
      .map(a => a.href)
      .filter(href => href.startsWith('http') && !href.includes('mail.google.com'))
      .slice(0, 20); // cap at 20 links

    return { sender_email: senderEmail, sender_display_name: senderName,
             subject, body_text: bodyText, links };
  } catch (e) {
    console.warn('PhishAware: Failed to extract email data', e);
    return null;
  }
}

// ─── API Call ─────────────────────────────────────────────────

async function scanEmail(emailData) {
  try {
    const response = await fetch(`${API_BASE}/scan/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.warn('PhishAware: Scan API failed', e);
    return null;
  }
}

// ─── Main Observer ────────────────────────────────────────────

async function processEmail(emailContainer) {
  // Skip if already processed
  if (emailContainer.querySelector('.phishaware-badge')) return;

  const emailData = extractEmailData(emailContainer);
  if (!emailData || !emailData.sender_email) return;

  // Show loading badge
  const loadingBadge = document.createElement('div');
  loadingBadge.className = 'phishaware-badge phishaware-loading';
  loadingBadge.innerHTML = `<span>🔍 PhishAware scanning...</span>`;

  // Insert at top of email
  const insertTarget = emailContainer.querySelector('.ade') ||
                       emailContainer.querySelector('.adn');
  if (insertTarget) {
    insertTarget.insertBefore(loadingBadge, insertTarget.firstChild);
  }

  // Call API
  const result = await scanEmail(emailData);

  // Replace loading with real badge
  loadingBadge.remove();
  if (result && insertTarget) {
    const badge = createRiskBadge(result.risk_label, result.risk_score, result.explanation);
    insertTarget.insertBefore(badge, insertTarget.firstChild);

    // Show browser notification for dangerous emails
    if (result.risk_label === 'DANGEROUS') {
      chrome.runtime.sendMessage({
        type: 'DANGEROUS_EMAIL',
        domain: emailData.sender_email.split('@')[1],
        score: result.risk_score
      });
    }
  }
}

// ─── Observe Gmail DOM Changes ────────────────────────────────

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      // Gmail email containers
      const emailContainers = node.querySelectorAll?.('.adn.ads') || [];
      emailContainers.forEach(processEmail);
      if (node.classList?.contains('adn') && node.classList?.contains('ads')) {
        processEmail(node);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
console.log('PhishAware extension loaded on Gmail ✅');
