(function() {
  function getTheme() {
    return localStorage.getItem('smartmart_theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateToggleIcons(theme);
  }

  function updateToggleIcons(theme) {
    document.querySelectorAll('.theme-toggle-btn .theme-icon').forEach(icon => {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    });
  }

  // Initial application on script load to prevent FOUC
  const initialTheme = getTheme();
  applyTheme(initialTheme);

  // Expose toggle globally
  window.toggleTheme = function() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('smartmart_theme', newTheme);
    applyTheme(newTheme);
    
    // Dispatch an event so other UI components can react if needed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  // Ensure icons are updated once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    updateToggleIcons(getTheme());
  });
})();
