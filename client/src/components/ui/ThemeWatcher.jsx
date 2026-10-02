import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../features/ui/uiSlice.js';

/** Redux theme → <html class="dark"> + localStorage persistence. */
export default function ThemeWatcher() {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('shopswift-theme', theme);
  }, [theme]);

  return null;
}
