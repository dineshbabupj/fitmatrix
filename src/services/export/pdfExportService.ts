import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { calculationsDb, workoutDb, mealDb } from '../../data/db';
import { revenueCatService } from '../iap/revenueCatService';

class PDFExportService {
  /**
   * Generate a 30-day FitMetrics Pro PDF Health & Fitness Report
   */
  public async generateReport(): Promise<boolean> {
    // Check Pro access for PDF Export
    const hasPro = await revenueCatService.hasProAccess();
    if (!hasPro) {
      return false;
    }

    try {
      const records = await calculationsDb.getAll();
      const workouts = await workoutDb.getAllWorkouts(30);

      const latestBmi = records.find((r) => r.type === 'BMI')?.result || 'N/A';
      const latestBmr = records.find((r) => r.type === 'BMR')?.result || 'N/A';
      const latestBf = records.find((r) => r.type === 'Body Fat')?.result || 'N/A';

      const workoutRowsHtml = workouts
        .map(
          (w) => `
        <tr>
          <td>${new Date(w.date).toLocaleDateString()}</td>
          <td>${w.title}</td>
          <td>${Math.round(w.duration_seconds / 60)} mins</td>
          <td>${Math.round(w.calories_burned || 0)} kcal</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #121212; color: #E0E0E0; padding: 24px; }
            h1 { color: #4CAF50; font-size: 26px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; }
            .header-info { margin-bottom: 20px; font-size: 14px; color: #9E9E9E; }
            .stats-grid { display: flex; gap: 16px; margin-bottom: 24px; }
            .stat-box { background: #1E1E1E; padding: 16px; border-radius: 8px; flex: 1; text-align: center; border: 1px solid #333; }
            .stat-val { font-size: 22px; font-weight: bold; color: #4CAF50; }
            .stat-lbl { font-size: 12px; color: #9E9E9E; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #1E1E1E; border-radius: 8px; overflow: hidden; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
            th { background: #2A2A2A; color: #4CAF50; font-size: 13px; text-transform: uppercase; }
            td { font-size: 13px; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #757575; }
          </style>
        </head>
        <body>
          <h1>FitMetrics Pro — 30-Day Fitness & Health Summary</h1>
          <div class="header-info">Generated on ${new Date().toLocaleDateString()} for Trainer/Personal Reference</div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-val">${latestBmi}</div>
              <div class="stat-lbl">Latest BMI</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${latestBmr}</div>
              <div class="stat-lbl">Latest BMR</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${latestBf}</div>
              <div class="stat-lbl">Body Fat %</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${workouts.length}</div>
              <div class="stat-lbl">Workouts Completed</div>
            </div>
          </div>

          <h2>Workout History Log</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Workout Title</th>
                <th>Duration</th>
                <th>Calories Burned</th>
              </tr>
            </thead>
            <tbody>
              ${workoutRowsHtml || '<tr><td colspan="4">No logged workouts in the last 30 days.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            FitMetrics Pro App • Medical Disclaimer: Health metrics are estimates for reference only.
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return true;
    } catch (e) {
      console.warn('[PDFExportService] Export error:', e);
      return false;
    }
  }
}

export const pdfExportService = new PDFExportService();
