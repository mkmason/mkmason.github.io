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
