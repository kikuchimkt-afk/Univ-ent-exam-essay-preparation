// Practice page functionality
document.addEventListener('DOMContentLoaded', function () {
    const yearSelect = document.getElementById('yearSelect');
    const questionSelect = document.getElementById('questionSelect');
    const btnDisplay = document.getElementById('btnDisplay');
    const btnPrint = document.getElementById('btnPrint');
    const btnPrintWithAnswer = document.getElementById('btnPrintWithAnswer');
    const examDisplay = document.getElementById('examDisplay');

    if (!yearSelect || typeof EXAM_DATA === 'undefined') return;

    // Get unique years
    const years = [...new Set(EXAM_DATA.map(e => e.year))].sort().reverse();
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        yearSelect.appendChild(opt);
    });

    yearSelect.addEventListener('change', function () {
        questionSelect.innerHTML = '<option value="">大問を選択</option>';
        questionSelect.disabled = true;
        btnDisplay.disabled = true;
        btnPrint.disabled = true;
        btnPrintWithAnswer.disabled = true;
        if (!this.value) return;
        const filtered = EXAM_DATA.filter(e => e.year === this.value);
        filtered.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.id; opt.textContent = e.num;
            questionSelect.appendChild(opt);
        });
        questionSelect.disabled = false;
    });

    questionSelect.addEventListener('change', function () {
        btnDisplay.disabled = !this.value;
        btnPrint.disabled = !this.value;
        btnPrintWithAnswer.disabled = !this.value;
    });

    btnDisplay.addEventListener('click', () => renderExam(false));
    btnPrint.addEventListener('click', () => { renderExam(false); setTimeout(() => window.print(), 300); });
    btnPrintWithAnswer.addEventListener('click', () => { renderExam(true); setTimeout(() => window.print(), 300); });

    function renderExam(withAnswerArea) {
        const exam = EXAM_DATA.find(e => e.id === questionSelect.value);
        if (!exam) return;
        let html = '';

        // Header
        html += `<div class="exam-header">
      <h2>徳島大学 総合科学部 後期日程</h2>
      <div class="exam-meta">${exam.year} ｜ 小論文 ｜ ${exam.num}</div>
    </div>`;

        // Source
        if (exam.source) {
            let srcText = '';
            if (exam.source.author) {
                srcText = `【出典】${exam.source.author}『${exam.source.title}』（${exam.source.publisher}、${exam.source.year || ''}）`;
                if (exam.source.pages) srcText += ` ${exam.source.pages}`;
            } else if (exam.source.text_type) {
                srcText = `【出典】${exam.source.text_type}`;
            }
            if (exam.source.note) srcText += `<br><span style="font-size:0.82rem">※${exam.source.note}</span>`;
            html += `<div class="exam-source">${srcText}</div>`;
        }

        // Annotations
        if (exam.annotations) {
            html += `<div class="exam-source" style="border-left-color:var(--accent-peach);">`;
            exam.annotations.forEach(a => { html += `<p style="margin:0;font-size:0.85rem;">${a}</p>`; });
            html += `</div>`;
        }

        // Body text
        html += `<div class="exam-body"><h3 style="margin-bottom:16px;font-size:1rem;">【課題文】</h3>`;
        exam.body.forEach(p => {
            // Handle underline markup
            let text = escapeHtml(p);
            if (exam.questions) {
                exam.questions.forEach(q => {
                    if (q.underline && p.includes(q.underline)) {
                        const escaped = escapeHtml(q.underline);
                        text = text.replace(escaped, `<span class="underline-text">${escaped}</span>`);
                    }
                });
            }
            html += `<p>${text}</p>`;
        });
        html += `</div>`;

        // Table (for 2023-1)
        if (exam.table) {
            html += `<div class="exam-body" style="padding:20px 24px;">
        <h4 style="margin-bottom:12px;font-size:0.95rem;">${exam.table.title}</h4>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">${exam.table.note}</p>
        <table class="exam-table"><thead><tr>
          <th>順位</th><th>男子</th><th>割合</th><th>女子</th><th>割合</th>
        </tr></thead><tbody>`;
            exam.table.rows.forEach(r => {
                html += `<tr><td>${r.rank}</td><td>${r.male}</td><td>${r.mp}</td><td>${r.female}</td><td>${r.fp}</td></tr>`;
            });
            html += `</tbody></table></div>`;
        }

        // Case studies (for 2023-2)
        if (exam.caseStudies) {
            html += `<div class="exam-body" style="padding:24px;">
        <h3 style="margin-bottom:16px;font-size:1rem;">【資料】</h3>`;
            [exam.caseStudies.case1, exam.caseStudies.case2].forEach((cs, i) => {
                html += `<div class="case-study-box">
          <h4>資料${i + 1}：${cs.publisher}（${cs.date}）</h4>
          <p style="font-weight:600;margin-bottom:8px;font-size:0.92rem;">${cs.title}</p>
          <div class="cs-meta">【調査方法】${cs.method}</div>
          <div class="cs-body">${escapeHtml(cs.question)}</div>
        </div>`;
            });
            html += `</div>`;
        }

        // Questions
        html += `<div class="exam-questions"><h3>【設問】</h3>`;
        exam.questions.forEach(q => {
            html += `<div class="exam-question-item">
        <span class="q-num">${q.num}</span>
        <span class="q-text">${escapeHtml(q.text)}</span>
      </div>`;
        });
        html += `</div>`;

        // Answer areas
        if (withAnswerArea) {
            exam.questions.forEach(q => {
                const charMatch = q.text.match(/(\d+)字/);
                let height = 'answer-grid';
                if (charMatch) {
                    const chars = parseInt(charMatch[0]);
                    if (chars >= 800) height += ' answer-grid-1000';
                    else if (chars >= 400) height += ' answer-grid-600';
                }
                html += `<div class="answer-area">
          <h4>✍️ ${q.num} 解答欄</h4>
          <div class="${height}"></div>
          ${charMatch ? `<div class="char-count-label">${charMatch[0]}以内</div>` : ''}
        </div>`;
            });
        }

        examDisplay.innerHTML = html;
        examDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
