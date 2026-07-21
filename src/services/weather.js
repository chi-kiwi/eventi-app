// Weather Service using Open-Meteo Free API with offline/fallback simulation

export async function fetchLiveWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability,relative_humidity_2m`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API network response failed");
    
    const data = await response.json();
    const current = data.current_weather;
    const temp = Math.round(current.temperature);
    const wind = Math.round(current.windspeed);
    const weatherCode = current.weathercode;
    
    // Map WMO weather codes to emojis & text
    let icon = "☀️";
    let descIt = "Sereno";
    let descEn = "Clear";
    let rainProb = 0;

    if (data.hourly && data.hourly.precipitation_probability) {
      rainProb = data.hourly.precipitation_probability[0] || 0;
    }

    if (weatherCode === 0) {
      icon = "☀️";
      descIt = "Sereno";
      descEn = "Sunny";
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      icon = "⛅";
      descIt = "Poco Nuvoloso";
      descEn = "Partly Cloudy";
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      icon = "🌫️";
      descIt = "Nebbia";
      descEn = "Foggy";
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      icon = "🌧️";
      descIt = "Pioggia Leggera";
      descEn = "Light Rain";
    } else if (weatherCode >= 80 && weatherCode <= 99) {
      icon = "⛈️";
      descIt = "Temporale";
      descEn = "Thunderstorm";
    }

    return {
      temp: `${temp}°C`,
      icon,
      descIt,
      descEn,
      wind: `${wind} km/h`,
      rainProb: `${rainProb}%`,
      isLive: true
    };
  } catch (err) {
    console.warn("Weather API fallback active:", err);
    // Fallback simulation if offline or network failure
    return {
      temp: "23°C",
      icon: "☀️",
      descIt: "Sereno",
      descEn: "Clear",
      wind: "10 km/h",
      rainProb: "5%",
      isLive: false
    };
  }
}
