const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector("#chat-messages");
const chatStatus = document.querySelector("#chat-status");

function addChatMessage(message, sender = "") {
  const bubble = document.createElement("div");
  bubble.className = `chat-message${sender ? ` ${sender}` : ""}`;
  const text = document.createElement("p");
  text.textContent = message;
  bubble.append(text);
  chatMessages.append(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function replyToMessage(message) {
  const normalized = message.toLocaleLowerCase("pt-BR");

  if (normalized.includes("ansios") || normalized.includes("ansiedad") || normalized.includes("medo")) {
    return "Parece que tem bastante coisa pesando aí. Deve ser cansativo. Quer me contar o que está ocupando mais espaço agora?";
  }

  if (normalized.includes("trist") || normalized.includes("difícil") || normalized.includes("dificil")) {
    return "Sinto muito que hoje esteja sendo difícil. Você não precisa resolver tudo agora. O que gostaria que alguém entendesse sobre esse momento?";
  }

  return "Obrigado por dividir isso. Não precisa encontrar uma resposta agora. O que você sente que seria mais importante neste momento?(Apenas se repete em caso de palavra não pré-programada porque não é IA de verdade ;-;)";
}

function sendChatMessage(message) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    chatStatus.textContent = "Escreva uma mensagem ou escolha uma sugestão.";
    return;
  }

  addChatMessage(trimmedMessage, "user");
  chatInput.value = "";
  chatStatus.textContent = "Resposta de demonstração.";
  addChatMessage(replyToMessage(trimmedMessage));
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendChatMessage(chatInput.value);
});

document.querySelectorAll("[data-chat-prompt]").forEach((button) => {
  button.addEventListener("click", () => sendChatMessage(button.dataset.chatPrompt));
});

const journalKey = "mental-life-journal";
const journalForm = document.querySelector("#journal-form");
const journalDate = document.querySelector("#journal-date");
const journalSummary = document.querySelector("#journal-summary");
const journalEntriesList = document.querySelector("#journal-entries");
const journalStatus = document.querySelector("#journal-status");
let journalEntries = [];

function localDateValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function loadStoredList(key) {
  const value = localStorage.getItem(key);
  if (!value) return [];
  const parsedValue = JSON.parse(value);
  if (!Array.isArray(parsedValue)) throw new Error("Os dados salvos não estão no formato esperado.");
  return parsedValue;
}

function renderJournal() {
  journalEntriesList.replaceChildren();
  journalSummary.replaceChildren();

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 6);
  const cutoffValue = localDateValue(cutoff);
  const recentEntries = journalEntries.filter((entry) => entry.date >= cutoffValue);
  const moodCounts = new Map();
  recentEntries.forEach((entry) => moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1));

  const summaryText = document.createElement("p");
  if (recentEntries.length === 0) {
    summaryText.textContent = "Quando tiver alguns registros, você poderá notar quais sentimentos apareceram mais nos últimos 7 dias.";
  } else {
    const mostFrequentMood = [...moodCounts.entries()].sort((first, second) => second[1] - first[1])[0];
    summaryText.textContent = `Nos últimos 7 dias, você registrou ${recentEntries.length} ${recentEntries.length === 1 ? "dia" : "dias"}. O sentimento que mais marcou foi ${mostFrequentMood[0]} (${mostFrequentMood[1]} ${mostFrequentMood[1] === 1 ? "vez" : "vezes"}). É só um retrato das suas anotações, não uma avaliação.`;
  }
  journalSummary.append(summaryText);

  journalEntries.slice(0, 10).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "journal-entry";
    const date = document.createElement("time");
    date.dateTime = entry.date;
    date.textContent = new Date(`${entry.date}T00:00:00`).toLocaleDateString("pt-BR");
    const mood = document.createElement("strong");
    mood.textContent = entry.mood;
    item.append(date, mood);
    if (entry.note) {
      const note = document.createElement("span");
      note.textContent = ` — ${entry.note}`;
      item.append(note);
    }
    journalEntriesList.append(item);
  });
}

try {
  journalEntries = loadStoredList(journalKey);
  renderJournal();
} catch {
  journalStatus.textContent = "Não foi possível ler os registros salvos neste navegador.";
}

journalDate.value = localDateValue(new Date());

journalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(journalForm);
  const newEntry = {
    date: formData.get("date"),
    mood: formData.get("mood"),
    note: formData.get("note").trim(),
  };
  const updatedEntries = [newEntry, ...journalEntries].sort((first, second) => second.date.localeCompare(first.date));

  try {
    localStorage.setItem(journalKey, JSON.stringify(updatedEntries));
    journalEntries = updatedEntries;
    renderJournal();
    journalForm.elements.note.value = "";
    journalStatus.textContent = "Anotado neste dispositivo. Obrigado por se ouvir.";
  } catch {
    journalStatus.textContent = "Não foi possível salvar. Confira o espaço disponível no navegador e tente novamente.";
  }
});

document.querySelector("#journal-clear").addEventListener("click", () => {
  if (journalEntries.length === 0) {
    journalStatus.textContent = "Não há registros para apagar.";
    return;
  }

  try {
    localStorage.removeItem(journalKey);
    journalEntries = [];
    renderJournal();
    journalStatus.textContent = "Seus registros foram apagados deste navegador.";
  } catch {
    journalStatus.textContent = "Não foi possível apagar os registros salvos.";
  }
});

const planKey = "mental-life-safety-plan";
const planForm = document.querySelector("#plan-form");
const savedPlan = document.querySelector("#saved-plan");
const planStatus = document.querySelector("#plan-status");

function renderPlan(plan) {
  savedPlan.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = "Meu lembrete para dias difíceis";
  const steps = document.createElement("ol");

  const contactStep = document.createElement("li");
  contactStep.append(document.createTextNode("Posso chamar "));
  const contactLink = document.createElement("a");
  contactLink.href = `tel:${plan.phone.replace(/[^\d+]/g, "")}`;
  contactLink.textContent = `${plan.contact} (${plan.phone})`;
  contactStep.append(contactLink, document.createTextNode("."));

  const placeStep = document.createElement("li");
  placeStep.textContent = `Posso ir para: ${plan.place}.`;

  const anchorStep = document.createElement("li");
  anchorStep.textContent = `Uma frase que quero lembrar: “${plan.anchor}”`;

  steps.append(contactStep, placeStep, anchorStep);
  savedPlan.append(heading, steps);
  savedPlan.hidden = false;
}

try {
  const storedPlan = localStorage.getItem(planKey);
  if (storedPlan) {
    const parsedPlan = JSON.parse(storedPlan);
    if (parsedPlan && parsedPlan.contact && parsedPlan.phone && parsedPlan.place && parsedPlan.anchor) {
      planForm.elements.contact.value = parsedPlan.contact;
      planForm.elements.phone.value = parsedPlan.phone;
      planForm.elements.place.value = parsedPlan.place;
      planForm.elements.anchor.value = parsedPlan.anchor;
      renderPlan(parsedPlan);
    } else {
      planStatus.textContent = "O plano salvo está incompleto. Você pode preencher um novo.";
    }
  }
} catch {
  planStatus.textContent = "Não foi possível ler o plano salvo neste navegador.";
}

planForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(planForm);
  const plan = {
    contact: formData.get("contact").trim(),
    phone: formData.get("phone").trim(),
    place: formData.get("place").trim(),
    anchor: formData.get("anchor").trim(),
  };

  try {
    localStorage.setItem(planKey, JSON.stringify(plan));
    renderPlan(plan);
    planStatus.textContent = "Seu lembrete foi salvo neste navegador.";
  } catch {
    planStatus.textContent = "Não foi possível salvar o plano. Anote-o em um lugar seguro e tente novamente.";
  }
});

const breathStatus = document.querySelector("#breath-status");
const breathOrb = document.querySelector("#breath-orb");
let breathInterval;
let breathPhase = "in";
let breathSeconds = 4;

function updateBreathStatus() {
  breathOrb.dataset.phase = breathPhase;
  breathStatus.textContent = `${breathPhase === "in" ? "Inspire devagar" : "Solte o ar"} · ${breathSeconds}`;
}

function stopBreathing() {
  clearInterval(breathInterval);
  breathInterval = undefined;
  breathOrb.dataset.phase = "";
  breathStatus.textContent = "Pausa quando quiser. Volte à sua respiração natural.";
}

document.querySelector("#breath-start").addEventListener("click", () => {
  if (breathInterval) return;

  breathPhase = "in";
  breathSeconds = 4;
  updateBreathStatus();
  breathInterval = setInterval(() => {
    breathSeconds -= 1;
    if (breathSeconds === 0) {
      breathPhase = breathPhase === "in" ? "out" : "in";
      breathSeconds = breathPhase === "in" ? 4 : 6;
    }
    updateBreathStatus();
  }, 1000);
});

document.querySelector("#breath-stop").addEventListener("click", stopBreathing);
window.addEventListener("pagehide", stopBreathing);
