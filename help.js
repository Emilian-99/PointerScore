const search = document.querySelector("[data-help-search]");
const topics = [...document.querySelectorAll(".help-topic")];
const result = document.querySelector("[data-help-result]");
const empty = document.querySelector("[data-help-empty]");

function updateSearch() {
  const query = search.value.trim().toLocaleLowerCase(document.documentElement.lang);
  let visible = 0;
  topics.forEach((topic) => {
    const match = !query || topic.textContent.toLocaleLowerCase(document.documentElement.lang).includes(query);
    topic.hidden = !match;
    if (match) {
      visible += 1;
      if (query) topic.open = true;
    }
  });
  const english = document.documentElement.lang === "en";
  result.textContent = `${visible} ${english ? (visible === 1 ? "topic" : "topics") : (visible === 1 ? "Thema" : "Themen")}`;
  empty.hidden = visible !== 0;
}

search.addEventListener("input", updateSearch);
document.querySelector("[data-help-expand]").addEventListener("click", () => topics.filter((topic) => !topic.hidden).forEach((topic) => { topic.open = true; }));
document.querySelector("[data-help-collapse]").addEventListener("click", () => topics.filter((topic) => !topic.classList.contains("help-disclaimer-topic")).forEach((topic) => { topic.open = false; }));
window.addEventListener("pointerscore:languagechange", updateSearch);
updateSearch();
