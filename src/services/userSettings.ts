export interface UserSettings {
  notifications: {
    push: boolean;
    messages: boolean;
    grades: boolean;
    attendance: boolean;
    events: boolean;
    announcements: boolean;
  };
  display: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

const STORAGE_KEY = 'smartmadrassa_settings';

const defaultSettings: UserSettings = {
  notifications: {
    push: true,
    messages: true,
    grades: true,
    attendance: true,
    events: true,
    announcements: true,
  },
  display: {
    language: 'fr',
    theme: 'light',
  },
};

const sanitizeSettings = (value: unknown): UserSettings => {
  const raw = (value ?? {}) as Partial<UserSettings>;

  return {
    notifications: {
      push: raw.notifications?.push ?? defaultSettings.notifications.push,
      messages: raw.notifications?.messages ?? defaultSettings.notifications.messages,
      grades: raw.notifications?.grades ?? defaultSettings.notifications.grades,
      attendance: raw.notifications?.attendance ?? defaultSettings.notifications.attendance,
      events: raw.notifications?.events ?? defaultSettings.notifications.events,
      announcements:
        raw.notifications?.announcements ?? defaultSettings.notifications.announcements,
    },
    display: {
      language: raw.display?.language ?? defaultSettings.display.language,
      theme: raw.display?.theme ?? defaultSettings.display.theme,
    },
  };
};

export const loadUserSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return defaultSettings;
    }

    return sanitizeSettings(JSON.parse(saved));
  } catch {
    return defaultSettings;
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  const sanitized = sanitizeSettings(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
};
