// ─────────────────────────────────────────────
// PDF / Health Report Exporter Service
// ─────────────────────────────────────────────

export interface HealthReportItem {
  type: string;
  value: string;
  unit: string;
  category?: string;
  date: string;
}

export const generateHealthReportHtml = (items: HealthReportItem[]): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #2C2C2C; color: #FFFFFF; font-weight: 600;">${item.type}</td>
        <td style="padding: 12px; border-bottom: 1px solid #2C2C2C; color: #4CAF50; font-weight: 700;">${item.value} ${item.unit}</td>
        <td style="padding: 12px; border-bottom: 1px solid #2C2C2C; color: #B0B0B0;">${item.category || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #2C2C2C; color: #888888; font-size: 12px;">${item.date}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FitMetrics Health Report</title>
        <style>
          body {
            background-color: #121212;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 32px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 28px;
            font-weight: 800;
            color: #4CAF50;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #A0A0A0;
            margin-top: 4px;
          }
          .report-date {
            font-size: 12px;
            color: #888888;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            background-color: #1E1E1E;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: #252525;
            color: #4CAF50;
            text-align: left;
            padding: 12px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #2C2C2C;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">FitMetrics</h1>
            <div class="subtitle">Official Health & Fitness Summary Report</div>
          </div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <h3>Recorded Calculation Metrics (${items.length} Entries)</h3>
        <table>
          <thead>
            <tr>
              <th>Calculator</th>
              <th>Result</th>
              <th>Category / Target</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #888888;">No historical records found.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          FitMetrics App • Personal Fitness Analytics & Calculation Summary
        </div>
      </body>
    </html>
  `;
};

/**
 * Trigger browser print/save as PDF or mobile print
 */
export const exportHealthReportPdf = (items: HealthReportItem[]): void => {
  const htmlContent = generateHealthReportHtml(items);

  if (typeof window !== 'undefined' && window.document) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
};
