const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-1.5-flash';

export interface SymptomReport {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  possibleConditions: string[];
  summary: string;
  recommendations: string;
  isAiPowered: boolean;
}

class GeminiService {
  /**
   * Evaluates user's symptoms and returns structured diagnostic triage advice
   */
  public async analyzeSymptoms(symptomsText: string): Promise<SymptomReport> {
    const cleanInput = symptomsText.trim();
    if (!cleanInput) {
      return this.getLocalFallbackReport('No symptoms entered');
    }

    if (!GEMINI_API_KEY) {
      console.log('[GeminiService] Gemini API key not found. Using local diagnostics fallback.');
      return this.getLocalFallbackReport(cleanInput);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const promptText = `
You are a medical triage assistant. You must analyze the following user symptoms description and provide a structured safety triage assessment.
CRITICAL SAFETY RULE: You are not a doctor. If the symptoms indicate potentially life-threatening conditions (e.g. chest pain, severe shortness of breath, confusion, sudden numbness), you MUST label the riskLevel as HIGH and recommend immediate emergency care (911 or nearest ER).
Otherwise, classify riskLevel as MEDIUM or LOW accordingly.

User Symptoms Description: "${cleanInput}"

Analyze carefully and return exactly a JSON object conforming to this schema:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "possibleConditions": ["condition 1", "condition 2", ...],
  "summary": "Concise summary of what might be happening.",
  "recommendations": "Detailed safety recommendations and whether to see a doctor or seek home care."
}
`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        console.warn('[GeminiService] API response error:', response.status);
        return this.getLocalFallbackReport(cleanInput);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return this.getLocalFallbackReport(cleanInput);
      }

      const parsed = JSON.parse(text);
      return {
        riskLevel: parsed.riskLevel || 'LOW',
        possibleConditions: Array.isArray(parsed.possibleConditions) ? parsed.possibleConditions : ['General Malaise'],
        summary: parsed.summary || 'General health consultation suggested.',
        recommendations: parsed.recommendations || 'Rest and stay hydrated. Consult a doctor if symptoms persist.',
        isAiPowered: true,
      };
    } catch (error) {
      console.warn('[GeminiService] API Exception:', error);
      return this.getLocalFallbackReport(cleanInput);
    }
  }

  /**
   * Local rule-based offline fallback when API key is missing or calls fail
   */
  public getLocalFallbackReport(symptomsText: string): SymptomReport {
    const input = symptomsText.toLowerCase();

    // High risk triggers
    const highRiskWords = [
      'chest pain', 'breathing difficulty', 'difficulty breathing', 'shortness of breath',
      'stroke', 'heart attack', 'unconscious', 'seizure', 'severe bleeding',
      'numbness', 'confusion', 'sudden weakness'
    ];

    // Medium risk triggers
    const medRiskWords = [
      'fever', 'vomiting', 'diarrhea', 'migraine', 'abdominal pain', 'stomach ache',
      'infection', 'influenza', 'flu', 'coughing blood', 'asthma'
    ];

    const hasHigh = highRiskWords.some(word => input.includes(word));
    const hasMed = medRiskWords.some(word => input.includes(word));

    if (hasHigh) {
      return {
        riskLevel: 'HIGH',
        possibleConditions: ['Acute Cardiac/Respiratory Event', 'Neurological Warning Sign'],
        summary: 'Detected high-risk triggers matching critical warning symptoms.',
        recommendations: '⚠️ IMMEDIATELY seek emergency medical care or visit the nearest ER. Do not wait for symptoms to worsen.',
        isAiPowered: false,
      };
    }

    if (hasMed) {
      return {
        riskLevel: 'MEDIUM',
        possibleConditions: ['Viral Infection / Influenza', 'Gastrointestinal Distress', 'Severe Headache'],
        summary: 'Symptoms indicate potential moderate illness requiring monitoring.',
        recommendations: 'Monitor temperature and vitals. Seek professional medical consultation if symptoms persist beyond 48 hours or intensify.',
        isAiPowered: false,
      };
    }

    // Default low risk
    return {
      riskLevel: 'LOW',
      possibleConditions: ['Mild Common Cold', 'Physical Fatigue', 'Mild Muscle Soreness'],
      summary: 'Symptoms suggest a mild, self-limiting condition.',
      recommendations: 'Ensure plenty of rest, hydration, and nutritional support. Use OTC remedies if appropriate. Consult a doctor if symptoms remain after 3-5 days.',
      isAiPowered: false,
    };
  }

  /**
   * Local interactive symptom matrix calculation logic for the custom wizard questionnaire
   */
  public calculateTriageFromWizard(selections: {
    primarySymptom: string;
    duration: string;
    severeSigns: string[];
  }): SymptomReport {
    const { primarySymptom, duration, severeSigns } = selections;
    
    // High risk if any severe sign is selected
    if (severeSigns.length > 0 && !severeSigns.includes('none')) {
      return {
        riskLevel: 'HIGH',
        possibleConditions: [
          `Severe ${primarySymptom} Complication`,
          'Acute Inflammatory Response'
        ],
        summary: `Symptoms accompanied by severe signs: ${severeSigns.join(', ')}.`,
        recommendations: '⚠️ HIGH RISK. Please seek professional medical evaluation immediately or visit the nearest urgent care facility.',
        isAiPowered: false,
      };
    }

    // Medium risk if symptoms last > 3 days or medium primary symptoms
    const isLongDuration = duration === 'more_3_days';
    const isMediumSymptom = ['fever', 'stomach_pain'].includes(primarySymptom);

    if (isLongDuration || isMediumSymptom) {
      return {
        riskLevel: 'MEDIUM',
        possibleConditions: [
          primarySymptom === 'fever' ? 'Moderate Viral / Bacterial Infection' : `${primarySymptom.replace('_', ' ')} Irritation`,
          'Prolonged Systemic Fatigue'
        ],
        summary: `Moderate symptoms active for ${duration === '1_3_days' ? '1 to 3 days' : 'more than 3 days'}.`,
        recommendations: 'Schedule a general physician visit. Rest, drink plenty of warm fluids, and track symptom progression.',
        isAiPowered: false,
      };
    }

    // Low risk default
    return {
      riskLevel: 'LOW',
      possibleConditions: [
        `Mild Tension ${primarySymptom}`,
        'Seasonal Allergies',
        'Physical Exhaustion'
      ],
      summary: 'Short-duration mild symptoms with zero warning signs.',
      recommendations: 'Get restful sleep, ensure good hydration, and avoid strenuous activity. Standard home care is advised.',
      isAiPowered: false,
    };
  }
}

export const geminiService = new GeminiService();
