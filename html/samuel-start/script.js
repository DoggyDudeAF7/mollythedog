const DEFAULT_COMPASS_CALENDAR_URL = "https://viewbank-vic.compass.education/download/sharedCalendar.aspx?uid=17620&key=e088e3ed-d1a1-42e5-9855-92ee71d58abf&c.ics";
const SETTINGS_KEY = "samuel-start-settings";
const CUSTOM_APPS_KEY = "samuel-start-custom-apps";

const fallbackEvents = [
  { timeLabel: "8:50", title: "Homeroom" },
  { timeLabel: "9:10", title: "Period 1" },
  { timeLabel: "11:20", title: "Period 2" },
  { timeLabel: "1:40", title: "Afternoon class" },
];

const defaults = {
  name: "Samuel",
  tagline: "Poppy is keeping the page simple.",
  location: "Viewbank, VIC",
  compass: DEFAULT_COMPASS_CALENDAR_URL,
  engine: "google",
  background: "",
};

const searchEngines = {
  google: "https://www.google.com/search",
  duckduckgo: "https://duckduckgo.com/",
  bing: "https://www.bing.com/search",
  brave: "https://search.brave.com/search",
};

const weatherCodes = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

const elements = {
  clock: document.querySelector("#clock"),
  date: document.querySelector("#date"),
  greeting: document.querySelector("#greeting"),
  name: document.querySelector("#name"),
  tagline: document.querySelector("#tagline"),
  search: document.querySelector("#search"),
  searchForm: document.querySelector(".search-bar"),
  eventList: document.querySelector("#event-list"),
  eventsStatus: document.querySelector("#events-status"),
  weatherTemp: document.querySelector("#weather-temperature"),
  weatherDescription: document.querySelector("#weather-description"),
  weatherLocation: document.querySelector("#weather-location"),
  forecast: document.querySelector("#forecast"),
  settings: document.querySelector("#settings"),
  settingsButton: document.querySelector("#settings-button"),
  settingsForm: document.querySelector("#settings-form"),
  settingName: document.querySelector("#setting-name"),
  settingTagline: document.querySelector("#setting-tagline"),
  settingLocation: document.querySelector("#setting-location"),
  settingCompass: document.querySelector("#setting-compass"),
  settingEngine: document.querySelector("#setting-engine"),
  backgroundFile: document.querySelector("#background-file"),
  backgroundPreview: document.querySelector("#background-preview"),
  removeBackground: document.querySelector("#remove-background"),
  bottomApps: document.querySelector(".bottom-apps"),
  addAppButton: document.querySelector("#add-app-button"),
  addAppDialog: document.querySelector("#add-app-dialog"),
  addAppForm: document.querySelector("#add-app-form"),
  addAppName: document.querySelector("#add-app-name"),
  addAppUrl: document.querySelector("#add-app-url"),
};

let savedSettings = loadSettings();

function loadSettings() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
    return { ...defaults };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
}

function updateAppIcon(link) {
  const icon = link.querySelector(".app-icon");

  if (!icon) {
    return;
  }

  icon.src = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(link.href)}&sz=64`;
}

const appLinkObserver = new MutationObserver((changes) => {
  changes.forEach((change) => updateAppIcon(change.target));
});

function watchAppLink(link) {
  updateAppIcon(link);
  appLinkObserver.observe(link, { attributes: true, attributeFilter: ["href"] });
}

function loadCustomApps() {
  try {
    const apps = JSON.parse(localStorage.getItem(CUSTOM_APPS_KEY) || "[]");
    return Array.isArray(apps) ? apps : [];
  } catch {
    localStorage.removeItem(CUSTOM_APPS_KEY);
    return [];
  }
}

function normaliseAppUrl(value) {
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Unsupported website address");
  }

  return url.href;
}

function addAppToDock(app) {
  const link = document.createElement("a");
  const icon = document.createElement("img");
  const label = document.createElement("small");

  link.href = app.url;
  icon.className = "app-icon";
  icon.alt = "";
  label.textContent = app.name;
  link.append(icon, label);
  elements.bottomApps.insertBefore(link, elements.addAppButton);
  watchAppLink(link);
}

document.querySelectorAll(".bottom-apps a").forEach(watchAppLink);
loadCustomApps().forEach(addAppToDock);

function updateTime() {
  const now = new Date();
  const hour = now.getHours();
  const dayPart = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  if (elements.greeting) {
    elements.greeting.textContent = `Good ${dayPart}`;
  }

  if (elements.clock) {
    elements.clock.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (elements.date) {
    elements.date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
}

function applySettings() {
  elements.name.textContent = savedSettings.name || defaults.name;
  elements.tagline.textContent = savedSettings.tagline || defaults.tagline;
  elements.weatherLocation.textContent = savedSettings.location || defaults.location;
  elements.searchForm.action = searchEngines[savedSettings.engine] || searchEngines.google;

  elements.settingName.value = savedSettings.name || defaults.name;
  elements.settingTagline.value = savedSettings.tagline || defaults.tagline;
  elements.settingLocation.value = savedSettings.location || defaults.location;
  elements.settingCompass.value = savedSettings.compass || defaults.compass;
  elements.settingEngine.value = savedSettings.engine || defaults.engine;

  applyBackground();
}

function applyBackground() {
  const image = savedSettings.background;
  const value = image ? `url("${image}")` : "none";

  document.documentElement.style.setProperty("--chosen-background", value);
  elements.backgroundPreview.style.backgroundImage = image ? value : "";
  elements.backgroundPreview.innerHTML = image ? "" : "<span>No image selected</span>";
}

async function geocodeLocation(locationName) {
  const query = encodeURIComponent(locationName);
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const place = data.results?.[0];

  if (!place) {
    throw new Error("Location not found");
  }

  return place;
}

async function loadWeather() {
  try {
    elements.weatherDescription.textContent = "Loading weather...";

    const place = await geocodeLocation(savedSettings.location || defaults.location);
    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: "temperature_2m,weather_code,precipitation",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "1",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

    if (!response.ok) {
      throw new Error(`Weather failed: ${response.status}`);
    }

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const high = Math.round(data.daily.temperature_2m_max[0]);
    const low = Math.round(data.daily.temperature_2m_min[0]);
    const rain = data.daily.precipitation_probability_max[0] ?? 0;
    const description = weatherCodes[data.current.weather_code] || "Current weather";

    elements.weatherTemp.innerHTML = `${temp}&deg;`;
    elements.weatherDescription.textContent = description;
    elements.weatherLocation.textContent = `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`;
    elements.forecast.replaceChildren(
      createForecastItem("Now", `${temp}&deg;`, description),
      createForecastItem("High", `${high}&deg;`, "Today"),
      createForecastItem("Low", `${low}&deg;`, "Tonight"),
      createForecastItem("Rain", `${rain}%`, "Chance"),
    );
  } catch {
    elements.weatherTemp.innerHTML = "--&deg;";
    elements.weatherDescription.textContent = "Weather could not load";
    elements.forecast.replaceChildren(
      createForecastItem("Now", "--&deg;", "Unavailable"),
      createForecastItem("High", "--&deg;", "Unavailable"),
      createForecastItem("Low", "--&deg;", "Unavailable"),
      createForecastItem("Rain", "--%", "Unavailable"),
    );
  }
}

function createForecastItem(label, value, detail) {
  const item = document.createElement("div");
  const labelElement = document.createElement("span");
  const valueElement = document.createElement("b");
  const detailElement = document.createElement("small");

  labelElement.textContent = label;
  valueElement.innerHTML = value;
  detailElement.textContent = detail;
  item.append(labelElement, valueElement, detailElement);

  return item;
}

function unfoldCalendarText(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function getCalendarValue(eventText, propertyName) {
  const line = eventText
    .split(/\r?\n/)
    .find((item) => item.startsWith(`${propertyName}:`) || item.startsWith(`${propertyName};`));

  return line ? line.slice(line.indexOf(":") + 1).trim() : "";
}

function cleanCalendarText(value) {
  return value
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCalendarDate(value) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = match;
  const values = [
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ];

  return utc ? new Date(Date.UTC(...values)) : new Date(...values);
}

function isToday(dateValue) {
  const now = new Date();

  return (
    dateValue.getFullYear() === now.getFullYear() &&
    dateValue.getMonth() === now.getMonth() &&
    dateValue.getDate() === now.getDate()
  );
}

function formatEventTime(dateValue) {
  return dateValue.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseCompassEvents(calendarText) {
  return unfoldCalendarText(calendarText)
    .split("BEGIN:VEVENT")
    .slice(1)
    .map((eventText) => {
      const start = parseCalendarDate(getCalendarValue(eventText, "DTSTART"));
      const summary = cleanCalendarText(getCalendarValue(eventText, "SUMMARY"));

      return start && summary
        ? {
            start,
            timeLabel: formatEventTime(start),
            title: summary,
          }
        : null;
    })
    .filter((event) => event && isToday(event.start))
    .sort((first, second) => first.start - second.start);
}

function renderEvents(events) {
  elements.eventList.replaceChildren(
    ...events.map((event) => {
      const item = document.createElement("li");
      const eventTime = document.createElement("time");
      const eventTitle = document.createElement("span");

      eventTime.textContent = event.timeLabel;
      eventTitle.textContent = event.title;
      item.append(eventTime, eventTitle);

      return item;
    }),
  );
}

async function loadCompassEvents() {
  const calendarUrl = savedSettings.compass || defaults.compass;

  if (!calendarUrl) {
    renderEvents(fallbackEvents);
    elements.eventsStatus.textContent = "Add your Compass calendar link in customise.";
    return;
  }

  try {
    const response = await fetch(calendarUrl);

    if (!response.ok) {
      throw new Error(`Calendar request failed: ${response.status}`);
    }

    const calendarText = await response.text();
    const todayEvents = parseCompassEvents(calendarText);

    if (todayEvents.length === 0) {
      renderEvents([{ timeLabel: "--", title: "No more Compass events today" }]);
      elements.eventsStatus.textContent = "Compass is connected.";
      return;
    }

    renderEvents(todayEvents.slice(0, 6));
    elements.eventsStatus.textContent = "Loaded from Compass.";
  } catch {
    renderEvents(fallbackEvents);
    elements.eventsStatus.textContent = "Compass could not load in this browser.";
  }
}

elements.settingsButton?.addEventListener("click", () => {
  elements.settings.showModal();
});

elements.addAppButton?.addEventListener("click", () => {
  elements.addAppForm.reset();
  elements.addAppUrl.setCustomValidity("");
  elements.addAppDialog.showModal();
  elements.addAppName.focus();
});

elements.addAppForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  let url;

  try {
    url = normaliseAppUrl(elements.addAppUrl.value.trim());
    elements.addAppUrl.setCustomValidity("");
  } catch {
    elements.addAppUrl.setCustomValidity("Enter a valid website address.");
    elements.addAppUrl.reportValidity();
    return;
  }

  const app = {
    name: elements.addAppName.value.trim(),
    url,
  };
  const customApps = loadCustomApps();

  customApps.push(app);
  localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(customApps));
  addAppToDock(app);
  elements.addAppDialog.close();
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.close}`)?.close();
  });
});

elements.backgroundFile?.addEventListener("change", () => {
  const file = elements.backgroundFile.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    savedSettings.background = reader.result;
    saveSettings();
    applyBackground();
  });
  reader.readAsDataURL(file);
});

elements.removeBackground?.addEventListener("click", () => {
  savedSettings.background = "";
  saveSettings();
  applyBackground();
});

elements.settingsForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  savedSettings.name = elements.settingName.value.trim() || defaults.name;
  savedSettings.tagline = elements.settingTagline.value.trim() || defaults.tagline;
  savedSettings.location = elements.settingLocation.value.trim() || defaults.location;
  savedSettings.compass = elements.settingCompass.value.trim();
  savedSettings.engine = elements.settingEngine.value;

  saveSettings();
  applySettings();
  loadWeather();
  loadCompassEvents();
  elements.settings.close();
});

updateTime();
setInterval(updateTime, 1000);
applySettings();
loadWeather();
loadCompassEvents();
elements.search?.focus();
