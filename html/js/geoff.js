      (() => {
        const SITE = 'https://mollyandshaina.com';
        const MAX_PAGES = 50;
        const FALLBACK_ROUTES = [
          '/',
          '/home/',
          '/molly/',
          '/molly-traits/',
          '/molly-habits/',
          '/molly-mind/',
          '/molly-gallery/',
          '/molly-faq/',
          '/molly-dog-breeds/',
          '/about-molly/',
          '/shaina/',
          '/shaina-home/',
          '/shaina-traits/',
          '/shaina-habits/',
          '/shaina-mind/',
          '/shaina-gallery/',
          '/shaina-faq/',
          '/about-shaina/',
          '/poppy/',
          '/poppy-traits/',
          '/poppy-habits/',
          '/poppy-mind/',
          '/poppy-gallery/',
          '/poppy-faq/',
          '/about-poppy/',
          '/breed-quiz/',
          '/comics/',
          '/blog/',
          '/dog-diaries/',
          '/games/',
          '/images/',
          '/merch/',
          '/favourites/',
          '/achievements/',
          '/submit/',
          '/contact/',
          '/about-me/',
          '/privacy-policy/',
          '/terms-of-use/',
          '/cybersafety1/',
          '/cybersafety2/',
          '/cybersafety3/'
        ];

        const state = {
          pages: [],
          ready: false,
          indexing: false
        };
        const trainingState = {
          active: false,
          awaitingPassword: false,
          entries: []
        };
        const defaultPromptPlaceholder = 'Ask Geoff about mollyandshaina.com…';
        const $ = id => document.getElementById(id);
        const chat = $('chat');
        const form = $('composer');
        const prompt = $('prompt');
        const trainingPassword = $('trainingPassword');
        const sendButton = $('sendButton');

        function showPasswordComposer(show) {
          prompt.hidden = show;
          trainingPassword.hidden = !show;
          if (!show) trainingPassword.value = '';
        }

        function focusComposer() {
          (trainingState.awaitingPassword ? trainingPassword : prompt).focus();
        }

        function composerValue() {
          return trainingState.awaitingPassword ? trainingPassword.value : prompt.value;
        }

        const time = () => new Intl.DateTimeFormat('en-AU', {
          hour: 'numeric',
          minute: '2-digit'
        }).format(new Date());
        const escapeHTML = value => String(value).replace(/[&<>'"]/g, ch => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        } [ch]));
        const normalise = text => text.replace(/\s+/g, ' ').trim();
        const words = text => normalise(text.toLowerCase()).match(/[a-z0-9]+/g) || [];

        function safeMarkdownURL(value) {
          const url = String(value || '').trim();
          return /^(?:https?:\/\/|mailto:|\/(?!\/)|\.\.?\/|#)/i.test(url) ? escapeHTML(url) : '#';
        }

        const safeRawHTMLTags = new Set([
          'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'del', 'details', 'div', 'em',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'kbd', 'li', 'mark',
          'ol', 'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
          'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
        ]);
        const voidRawHTMLTags = new Set(['br', 'hr', 'img']);

        function rawHTMLAttribute(tag, name) {
          const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
          const match = String(tag).replace(/^<\s*[^\s>]+/, '').match(pattern);
          return match ? (match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : '') : '';
        }

        function sanitizeRawHTMLTag(rawTag) {
          const match = String(rawTag).match(/^<\s*(\/?)\s*([a-z0-9]+)\b/i);
          if (!match) return escapeHTML(rawTag);

          const closing = Boolean(match[1]);
          const tag = match[2].toLowerCase();
          if (!safeRawHTMLTags.has(tag)) return escapeHTML(rawTag);
          if (closing) return voidRawHTMLTags.has(tag) ? '' : `</${tag}>`;

          if (tag === 'a') {
            const rawHref = rawHTMLAttribute(rawTag, 'href');
            const href = safeMarkdownURL(rawHref);
            const external = /^https?:\/\//i.test(rawHref);
            return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>`;
          }

          if (tag === 'img') {
            const src = safeMarkdownURL(rawHTMLAttribute(rawTag, 'src'));
            const alt = escapeHTML(rawHTMLAttribute(rawTag, 'alt'));
            return src === '#' ? '' : `<img src="${src}" alt="${alt}" loading="lazy">`;
          }

          if (tag === 'td' || tag === 'th') {
            const colspan = Math.min(12, Math.max(1, Number(rawHTMLAttribute(rawTag, 'colspan')) || 1));
            const rowspan = Math.min(50, Math.max(1, Number(rawHTMLAttribute(rawTag, 'rowspan')) || 1));
            return `<${tag} colspan="${colspan}" rowspan="${rowspan}">`;
          }

          return `<${tag}>`;
        }

        function renderInlineMarkdown(value) {
          const tokens = [];
          const stash = html => `\u0000${tokens.push(html) - 1}\u0000`;
          let text = String(value || '');

          text = text
            .replace(/`\[([^\]]+)\]`\(\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\)/gi, '[$1]($2)')
            .replace(/\[([^\]]+)\]\(\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\)/gi, '[$1]($2)');
          text = text.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${escapeHTML(code)}</code>`));
          text = text.replace(/<(https?:\/\/[^\s<>]+)>/gi, (_, url) => stash(`<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(url)}</a>`));
          text = text.replace(/<\/?[a-z][^<>]*>/gi, rawTag => stash(sanitizeRawHTMLTag(rawTag)));
          text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => {
            const src = safeMarkdownURL(url);
            return src === '#' ? escapeHTML(alt) : stash(`<img src="${src}" alt="${escapeHTML(alt)}" loading="lazy">`);
          });
          text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
            const href = safeMarkdownURL(url);
            return stash(`<a href="${href}"${/^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${renderInlineMarkdown(label)}</a>`);
          });

          text = escapeHTML(text)
            .replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
            .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
            .replace(/(^|[^\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
            .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');

          return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
        }

        function splitMarkdownTableRow(value) {
          let row = String(value || '').trim().replace(/^\\(?=\|)/, '').replace(/\\\s*$/, '');
          if (row.startsWith('|')) row = row.slice(1);
          if (row.endsWith('|')) row = row.slice(0, -1);

          const cells = [];
          let cell = '';
          let escaped = false;

          for (const character of row) {
            if (escaped) {
              cell += character === '|' ? '|' : `\\${character}`;
              escaped = false;
            } else if (character === '\\') {
              escaped = true;
            } else if (character === '|') {
              cells.push(cell.trim());
              cell = '';
            } else {
              cell += character;
            }
          }

          if (escaped) cell += '\\';
          cells.push(cell.trim());
          return cells;
        }

        function isMarkdownTableSeparator(cells) {
          return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
        }

        function renderMarkdown(value) {
          const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
          const output = [];
          let paragraph = [];

          const flushParagraph = () => {
            if (!paragraph.length) return;
            output.push(`<p>${renderInlineMarkdown(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
            paragraph = [];
          };

          for (let index = 0; index < lines.length;) {
            const line = lines[index];

            if (!line.trim()) {
              flushParagraph();
              index += 1;
              continue;
            }

            const fence = line.match(/^\s*```([a-z0-9_-]*)\s*$/i);
            if (fence) {
              flushParagraph();
              const code = [];
              index += 1;
              while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) code.push(lines[index++]);
              if (index < lines.length) index += 1;
              const language = fence[1] ? ` class="language-${escapeHTML(fence[1])}"` : '';
              output.push(`<pre><code${language}>${escapeHTML(code.join('\n'))}</code></pre>`);
              continue;
            }

            if (index + 1 < lines.length && line.includes('|')) {
              const headers = splitMarkdownTableRow(line);
              const separators = splitMarkdownTableRow(lines[index + 1]);

              if (headers.length === separators.length && isMarkdownTableSeparator(separators)) {
                flushParagraph();
                const alignments = separators.map(separator => {
                  const clean = separator.replace(/\s/g, '');
                  if (clean.startsWith(':') && clean.endsWith(':')) return 'center';
                  if (clean.endsWith(':')) return 'right';
                  return 'left';
                });
                const rows = [];
                index += 2;

                while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
                  const cells = splitMarkdownTableRow(lines[index]);
                  while (cells.length < headers.length) cells.push('');
                  rows.push(cells.slice(0, headers.length));
                  index += 1;
                }

                const headingHTML = headers.map((cell, cellIndex) => `<th style="text-align:${alignments[cellIndex]}">${renderInlineMarkdown(cell)}</th>`).join('');
                const bodyHTML = rows.map(row => `<tr>${row.map((cell, cellIndex) => `<td style="text-align:${alignments[cellIndex]}">${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('');
                output.push(`<div class="table-wrap"><table><thead><tr>${headingHTML}</tr></thead><tbody>${bodyHTML}</tbody></table></div>`);
                continue;
              }
            }

            const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
            if (heading) {
              flushParagraph();
              const level = heading[1].length;
              const content = heading[2].replace(/\s+#+\s*$/, '');
              output.push(`<h${level}>${renderInlineMarkdown(content)}</h${level}>`);
              index += 1;
              continue;
            }

            if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
              flushParagraph();
              output.push('<hr>');
              index += 1;
              continue;
            }

            if (/^\s{0,3}>/.test(line)) {
              flushParagraph();
              const quote = [];
              while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
                quote.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
                index += 1;
              }
              output.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`);
              continue;
            }

            const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
            const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
            if (unordered || ordered) {
              flushParagraph();
              const tag = ordered ? 'ol' : 'ul';
              const items = [];
              const pattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-+*]\s+(.+)$/;
              while (index < lines.length) {
                const item = lines[index].match(pattern);
                if (!item) break;
                const task = item[1].match(/^\[([ xX])\]\s+(.+)$/);
                items.push(task ?
                  `<li><input type="checkbox" disabled${task[1].toLowerCase() === 'x' ? ' checked' : ''}>${renderInlineMarkdown(task[2])}</li>` :
                  `<li>${renderInlineMarkdown(item[1])}</li>`);
                index += 1;
              }
              output.push(`<${tag}>${items.join('')}</${tag}>`);
              continue;
            }

            paragraph.push(line);
            index += 1;
          }

          flushParagraph();
          return output.join('');
        }

        function addMessage(role, text, sources = []) {
          const wrap = document.createElement('div');
          wrap.className = `message ${role === 'me' ? 'me' : 'geoff'}`;
          const avatar = `<div class="message-avatar">${role === 'me' ? 'A' : 'G'}</div>`;
          const sourceHTML = sources.length ? `<div class="source-row">${sources.slice(0,4).map(s => `<a class="source-chip" href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.title || s.path)}</a>`).join('')}</div>` : '';
          const content = `<div class="message-content"><div class="message-meta">${role === 'me' ? 'You' : 'Geoff'} · ${time()}</div><div class="bubble">${role === 'me' ? escapeHTML(text) : renderGeoffText(text)}</div>${sourceHTML}</div>`;
          wrap.innerHTML = role === 'me' ? content + avatar : avatar + content;
          chat.appendChild(wrap);
          chat.scrollTop = chat.scrollHeight;
          return wrap;
        }

        function renderGeoffText(text) {
          return `<div class="markdown-body">${renderMarkdown(text)}</div>`;
        }

        function addTyping() {
          const wrap = document.createElement('div');
          wrap.className = 'message geoff';
          wrap.innerHTML = `<div class="message-avatar">G</div><div class="message-content"><div class="message-meta">Geoff · ${time()}</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>`;
          chat.appendChild(wrap);
          chat.scrollTop = chat.scrollHeight;
          return wrap;
        }

        function pageTitle(doc, url) {
          const h1 = doc.querySelector('h1');
          const title = h1 ? h1.textContent : doc.title || new URL(url).pathname;
          return normalise(title).replace(/\s+[|—-]\s+Molly\s*&\s*Shaina.*$/i, '');
        }

        function extractPage(html, url) {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          doc.querySelectorAll('script,style,noscript,svg,nav,footer').forEach(el => el.remove());
          const main = doc.querySelector('main') || doc.body;
          const text = normalise(main ? main.textContent : '');
          const headings = [...doc.querySelectorAll('h1,h2,h3')].map(h => normalise(h.textContent)).filter(Boolean);
          return {
            url,
            path: new URL(url).pathname,
            title: pageTitle(doc, url),
            text,
            headings,
            tokens: words(`${pageTitle(doc,url)} ${headings.join(' ')} ${text}`)
          };
        }

        async function getSitemapUrls() {
          try {
            const res = await fetch(`${SITE}/sitemap.xml`, {
              cache: 'no-store'
            });
            if (!res.ok) throw new Error('No sitemap');
            const xml = await res.text();
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            const urls = [...doc.querySelectorAll('loc')].map(n => n.textContent.trim()).filter(u => u.startsWith(SITE));
            return [...new Set(urls)].slice(0, MAX_PAGES);
          } catch {
            return FALLBACK_ROUTES.map(route => new URL(route, SITE).href);
          }
        }

        async function indexSite() {
          if (state.indexing) return;
          state.indexing = true;
          $('syncState').textContent = 'Reading public pages…';
          $('statusText').textContent = 'Indexing site…';

          const urls = await getSitemapUrls();
          const pages = [];

          // Small batches keep the browser responsive and avoid hammering the site.
          for (let i = 0; i < urls.length; i += 5) {
            const batch = urls.slice(i, i + 5);
            const results = await Promise.all(batch.map(async url => {
              try {
                const res = await fetch(url, {
                  cache: 'no-store'
                });
                if (!res.ok) throw new Error(String(res.status));
                const type = res.headers.get('content-type') || '';
                if (!type.includes('text/html')) throw new Error('Not HTML');
                return {
                  status: 'fulfilled',
                  value: extractPage(await res.text(), url)
                };
              } catch (error) {
                return {
                  status: 'rejected',
                  reason: error
                };
              }
            }));
            results.forEach(r => {
              if (r.status === 'fulfilled' && r.value.text.length > 40) pages.push(r.value);
            });
            $('pageCount').textContent = pages.length;
          }

          state.pages = pages;
          state.ready = pages.length > 0;
          state.indexing = false;
          const totalWords = pages.reduce((sum, p) => sum + p.tokens.length, 0);
          $('wordCount').textContent = totalWords > 999 ? `${(totalWords/1000).toFixed(1)}k` : totalWords;

          if (state.ready) {
            $('syncState').textContent = `Synced just now`;
            $('statusText').textContent = 'Geoff is online';
            $('chatSubtitle').textContent = `${pages.length} site pages searchable`;
          } else {
            $('syncState').textContent = 'Browser could not read site pages';
            $('statusText').textContent = 'Limited mode';
            $('chatSubtitle').textContent = 'Using built-in site knowledge';
          }
        }

        function scorePage(page, query) {
          const q = [...new Set(words(query).filter(w => w.length > 2))];
          if (!q.length) return 0;
          const title = page.title.toLowerCase();
          const path = page.path.toLowerCase();
          const headingText = page.headings.join(' ').toLowerCase();
          const text = page.text.toLowerCase();
          let score = 0;
          for (const term of q) {
            if (title.includes(term)) score += 18;
            if (path.includes(term)) score += 12;
            if (headingText.includes(term)) score += 8;
            const occurrences = text.split(term).length - 1;
            score += Math.min(occurrences, 8) * 2;
          }
          const phrase = normalise(query.toLowerCase());
          if (phrase.length > 5 && text.includes(phrase)) score += 30;
          return score;
        }

        function searchPages(query, limit = 5) {
          return state.pages
            .map(page => ({
              page,
              score: scorePage(page, query)
            }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(x => x.page);
        }

        function relevantSentences(page, query, limit = 2) {
          const terms = [...new Set(words(query).filter(w => w.length > 2))];
          const sentences = page.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
          return sentences
            .map(sentence => ({
              sentence: normalise(sentence),
              score: terms.reduce((n, t) => n + (sentence.toLowerCase().includes(t) ? 1 : 0), 0)
            }))
            .filter(x => x.sentence.length > 35 && x.sentence.length < 320)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(x => x.sentence);
        }

        function updateContext(matches) {
          const list = $('contextList');
          if (!matches.length) {
            list.innerHTML = '<li>No matching pages yet.</li>';
            return;
          }
          list.innerHTML = matches.slice(0, 6).map(p => `<li><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener">${escapeHTML(p.title || p.path)}</a></li>`).join('');
        }

        async function answer(query) {
          if (!state.ready && !state.indexing) {
            await indexSite();
          }

          const matches = searchPages(query, 6);
          updateContext(matches);

          const contextText = matches.slice(0, 4).map(page => {
            const useful = relevantSentences(page, query, 5);

            return `
            PAGE: ${page.title}
            URL: ${page.url}

            ${useful.join('\n')}
            `.trim();
          }).join('\n\n---\n\n');

          const response = await fetch('/api/geoff', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [{
                role: 'user',
                content: `
            My question:
            ${query}

            Relevant information retrieved from mollyandshaina.com:

            ${contextText || 'No relevant website information was found.'}

            Answer my question naturally using the website information when relevant.
            Use Markdown whenever it improves clarity, but do not over-format. Keep simple answers as short paragraphs; use headings, bold, italics, bold italics, links, GitHub-style tables, lists, blockquotes, inline code, fenced code blocks, strikethrough, horizontal rules, or safe HTML only when they genuinely help. Safe HTML such as <br>, <u>, <mark>, <kbd>, <details>, headings, lists, tables, links, and images can be rendered. Always write Markdown links in the standard form [label](URL), with no backticks or nested link syntax.
            If the website information cannot answer the question, say so honestly and offer this link: [Ask the human](/contact/).
            `.trim()
              }]
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Geoff failed to answer.');
          }

          return {
            text: data.answer,
            sources: matches.slice(0, 4)
          };
        }

        async function send(text) {
          text = text.trim();
          if (!text) return;

          prompt.value = '';
          trainingPassword.value = '';
          prompt.style.height = 'auto';

          if (text.toLowerCase() === '/retrain') {
            addMessage('me', text);
            await enterTrainingMode();
            return;
          }

          if (trainingState.active) {
            await handleTrainingInput(text);
            return;
          }

          document.querySelectorAll('[data-contact-link]').forEach(link => {
            link.href = `/contact/?question=${encodeURIComponent(text)}`;
          });

          addMessage('me', text);
          sendButton.disabled = true;

          const typing = addTyping();
          const started = performance.now();

          try {
            const result = await answer(text);

            const minimumTyping = 320;
            const delay = Math.max(
              0,
              minimumTyping - (performance.now() - started)
            );

            setTimeout(() => {
              typing.remove();
              addMessage('geoff', result.text, result.sources);
              sendButton.disabled = false;
              focusComposer();
            }, delay);

          } catch (error) {
            console.error(error);

            typing.remove();
            addMessage(
              'geoff',
              `Sorry — I couldn't reach my AI brain right now. Try again in a moment.`
            );

            sendButton.disabled = false;
            focusComposer();
          }
        }

        async function readApiResponse(response) {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
          return data;
        }

        async function fetchTrainingEntries() {
          const response = await fetch('/api/geoff-training', {
            method: 'GET',
            credentials: 'same-origin'
          });
          const data = await readApiResponse(response);
          trainingState.entries = Array.isArray(data.entries) ? data.entries : [];
          return trainingState.entries;
        }

        async function updateTraining(action, extra = {}) {
          const response = await fetch('/api/geoff-training', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action,
              ...extra
            })
          });
          const data = await readApiResponse(response);
          trainingState.entries = Array.isArray(data.entries) ? data.entries : [];
          return trainingState.entries;
        }

        function trainingHelp() {
          const count = trainingState.entries.length;
          return `### Retraining mode active

            Geoff currently has **${count} saved training note${count === 1 ? '' : 's'}**. Send one fact or instruction per message to teach him.

            - \`/list\` — show saved notes
            - \`Test: your question\` — test Geoff without saving it
            - \`/remove 2\` — remove note number 2
            - \`/clear confirm\` — erase every saved note
            - \`/done\` — leave retraining mode`;
        }

        function formatTrainingEntries() {
          if (!trainingState.entries.length) return '**No training notes have been saved yet.**';
          return `### Saved training notes\n\n${trainingState.entries.map((entry, index) => `${index + 1}. ${entry.text}`).join('\n')}`;
        }

        function leaveTrainingMode(message = 'Retraining mode closed. Geoff is ready to chat normally again.') {
          trainingState.active = false;
          trainingState.awaitingPassword = false;
          trainingState.entries = [];
          prompt.placeholder = defaultPromptPlaceholder;
          showPasswordComposer(false);
          addMessage('geoff', message);
        }

        async function enterTrainingMode() {
          trainingState.active = true;
          trainingState.awaitingPassword = false;
          sendButton.disabled = true;

          try {
            const response = await fetch('/api/geoff-training', {
              method: 'GET',
              credentials: 'same-origin'
            });

            if (response.status === 401) {
              trainingState.awaitingPassword = true;
              showPasswordComposer(true);
              addMessage('geoff', '### Admin authentication required\n\nEnter the site admin password to unlock retraining mode. Your password will be hidden in the conversation. Type `/done` to cancel.');
              return;
            }

            const data = await readApiResponse(response);
            trainingState.entries = Array.isArray(data.entries) ? data.entries : [];
            prompt.placeholder = 'Teach Geoff, or type Test: your question…';
            showPasswordComposer(false);
            addMessage('geoff', trainingHelp());
          } catch (error) {
            leaveTrainingMode(`**Retraining mode could not start:** ${error.message}`);
          } finally {
            sendButton.disabled = false;
            focusComposer();
          }
        }

        async function handleTrainingInput(text) {
          const command = text.toLowerCase();

          if (command === '/done') {
            addMessage('me', text);
            leaveTrainingMode();
            return;
          }

          sendButton.disabled = true;

          try {
            if (trainingState.awaitingPassword) {
              addMessage('me', '••••••••');
              const response = await fetch('/api/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  password: text
                })
              });
              await readApiResponse(response);
              trainingState.awaitingPassword = false;
              prompt.placeholder = 'Teach Geoff, or type Test: your question…';
              showPasswordComposer(false);
              await fetchTrainingEntries();
              addMessage('geoff', `**Authentication successful.**\n\n${trainingHelp()}`);
              return;
            }

            addMessage('me', text);

            if (command === '/list') {
              await fetchTrainingEntries();
              addMessage('geoff', formatTrainingEntries());
              return;
            }

            if (command === '/clear') {
              addMessage('geoff', 'That would erase every saved training note. Type `/clear confirm` to continue.');
              return;
            }

            if (command === '/clear confirm') {
              await updateTraining('clear');
              addMessage('geoff', '**All saved training notes were erased.** Retraining mode is still active.');
              return;
            }

            const testMatch = text.match(/^test:\s*([\s\S]+)$/i);
            if (testMatch) {
              const testContent = testMatch[1].trim();
              if (!testContent) throw new Error('Put something after `Test:` for Geoff to answer.');

              const typing = addTyping();
              try {
                const result = await answer(testContent);
                typing.remove();
                addMessage('geoff', `### Test response\n\n${result.text}\n\n---\n*This test was not saved as a training note. Retraining mode is still active.*`, result.sources);
              } catch (error) {
                typing.remove();
                throw error;
              }
              return;
            }

            const remove = command.match(/^\/remove\s+(\d+)$/);
            if (remove) {
              await fetchTrainingEntries();
              const index = Number(remove[1]) - 1;
              const entry = trainingState.entries[index];
              if (!entry) throw new Error('That training-note number does not exist. Use `/list` to see the current numbers.');
              await updateTraining('remove', {
                id: entry.id
              });
              addMessage('geoff', `Removed training note **${index + 1}**. Geoff now has **${trainingState.entries.length}** saved note${trainingState.entries.length === 1 ? '' : 's'}.`);
              return;
            }

            await updateTraining('add', {
              text
            });
            addMessage('geoff', `**Learned.** Geoff now has **${trainingState.entries.length}** saved training note${trainingState.entries.length === 1 ? '' : 's'}. Send another note or type \`/done\`.`);
          } catch (error) {
            addMessage('geoff', `**Training error:** ${error.message}`);
          } finally {
            sendButton.disabled = false;
            focusComposer();
          }
        }

        function resetChat() {
          trainingState.active = false;
          trainingState.awaitingPassword = false;
          trainingState.entries = [];
          prompt.placeholder = defaultPromptPlaceholder;
          showPasswordComposer(false);
          sendButton.disabled = false;
          chat.innerHTML = '';
          updateContext([]);
          addMessage('geoff', `Hi! I’m Geoff 🐾\n\nI’m connected to **mollyandshaina.com** and I’ll search the site before answering questions about Molly, Shaina, Poppy, comics, galleries, dog breeds, the arcade and more. What do you want to know?`);
          focusComposer();
        }

        form.addEventListener('submit', e => {
          e.preventDefault();
          send(composerValue());
        });
        prompt.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(prompt.value);
          }
        });
        trainingPassword.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            send(trainingPassword.value);
          }
        });
        prompt.addEventListener('input', () => {
          prompt.style.height = 'auto';
          prompt.style.height = `${Math.min(prompt.scrollHeight, 140)}px`;
        });
        $('suggestions').addEventListener('click', e => {
          if (trainingState.active) return;
          const b = e.target.closest('[data-prompt]');
          if (b) send(b.dataset.prompt);
        });
        $('newChat').addEventListener('click', resetChat);

        resetChat();
        indexSite();
      })();
