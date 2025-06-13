// public/js/city-timezones.js

export const cityCandidatesByOffset = {
  // UTC+12 (720 minutes)
  720: [
    { timezone: 'Pacific/Auckland', city: 'Auckland (NZ)', type: 'dst', priority: 1 }, // NZDT (UTC+13) or NZST (UTC+12)
    { timezone: 'Pacific/Fiji', city: 'Suva (Fiji)', type: 'any', priority: 2 } // FJST (UTC+12) or FJDT (UTC+13)
  ],
  // UTC+11 (660 minutes)
  660: [
    { timezone: 'Pacific/Noumea', city: 'Noumea (New Caledonia)', type: 'any', priority: 1 },
    { timezone: 'Australia/Lord_Howe', city: 'Lord Howe Island (AUS)', type: 'dst', priority: 2 }, // LHDT is UTC+11
    { timezone: 'Pacific/Efate', city: 'Port Vila (Vanuatu)', type: 'any', priority: 3 }
  ],
  // UTC+10 (600 minutes)
  600: [
    { timezone: 'Australia/Sydney', city: 'Sydney (AUS)', type: 'dst', priority: 1 }, // AEDT (UTC+11) or AEST (UTC+10)
    { timezone: 'Australia/Brisbane', city: 'Brisbane (AUS)', type: 'any', priority: 2 }, // AEST (UTC+10) all year
    { timezone: 'Pacific/Guam', city: 'Hagåtña (Guam)', type: 'any', priority: 3 } // ChST (UTC+10) all year
  ],
  // UTC+9 (540 minutes)
  540: [
    { timezone: 'Asia/Tokyo', city: 'Tokyo (Japan)', type: 'any', priority: 1 },
    { timezone: 'Asia/Seoul', city: 'Seoul (South Korea)', type: 'any', priority: 2 }
  ],
  // UTC+8 (480 minutes)
  480: [
    { timezone: 'Asia/Shanghai', city: 'Shanghai (China)', type: 'any', priority: 1 },
    { timezone: 'Asia/Singapore', city: 'Singapore', type: 'any', priority: 2 },
    { timezone: 'Australia/Perth', city: 'Perth (AUS)', type: 'any', priority: 3 } // AWST (UTC+8) all year
  ],
  // UTC+7 (420 minutes)
  420: [
    { timezone: 'Asia/Bangkok', city: 'Bangkok (Thailand)', type: 'any', priority: 1 },
    { timezone: 'Asia/Jakarta', city: 'Jakarta (Indonesia)', type: 'any', priority: 2 } // WIB (UTC+7)
  ],
  // UTC+6 (360 minutes)
  360: [
    { timezone: 'Asia/Dhaka', city: 'Dhaka (Bangladesh)', type: 'any', priority: 1 },
    { timezone: 'Asia/Almaty', city: 'Almaty (Kazakhstan)', type: 'any', priority: 2 }
  ],
  // UTC+5 (300 minutes)
  300: [
    { timezone: 'Asia/Karachi', city: 'Karachi (Pakistan)', type: 'any', priority: 1 },
    { timezone: 'Asia/Yekaterinburg', city: 'Yekaterinburg (Russia)', type: 'any', priority: 2 }
  ],
  // UTC+4 (240 minutes)
  240: [
    { timezone: 'Asia/Dubai', city: 'Dubai (UAE)', type: 'any', priority: 1 },
    { timezone: 'Europe/Samara', city: 'Samara (Russia)', type: 'any', priority: 2 }
  ],
  // UTC+3 (180 minutes)
  180: [
    { timezone: 'Europe/Moscow', city: 'Moscow (Russia)', type: 'any', priority: 1 },
    { timezone: 'Africa/Nairobi', city: 'Nairobi (Kenya)', type: 'any', priority: 2 } // EAT (UTC+3)
  ],
  // UTC+2 (120 minutes)
  120: [
    { timezone: 'Europe/Berlin', city: 'Berlin (Germany)', type: 'dst', priority: 1 }, // CEST (UTC+2)
    { timezone: 'Africa/Cairo', city: 'Cairo (Egypt)', type: 'any', priority: 2 }, // EET (UTC+2) or EEST (UTC+3)
    { timezone: 'Africa/Johannesburg', city: 'Johannesburg (South Africa)', type: 'any', priority: 3 } // SAST (UTC+2)
  ],
  // UTC+1 (60 minutes)
  60: [
    { timezone: 'Europe/Paris', city: 'Paris (France)', type: 'std', priority: 1 }, // CET (UTC+1)
    { timezone: 'Europe/London', city: 'London (UK)', type: 'dst', priority: 2 }, // BST (UTC+1)
    { timezone: 'Africa/Algiers', city: 'Algiers (Algeria)', type: 'any', priority: 3 } // CET (UTC+1)
  ],
  // UTC+0 (0 minutes)
  0: [
    { timezone: 'Europe/London', city: 'London (UK)', type: 'std', priority: 1 }, // GMT (UTC+0)
    { timezone: 'Atlantic/Reykjavik', city: 'Reykjavik (Iceland)', type: 'any', priority: 2 }, // GMT all year
    { timezone: 'UTC', city: 'UTC', type: 'any', priority: 3 }
  ],
  // UTC-1 (-60 minutes)
  '-60': [
    { timezone: 'Atlantic/Azores', city: 'Azores (Portugal)', type: 'std', priority: 1 }, // AZOT (UTC-1) or AZOST (UTC+0)
    { timezone: 'Atlantic/Cape_Verde', city: 'Cape Verde', type: 'any', priority: 2 } // CVT (UTC-1)
  ],
  // UTC-2 (-120 minutes)
  '-120': [
    { timezone: 'America/Noronha', city: 'Fernando de Noronha (Brazil)', type: 'any', priority: 1 }, // FNT (UTC-2)
    { timezone: 'Atlantic/South_Georgia', city: 'South Georgia (UK)', type: 'any', priority: 2 } // GST (UTC-2)
  ],
  // UTC-3 (-180 minutes)
  '-180': [
    { timezone: 'America/Sao_Paulo', city: 'São Paulo (Brazil)', type: 'std', priority: 1 }, // BRT (UTC-3) or BRST (UTC-2)
    { timezone: 'America/Buenos_Aires', city: 'Buenos Aires (Argentina)', type: 'any', priority: 2 } // ART (UTC-3)
  ],
  // UTC-4 (-240 minutes)
  '-240': [
    { timezone: 'America/New_York', city: 'New York (USA)', type: 'dst', priority: 1 }, // EDT (UTC-4)
    { timezone: 'America/Halifax', city: 'Halifax (Canada)', type: 'std', priority: 2 }, // AST (UTC-4) or ADT (UTC-3)
    { timezone: 'America/La_Paz', city: 'La Paz (Bolivia)', type: 'any', priority: 3 } // BOT (UTC-4)
  ],
  // UTC-5 (-300 minutes)
  '-300': [
    { timezone: 'America/New_York', city: 'New York (USA)', type: 'std', priority: 1 }, // EST (UTC-5)
    { timezone: 'America/Chicago', city: 'Chicago (USA)', type: 'dst', priority: 2 }, // CDT (UTC-5)
    { timezone: 'America/Bogota', city: 'Bogotá (Colombia)', type: 'any', priority: 3 } // COT (UTC-5)
  ],
  // UTC-6 (-360 minutes)
  '-360': [
    { timezone: 'America/Chicago', city: 'Chicago (USA)', type: 'std', priority: 1 }, // CST (UTC-6)
    { timezone: 'America/Denver', city: 'Denver (USA)', type: 'dst', priority: 2 }, // MDT (UTC-6)
    { timezone: 'America/Mexico_City', city: 'Mexico City (Mexico)', type: 'any', priority: 3 } // CST (UTC-6) most of year
  ],
  // UTC-7 (-420 minutes)
  '-420': [
    { timezone: 'America/Denver', city: 'Denver (USA)', type: 'std', priority: 1 }, // MST (UTC-7)
    { timezone: 'America/Los_Angeles', city: 'Los Angeles (USA)', type: 'dst', priority: 2 }, // PDT (UTC-7)
    { timezone: 'America/Phoenix', city: 'Phoenix (USA)', type: 'any', priority: 3 } // MST (UTC-7) all year
  ],
  // UTC-8 (-480 minutes)
  '-480': [
    { timezone: 'America/Los_Angeles', city: 'Los Angeles (USA)', type: 'std', priority: 1 }, // PST (UTC-8)
    { timezone: 'America/Anchorage', city: 'Anchorage (USA)', type: 'dst', priority: 2 } // AKDT (UTC-8)
  ],
  // UTC-9 (-540 minutes)
  '-540': [
    { timezone: 'America/Anchorage', city: 'Anchorage (USA)', type: 'std', priority: 1 }, // AKST (UTC-9)
    { timezone: 'Pacific/Gambier', city: 'Gambier Islands (France)', type: 'any', priority: 2 } // GAMT (UTC-9)
  ],
  // UTC-10 (-600 minutes)
  '-600': [
    { timezone: 'Pacific/Honolulu', city: 'Honolulu (USA)', type: 'any', priority: 1 } // HST (UTC-10)
  ],
  // UTC-11 (-660 minutes)
  '-660': [
    { timezone: 'Pacific/Pago_Pago', city: 'Pago Pago (American Samoa)', type: 'any', priority: 1 }, // SST (UTC-11)
    { timezone: 'Pacific/Niue', city: 'Alofi (Niue)', type: 'any', priority: 2 } // NUT (UTC-11)
  ]
};