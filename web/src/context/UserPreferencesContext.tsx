import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BookmarkResourceType, BookmarksState, DisplayMode } from '../types';

interface UserPreferencesContextType {
  bookmarks: BookmarksState;
  isBookmarked: (type: BookmarkResourceType, id: number) => boolean;
  toggleBookmark: (type: BookmarkResourceType, id: number) => boolean; // returns new isBookmarked state
  removeBookmark: (type: BookmarkResourceType, id: number) => void;
  clearBookmarks: (type?: BookmarkResourceType) => void;
  totalBookmarks: number;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

const STORAGE_KEY_BOOKMARKS = 'am_vi_bookmarks';
const STORAGE_KEY_DISPLAY_MODE = 'am_vi_display_mode';

const DEFAULT_BOOKMARKS: BookmarksState = {
  dishes: [],
  chefs: [],
  ingredients: [],
};

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

function loadInitialBookmarks(): BookmarksState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (!raw) return DEFAULT_BOOKMARKS;
    const parsed = JSON.parse(raw);
    return {
      dishes: Array.isArray(parsed?.dishes) ? parsed.dishes.filter(Number.isInteger) : [],
      chefs: Array.isArray(parsed?.chefs) ? parsed.chefs.filter(Number.isInteger) : [],
      ingredients: Array.isArray(parsed?.ingredients) ? parsed.ingredients.filter(Number.isInteger) : [],
    };
  } catch {
    return DEFAULT_BOOKMARKS;
  }
}

function loadInitialDisplayMode(): DisplayMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISPLAY_MODE);
    if (raw === 'load_more' || raw === 'infinite' || raw === 'numbered') {
      return raw;
    }
    return 'numbered';
  } catch {
    return 'numbered';
  }
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarksState>(loadInitialBookmarks);
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(loadInitialDisplayMode);

  // Lưu bookmarks vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // bỏ qua lỗi nếu localStorage bị khóa (private mode...)
    }
  }, [bookmarks]);

  const setDisplayMode = (mode: DisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_DISPLAY_MODE, mode);
    } catch {
      // ignore
    }
  };

  const isBookmarked = (type: BookmarkResourceType, id: number): boolean => {
    return (bookmarks[type] || []).includes(id);
  };

  const toggleBookmark = (type: BookmarkResourceType, id: number): boolean => {
    let nextState = false;
    setBookmarks((prev) => {
      const current = prev[type] || [];
      const exists = current.includes(id);
      nextState = !exists;
      const updated = exists ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [type]: updated };
    });
    return nextState;
  };

  const removeBookmark = (type: BookmarkResourceType, id: number) => {
    setBookmarks((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((x) => x !== id),
    }));
  };

  const clearBookmarks = (type?: BookmarkResourceType) => {
    if (type) {
      setBookmarks((prev) => ({ ...prev, [type]: [] }));
    } else {
      setBookmarks(DEFAULT_BOOKMARKS);
    }
  };

  const totalBookmarks =
    bookmarks.dishes.length + bookmarks.chefs.length + bookmarks.ingredients.length;

  return (
    <UserPreferencesContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        clearBookmarks,
        totalBookmarks,
        displayMode,
        setDisplayMode,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextType {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error('useUserPreferences phải được dùng bên trong UserPreferencesProvider');
  }
  return ctx;
}
