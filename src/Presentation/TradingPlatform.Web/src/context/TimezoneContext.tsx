import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface TimezoneOption {
  id: string; // e.g., 'UTC', 'America/New_York', 'Local'
  iana: string; // Resolved IANA timezone string
  label: string; // e.g., 'New York (NYSE / NASDAQ)'
  city: string; // e.g., 'New York'
  region: string; // e.g., 'Americas'
  flag: string; // emoji flag or symbol
  isPreset: boolean;
}

export interface MarketSession {
  name: string;
  city: string;
  isOpen: boolean;
  openUtcHour: number;
  openUtcMin: number;
  closeUtcHour: number;
  closeUtcMin: number;
}

export interface TimezoneContextValue {
  timezone: string;
  resolvedIana: string;
  setTimezone: (tz: string) => void;
  use24Hour: boolean;
  setUse24Hour: (use24: boolean) => void;
  now: Date;
  currentFormattedTime: string;
  currentFormattedDate: string;
  currentOffset: string;
  currentAbbr: string;
  activeTimezoneInfo: TimezoneOption;
  popularTimezones: TimezoneOption[];
  allTimezones: string[];
  marketSessions: MarketSession[];
  formatTime: (dateOrTimestamp: Date | string | number | undefined | null, options?: { withSeconds?: boolean; withAbbr?: boolean }) => string;
  formatDate: (dateOrTimestamp: Date | string | number | undefined | null) => string;
  formatDateTime: (dateOrTimestamp: Date | string | number | undefined | null, options?: { withSeconds?: boolean; withAbbr?: boolean }) => string;
}

const LOCAL_STORAGE_KEY_TZ = 'trading_platform_timezone';
const LOCAL_STORAGE_KEY_24H = 'trading_platform_use24hour';

const SYSTEM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  {
    id: 'UTC',
    iana: 'UTC',
    label: 'UTC (Universal Coordinated Time)',
    city: 'UTC',
    region: 'Global / Crypto / Forex Standard',
    flag: '🌐',
    isPreset: true,
  },
  {
    id: 'Local',
    iana: SYSTEM_TIMEZONE,
    label: `Local System Time (${SYSTEM_TIMEZONE})`,
    city: 'Local Computer',
    region: 'Device Clock',
    flag: '💻',
    isPreset: true,
  },
  {
    id: 'America/New_York',
    iana: 'America/New_York',
    label: 'New York (NYSE / NASDAQ)',
    city: 'New York',
    region: 'Americas',
    flag: '🇺🇸',
    isPreset: true,
  },
  {
    id: 'Europe/London',
    iana: 'Europe/London',
    label: 'London (LSE / Forex Fix)',
    city: 'London',
    region: 'Europe',
    flag: '🇬🇧',
    isPreset: true,
  },
  {
    id: 'Europe/Frankfurt',
    iana: 'Europe/Frankfurt',
    label: 'Frankfurt (XETRA / ECB)',
    city: 'Frankfurt',
    region: 'Europe',
    flag: '🇩🇪',
    isPreset: true,
  },
  {
    id: 'Asia/Tokyo',
    iana: 'Asia/Tokyo',
    label: 'Tokyo (Japan Exchange)',
    city: 'Tokyo',
    region: 'Asia-Pacific',
    flag: '🇯🇵',
    isPreset: true,
  },
  {
    id: 'Asia/Hong_Kong',
    iana: 'Asia/Hong_Kong',
    label: 'Hong Kong (HKEX)',
    city: 'Hong Kong',
    region: 'Asia-Pacific',
    flag: '🇭🇰',
    isPreset: true,
  },
  {
    id: 'Asia/Singapore',
    iana: 'Asia/Singapore',
    label: 'Singapore (SGX)',
    city: 'Singapore',
    region: 'Asia-Pacific',
    flag: '🇸🇬',
    isPreset: true,
  },
  {
    id: 'Australia/Sydney',
    iana: 'Australia/Sydney',
    label: 'Sydney (ASX)',
    city: 'Sydney',
    region: 'Australia',
    flag: '🇦🇺',
    isPreset: true,
  },
  {
    id: 'Africa/Johannesburg',
    iana: 'Africa/Johannesburg',
    label: 'Johannesburg (JSE)',
    city: 'Johannesburg',
    region: 'Africa',
    flag: '🇿🇦',
    isPreset: true,
  },
  {
    id: 'Asia/Dubai',
    iana: 'Asia/Dubai',
    label: 'Dubai (DFM / DIFC)',
    city: 'Dubai',
    region: 'Middle East',
    flag: '🇦🇪',
    isPreset: true,
  },
  {
    id: 'America/Chicago',
    iana: 'America/Chicago',
    label: 'Chicago (CME Futures / CBOE)',
    city: 'Chicago',
    region: 'Americas',
    flag: '🇺🇸',
    isPreset: true,
  },
  {
    id: 'America/Los_Angeles',
    iana: 'America/Los_Angeles',
    label: 'Los Angeles (US West)',
    city: 'Los Angeles',
    region: 'Americas',
    flag: '🇺🇸',
    isPreset: true,
  },
  {
    id: 'Asia/Kolkata',
    iana: 'Asia/Kolkata',
    label: 'Mumbai (NSE / BSE)',
    city: 'Mumbai',
    region: 'Asia-Pacific',
    flag: '🇮🇳',
    isPreset: true,
  },
  {
    id: 'Europe/Zurich',
    iana: 'Europe/Zurich',
    label: 'Zurich (SIX Swiss Exchange)',
    city: 'Zurich',
    region: 'Europe',
    flag: '🇨🇭',
    isPreset: true,
  },
];

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

function parseDate(input: Date | string | number | undefined | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === 'number') {
    // Check if seconds or milliseconds
    return input < 10000000000 ? new Date(input * 1000) : new Date(input);
  }
  return new Date(input);
}

export function getOffsetString(iana: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value.replace('GMT', 'UTC') : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getTimezoneAbbreviation(iana: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : 'UTC';
  } catch {
    return 'UTC';
  }
}

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timezone, setTimezoneState] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY_TZ) || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  const [use24Hour, setUse24HourState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_24H);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [now, setNow] = useState<Date>(new Date());

  // Ticking ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TZ, tz);
    } catch {
      // ignore
    }
  }, []);

  const setUse24Hour = useCallback((use24: boolean) => {
    setUse24HourState(use24);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_24H, String(use24));
    } catch {
      // ignore
    }
  }, []);

  const resolvedIana = useMemo(() => {
    if (timezone === 'Local') {
      return SYSTEM_TIMEZONE;
    }
    return timezone;
  }, [timezone]);

  const activeTimezoneInfo = useMemo<TimezoneOption>(() => {
    const found = POPULAR_TIMEZONES.find((p) => p.id === timezone);
    if (found) return found;
    return {
      id: timezone,
      iana: timezone,
      label: timezone.replace(/_/g, ' '),
      city: timezone.split('/').pop()?.replace(/_/g, ' ') || timezone,
      region: timezone.split('/')[0] || 'Custom',
      flag: '📍',
      isPreset: false,
    };
  }, [timezone]);

  const currentOffset = useMemo(() => getOffsetString(resolvedIana, now), [resolvedIana, now]);
  const currentAbbr = useMemo(() => getTimezoneAbbreviation(resolvedIana, now), [resolvedIana, now]);

  const allTimezones = useMemo<string[]>(() => {
    try {
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        return (Intl as any).supportedValuesOf('timeZone');
      }
    } catch {
      // ignore
    }
    return POPULAR_TIMEZONES.map((p) => p.iana);
  }, []);

  const formatTime = useCallback(
    (
      dateOrTimestamp: Date | string | number | undefined | null,
      options: { withSeconds?: boolean; withAbbr?: boolean } = { withSeconds: true, withAbbr: false }
    ) => {
      const d = parseDate(dateOrTimestamp);
      try {
        const timeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: resolvedIana,
          hour: '2-digit',
          minute: '2-digit',
          second: options.withSeconds !== false ? '2-digit' : undefined,
          hour12: !use24Hour,
        }).format(d);

        if (options.withAbbr) {
          const abbr = getTimezoneAbbreviation(resolvedIana, d);
          return `${timeStr} ${abbr}`;
        }
        return timeStr;
      } catch {
        return d.toLocaleTimeString();
      }
    },
    [resolvedIana, use24Hour]
  );

  const formatDate = useCallback(
    (dateOrTimestamp: Date | string | number | undefined | null) => {
      const d = parseDate(dateOrTimestamp);
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: resolvedIana,
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }).format(d);
      } catch {
        return d.toLocaleDateString();
      }
    },
    [resolvedIana]
  );

  const formatDateTime = useCallback(
    (
      dateOrTimestamp: Date | string | number | undefined | null,
      options: { withSeconds?: boolean; withAbbr?: boolean } = { withSeconds: true, withAbbr: true }
    ) => {
      const dateStr = formatDate(dateOrTimestamp);
      const timeStr = formatTime(dateOrTimestamp, options);
      return `${dateStr} ${timeStr}`;
    },
    [formatDate, formatTime]
  );

  const currentFormattedTime = useMemo(() => formatTime(now, { withSeconds: true }), [formatTime, now]);
  const currentFormattedDate = useMemo(() => formatDate(now), [formatDate, now]);

  // Major global financial market sessions (hours in UTC)
  const marketSessions = useMemo<MarketSession[]>(() => {
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const utcTotalMin = utcHour * 60 + utcMin;

    const checkOpen = (openH: number, openM: number, closeH: number, closeM: number) => {
      const start = openH * 60 + openM;
      const end = closeH * 60 + closeM;
      if (start < end) {
        return utcTotalMin >= start && utcTotalMin < end;
      }
      // Overnight session (crosses midnight UTC)
      return utcTotalMin >= start || utcTotalMin < end;
    };

    return [
      {
        name: 'London',
        city: 'Europe',
        openUtcHour: 8,
        openUtcMin: 0,
        closeUtcHour: 16,
        closeUtcMin: 30,
        isOpen: checkOpen(8, 0, 16, 30),
      },
      {
        name: 'New York',
        city: 'Americas',
        openUtcHour: 13,
        openUtcMin: 30,
        closeUtcHour: 20,
        closeUtcMin: 0,
        isOpen: checkOpen(13, 30, 20, 0),
      },
      {
        name: 'Tokyo',
        city: 'Asia',
        openUtcHour: 0,
        openUtcMin: 0,
        closeUtcHour: 9,
        closeUtcMin: 0,
        isOpen: checkOpen(0, 0, 9, 0),
      },
      {
        name: 'Sydney',
        city: 'Australia',
        openUtcHour: 21,
        openUtcMin: 0,
        closeUtcHour: 6,
        closeUtcMin: 0,
        isOpen: checkOpen(21, 0, 6, 0),
      },
    ];
  }, [now]);

  const value: TimezoneContextValue = {
    timezone,
    resolvedIana,
    setTimezone,
    use24Hour,
    setUse24Hour,
    now,
    currentFormattedTime,
    currentFormattedDate,
    currentOffset,
    currentAbbr,
    activeTimezoneInfo,
    popularTimezones: POPULAR_TIMEZONES,
    allTimezones,
    marketSessions,
    formatTime,
    formatDate,
    formatDateTime,
  };

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
};

export const useTimezone = (): TimezoneContextValue => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return ctx;
};
