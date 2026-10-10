// Toggle navbar dropdowns on click/tap (hover is handled in theme.css)
document.querySelectorAll(".navbar .dropdown-toggle").forEach((toggle) => {
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = toggle.parentElement;
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen);
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".navbar .dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
    dropdown.querySelector(".dropdown-toggle").setAttribute("aria-expanded", false);
  });
});

// Light/dark toggle at the end of the navbar
const themeToggle = document.createElement("button");
themeToggle.type = "button";
themeToggle.className = "theme-toggle";
function updateThemeToggle() {
  const dark = SiteTheme.isDark();
  themeToggle.textContent = dark ? "☀ Light" : "☾ Dark";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}
themeToggle.addEventListener("click", () => SiteTheme.toggle());
document.addEventListener("themechange", updateThemeToggle);
updateThemeToggle();
document.querySelector(".navbar nav").appendChild(themeToggle);
