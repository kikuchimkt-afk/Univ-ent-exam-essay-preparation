// Practice page functionality
document.addEventListener('DOMContentLoaded', function () {
    const yearSelect = document.getElementById('yearSelect');
    const questionSelect = document.getElementById('questionSelect');
    const btnDisplay = document.getElementById('btnDisplay');
    const btnPrint = document.getElementById('btnPrint');
    const btnPrintWithAnswer = document.getElementById('btnPrintWithAnswer');
    const btnShowGuide = document.getElementById('btnShowGuide');
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
        if (btnShowGuide) btnShowGuide.disabled = true;
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
        const hasValue = !!this.value;
        btnDisplay.disabled = !hasValue;
        btnPrint.disabled = !hasValue;
        btnPrintWithAnswer.disabled = !hasValue;
        if (btnShowGuide) {
            // Enable only if answer data exists
            const hasGuide = hasValue && typeof ANSWER_DATA !== 'undefined' && ANSWER_DATA[this.value];
            btnShowGuide.disabled = !hasGuide;
        }
    });

    btnDisplay.addEventListener('click', () => renderExam(false, false));
    btnPrint.addEventListener('click', () => { renderExam(false, false); setTimeout(() => window.print(), 300); });
    btnPrintWithAnswer.addEventListener('click', () => { renderExam(true, false); setTimeout(() => window.print(), 300); });
    if (btnShowGuide) {
        btnShowGuide.addEventListener('click', () => renderExam(false, true));
    }

    function renderExam(withAnswerArea, withGuide) {
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

        // Answer areas (横書き原稿用紙)
        if (withAnswerArea) {
            exam.questions.forEach(q => {
                // 字数制限を解析
                const charMatches = q.text.match(/(\d+)字/g);
                let maxChars = 200; // デフォルト
                let charLabel = '';
                if (charMatches) {
                    const nums = charMatches.map(m => parseInt(m));
                    maxChars = Math.max(...nums);
                    // 字数制限の表現を取得
                    const rangeMatch = q.text.match(/(\d+)字以上(\d+)字以内/);
                    const withinMatch = q.text.match(/(\d+)字以内/);
                    const rangeMatch2 = q.text.match(/(\d+)～(\d+)字/);
                    if (rangeMatch) charLabel = `${rangeMatch[1]}字以上${rangeMatch[2]}字以内`;
                    else if (rangeMatch2) charLabel = `${rangeMatch2[1]}～${rangeMatch2[2]}字`;
                    else if (withinMatch) charLabel = `${withinMatch[1]}字以内`;
                    else charLabel = `${maxChars}字`;
                }
                const colsPerRow = 20;
                const totalRows = Math.ceil(maxChars / colsPerRow);

                html += `<div class="answer-area">
          <div class="answer-area-header">
            <h4>✍️ ${q.num} 解答欄</h4>
            ${charLabel ? `<span class="answer-char-info">📏 ${charLabel}</span>` : ''}
          </div>
          ${buildManuscriptPaper(colsPerRow, totalRows)}
          <div class="ms-total-label">${colsPerRow}字 × ${totalRows}行 ＝ ${colsPerRow * totalRows}字</div>
        </div>`;
            });
        }

        // Guide & Model Answers
        if (withGuide && typeof ANSWER_DATA !== 'undefined' && ANSWER_DATA[exam.id]) {
            const ansData = ANSWER_DATA[exam.id];
            html += renderGuideSection(ansData, exam);
        }

        examDisplay.innerHTML = html;
        examDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderGuideSection(ansData, exam) {
        let html = '';

        // Theme info banner
        html += `<div class="guide-theme-banner">
      <div class="guide-theme-category">
        <span class="guide-theme-icon">📋</span>
        <span>テーマ系統：<strong>${ansData.themeCategory}</strong></span>
      </div>
      <div class="guide-theme-keywords">
        ${ansData.themeKeywords.map(k => `<span class="guide-keyword">${k}</span>`).join('')}
      </div>
    </div>`;

        // Each question's guide
        ansData.answers.forEach(ans => {
            html += `<div class="guide-section">`;

            // Section header
            html += `<div class="guide-section-header">
        <h3>📝 ${ans.qNum}：模範解答と指導マニュアル</h3>
        <div class="guide-meta">
          <span class="guide-type-badge">${ans.type}</span>
          <span class="guide-char-badge">${ans.charLimit}</span>
        </div>
      </div>`;

            // Model answer
            html += `<div class="guide-model-answer">
        <h4><span class="guide-icon">✅</span> 模範解答（${ans.charCount}字）</h4>
        <div class="guide-answer-text">${escapeHtml(ans.model).replace(/\n/g, '<br>')}</div>
      </div>`;

            // 4 Steps guide
            const steps = [ans.guide.step1_read, ans.guide.step2_focus, ans.guide.step3_reasons, ans.guide.step4_write];
            const stepColors = ['#7C6BC4', '#5B9BD5', '#70AD47', '#ED7D31'];
            const stepIcons = ['📖', '🎯', '💡', '✏️'];

            html += `<div class="guide-steps-container">
        <h4 class="guide-steps-title">📚 小論文4ステップ指導法</h4>`;

            steps.forEach((step, i) => {
                html += `<div class="guide-step" style="border-left-color:${stepColors[i]}">
          <div class="guide-step-header" style="color:${stepColors[i]}">
            <span class="guide-step-icon">${stepIcons[i]}</span>
            <span>${step.title}</span>
          </div>
          <ul class="guide-step-points">
            ${step.points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
        </div>`;
            });
            html += `</div>`;

            // Common mistakes
            html += `<div class="guide-mistakes">
        <h4><span class="guide-icon">⚠️</span> よくある間違い</h4>
        <ul class="guide-mistake-list">
          ${ans.guide.commonMistakes.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>`;

            // Teacher tips
            html += `<div class="guide-teacher-tips">
        <h4><span class="guide-icon">👨‍🏫</span> 講師向け指導アドバイス</h4>
        <ul class="guide-tips-list">
          ${ans.guide.teacherTips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>`;

            html += `</div>`; // .guide-section end
        });

        return html;
    }

    // 横書き原稿用紙を生成する関数
    function buildManuscriptPaper(cols, rows) {
        let html = '<div class="manuscript-paper">';

        // Column header (1, 2, 3, ... 20)
        html += '<div class="ms-col-header"><div class="ms-row-label"></div>';
        for (let c = 1; c <= cols; c++) {
            let cls = 'ms-col-num';
            if (c % 10 === 0) cls += ' ms-col-10';
            else if (c % 5 === 0) cls += ' ms-col-5';
            html += `<div class="${cls}">${c}</div>`;
        }
        html += '</div>';

        // Rows
        for (let r = 1; r <= rows; r++) {
            const cumulative = r * cols;
            let rowCls = 'ms-row';
            if (r % 10 === 0) rowCls += ' ms-row-10';
            else if (r % 5 === 0) rowCls += ' ms-row-5';

            html += `<div class="${rowCls}">`;
            html += `<div class="ms-row-label">${cumulative}</div>`;
            for (let c = 1; c <= cols; c++) {
                let cellCls = 'ms-cell';
                if (c % 10 === 0) cellCls += ' ms-cell-10';
                else if (c % 5 === 0) cellCls += ' ms-cell-5';
                html += `<div class="${cellCls}"></div>`;
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
