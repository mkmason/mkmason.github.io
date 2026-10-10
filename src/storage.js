// Keeps uploaded CSV files, manual entries and form settings between page visits.
// CSV files go in IndexedDB (no practical size limit); small values go in localStorage.
// Every call fails quietly (private windows, blocked storage) so pages still work.
const AppStorage = (() => {
  const DB_NAME = "mkmason-site";
  const STORE = "files";

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Saved files look like { name, text, savedAt }
  async function saveFile(key, name, text) {
    const record = { name, text, savedAt: new Date().toISOString() };
    try {
      await withStore("readwrite", (store) => store.put(record, key));
    } catch (error) {
      console.warn("Could not save file", error);
    }
    return record;
  }

  async function loadFile(key) {
    try {
      return (await withStore("readonly", (store) => store.get(key))) || null;
    } catch (error) {
      console.warn("Could not load saved file", error);
      return null;
    }
  }

  async function deleteFile(key) {
    try {
      await withStore("readwrite", (store) => store.delete(key));
    } catch (error) {
      console.warn("Could not delete saved file", error);
    }
  }

  function readFileInput(input) {
    return new Promise((resolve, reject) => {
      const file = input.files && input.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: reader.result });
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function getJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Could not save setting", error);
    }
  }

  // Restores the given inputs from storage and saves them whenever they change
  function persistFields(key, ids) {
    const saved = getJSON(key, {});
    ids.forEach((id) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (id in saved) {
        if (field.type === "checkbox") field.checked = saved[id];
        else field.value = saved[id];
      }
      field.addEventListener("change", () => {
        const current = getJSON(key, {});
        current[id] = field.type === "checkbox" ? field.checked : field.value;
        setJSON(key, current);
      });
    });
  }

  // Shows "Saved file: name" with a button to forget it
  function renderSavedFile(element, record, onClear) {
    element.textContent = "";
    if (!record) {
      element.hidden = true;
      return;
    }
    element.hidden = false;
    const label = document.createElement("span");
    const savedAt = new Date(record.savedAt).toLocaleString();
    label.innerHTML = "Using saved file <strong></strong> (saved " + savedAt + ")";
    label.querySelector("strong").textContent = record.name;
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ghost small";
    clear.textContent = "Forget file";
    clear.addEventListener("click", onClear);
    element.append(label, clear);
  }

  return { saveFile, loadFile, deleteFile, readFileInput, getJSON, setJSON, persistFields, renderSavedFile };
})();
