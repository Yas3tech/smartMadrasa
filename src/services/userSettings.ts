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

export const USER_SETTINGS_STORAGE_KEY = 'smartmadrassa_settings';
export const USER_SETTINGS_CHANGED_EVENT = 'smartmadrassa_settings_changed';

export const defaultUserSettings: UserSettings = {
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

export const loadUserSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (!saved) return defaultUserSettings;

    const parsed = JSON.parse(saved) as Partial<UserSettings>;
    return {
      notifications: {
        ...defaultUserSettings.notifications,
        ...parsed.notifications,
      },
      display: {
        ...defaultUserSettings.display,
        ...parsed.display,
      },
    };
  } catch {
    return defaultUserSettings;
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(USER_SETTINGS_CHANGED_EVENT));
};
