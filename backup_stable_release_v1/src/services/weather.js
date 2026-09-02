// Weather Service using Open-Meteo Free API with offline/fallback simulation

export async function fetchLiveWeather(lat, lng, eventDateStr = null) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=16&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API network response failed");
    
    const data = await response.json();
    
    let targetTemp = null;
    let targetWeatherCode = null;
    let rainProb = 0;
    let foundDateForecast = false;

    if (eventDateStr && data.daily && Array.isArray(data.daily.time)) {
      const idx = data.daily.time.indexOf(eventDateStr);
      if (idx !== -1) {
        foundDateForecast = true;
        const maxT = Math.round(data.daily.temperature_2m_max[idx]);
        const minT = Math.round(data.daily.temperature_2m_min[idx]);
        targetTemp = `${minT}° / ${maxT}°C`;
        targetWeatherCode = data.daily.weathercode[idx];
        rainProb = data.daily.precipitation_probability_max[idx] || 0;
      }
    }

    // If event date is not in forecast range or not found, return "In aggiornamento"
    if (eventDateStr && !foundDateForecast) {
      return {
        temp: "--°C",
        icon: "🌤️",
        descIt: "Meteo in aggiornamento",
        descEn: "Forecast Updating Soon",
        wind: "-- km/h",
        rainProb: "--",
        isLive: false
      };
    }

    // Current weather fallback
    if (targetWeatherCode === null && data.current_weather) {
      targetWeatherCode = data.current_weather.weathercode;
      targetTemp = `${Math.round(data.current_weather.temperature)}°C`;
    }

    let icon = "☀️";
    let descIt = "Sereno";
    let descEn = "Clear";

    if (targetWeatherCode === 0) {
      icon = "☀️";
      descIt = "Sereno";
      descEn = "Sunny";
    } else if (targetWeatherCode >= 1 && targetWeatherCode <= 3) {
      icon = "⛅";
      descIt = "Poco Nuvoloso";
      descEn = "Partly Cloudy";
    } else if (targetWeatherCode >= 45 && targetWeatherCode <= 48) {
      icon = "🌫️";
      descIt = "Nebbia";
      descEn = "Foggy";
    } else if (targetWeatherCode >= 51 && targetWeatherCode <= 67) {
      icon = "🌧️";
      descIt = "Pioggia Leggera";
      descEn = "Light Rain";
    } else if (targetWeatherCode >= 80 && targetWeatherCode <= 99) {
      icon = "⛈️";
      descIt = "Temporale";
      descEn = "Thunderstorm";
    }

    return {
      temp: targetTemp || "20°C",
      icon,
      descIt,
      descEn,
      wind: data.current_weather ? `${Math.round(data.current_weather.windspeed)} km/h` : "10 km/h",
      rainProb: `${rainProb}%`,
      isLive: true
    };
  } catch (err) {
    return {
      temp: "--°C",
      icon: "🌤️",
      descIt: "Meteo in aggiornamento",
      descEn: "Forecast Updating Soon",
      wind: "-- km/h",
      rainProb: "--",
      isLive: false
    };
  }
}
