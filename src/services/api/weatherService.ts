export interface WeatherInfo {
  temperatureC: number;
  weatherCode: number;
  condition: string;
  recommendation: string;
  isIndoorRecommended: boolean;
}

class WeatherService {
  /**
   * Fetch current weather from Open-Meteo Free API (No Auth)
   * Fallback to default coordinates (e.g. Chennai / General) if location not granted
   */
  public async getWeather(lat: number = 13.0827, lon: number = 80.2707): Promise<WeatherInfo> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      const current = data.current_weather || {};
      const temp = Math.round(current.temperature || 28);
      const code = current.weathercode || 0;

      let condition = 'Clear Sky';
      let isIndoorRecommended = false;
      let recommendation = '☀️ Perfect weather for an outdoor run or park workout!';

      // WMO Weather interpretation codes
      if (code >= 51 && code <= 99) {
        condition = 'Rain / Storm';
        isIndoorRecommended = true;
        recommendation = '🌧️ Rain expected outside! Great day for an indoor Gym or Push workout.';
      } else if (temp > 35) {
        condition = 'Extreme Heat';
        isIndoorRecommended = true;
        recommendation = '🔥 High temperature outside! Stay hydrated and prefer an AC indoor workout.';
      } else if (code >= 1 && code <= 3) {
        condition = 'Partly Cloudy';
        recommendation = '🌤️ Great weather for cycling or jogging today!';
      }

      return {
        temperatureC: temp,
        weatherCode: code,
        condition,
        recommendation,
        isIndoorRecommended,
      };
    } catch (e) {
      return {
        temperatureC: 28,
        weatherCode: 0,
        condition: 'Sunny',
        recommendation: '☀️ Great day for your fitness routine!',
        isIndoorRecommended: false,
      };
    }
  }
}

export const weatherService = new WeatherService();
