import { useEffect, useState } from 'react';

// A small reusable hook for reading and writing localStorage values.
// It keeps React state and browser storage in sync for local-first progress.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = window.localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : initialValue;
    } catch (error) {
      console.warn(`CodeQuest could not read ${key} from localStorage.`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`CodeQuest could not save ${key} to localStorage.`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
