const portfolio = window.OLGA_PORTFOLIO || {
  categories: [],
  cvAvailable: false,
};

const categories = Array.isArray(portfolio.categories)
  ? portfolio.categories.filter((category) => Array.isArray(category.items))
  : [];

const allItems = categories.flatMap((category) =>
  category.items.map((item) => ({
    ...item,
    categoryId: category.id,
    categoryTitle: category.title,
  }))
);

const elements = {
  stories: document.querySelector("#storyList"),
  filters: document.querySelector("#filterList"),
  grid: document.querySelector("#feedGrid"),
  resultLabel: document.querySelector("#resultLabel"),
  clearFilter: document.querySelector("#clearFilter"),
  categoryCount: document.querySelector("#categoryCount"),
  workCount: document.querySelector("#workCount"),
  avatar: document.querySelector("#profileAvatar"),
  lightbox: document.querySelector("#lightbox"),
  lightboxMedia: document.querySelector("#lightboxMedia"),
  lightboxTitle: document.querySelector("#lightboxTitle"),
  lightboxCategory: document.querySelector("#lightboxCategory"),
  lightboxPosition: document.querySelector("#lightboxPosition"),
  closeLightbox: document.querySelector("#closeLightbox"),
  previousWork: document.querySelector("#previousWork"),
  nextWork: document.querySelector("#nextWork"),
};

const state = {
  activeCategory: "all",
  visibleItems: allItems,
  modalIndex: 0,
  liked: new Set(),
};

const heartIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.3 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>';

function firstImage(category) {
  return category.items.find((item) => item.type === "image");
}

function initials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function makeStory(category) {
  const button = document.createElement("button");
  button.className = "story";
  button.type = "button";
  button.setAttribute("role", "tab");
  button.setAttribute("aria-selected", String(state.activeCategory === category.id));
  button.setAttribute("aria-label", "Mostrar " + category.title);

  const ring = document.createElement("span");
  ring.className = "story__ring";
  const cover = firstImage(category);

  if (cover) {
    const image = document.createElement("img");
    image.className = "story__image";
    image.src = cover.src;
    image.alt = "";
    image.loading = "lazy";
    ring.append(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "story__fallback";
    fallback.textContent = initials(category.title);
    ring.append(fallback);
  }

  const label = document.createElement("span");
  label.className = "story__label";
  label.textContent = category.title;

  button.append(ring, label);
  button.addEventListener("click", () => {
    setFilter(category.id);
    document.querySelector("#galeria")?.scrollIntoView({ behavior: "smooth" });
  });

  return button;
}

function makeFilter(id, label) {
  const button = document.createElement("button");
  button.className = "filter-button";
  button.type = "button";
  button.textContent = label;
  button.dataset.category = id;
  button.setAttribute("aria-pressed", String(state.activeCategory === id));
  button.addEventListener("click", () => setFilter(id));
  return button;
}

function setFilter(categoryId) {
  state.activeCategory = categoryId;
  state.visibleItems =
    categoryId === "all"
      ? allItems
      : allItems.filter((item) => item.categoryId === categoryId);

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === categoryId));
  });

  document.querySelectorAll(".story").forEach((button, index) => {
    button.setAttribute(
      "aria-selected",
      String(categories[index]?.id === categoryId)
    );
  });

  elements.clearFilter.hidden = categoryId === "all";
  renderFeed();
}

function createMedia(item, inLightbox = false) {
  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.playsInline = true;
    video.preload = "metadata";
    video.controls = inLightbox;
    video.muted = !inLightbox;
    if (!inLightbox) {
      video.loop = true;
    }
    return video;
  }

  const image = document.createElement("img");
  image.src = item.src;
  image.alt = item.label + " — " + item.categoryTitle;
  if (!inLightbox) {
    image.loading = "lazy";
    image.decoding = "async";
  }
  return image;
}

function makePost(item, index) {
  const article = document.createElement("article");
  article.className = "post";
  if ((index + 1) % 5 === 0) {
    article.classList.add("post--wide");
  }

  const header = document.createElement("header");
  header.className = "post__header";

  const avatar = document.createElement("span");
  avatar.className = "post__avatar";
  avatar.textContent = "OA";

  const identity = document.createElement("div");
  identity.className = "post__identity";
  const user = document.createElement("strong");
  user.textContent = "olga.alvarez";
  const category = document.createElement("span");
  category.textContent = item.categoryTitle;
  identity.append(user, category);
  header.append(avatar, identity);

  const mediaButton = document.createElement("button");
  mediaButton.className = "post__media-button";
  mediaButton.type = "button";
  mediaButton.setAttribute("aria-label", "Abrir " + item.label);
  const media = createMedia(item);
  const openLabel = document.createElement("span");
  openLabel.className = "post__open-label";
  openLabel.textContent = item.type === "video" ? "Reproducir" : "Ampliar";
  mediaButton.append(media, openLabel);
  mediaButton.addEventListener("click", () => openLightbox(index));

  if (media instanceof HTMLVideoElement) {
    article.addEventListener("mouseenter", () => media.play().catch(() => {}));
    article.addEventListener("mouseleave", () => {
      media.pause();
      media.currentTime = 0;
    });
  }

  const footer = document.createElement("footer");
  footer.className = "post__footer";
  const caption = document.createElement("div");
  caption.className = "post__caption";
  const title = document.createElement("strong");
  title.textContent = item.label || "Proyecto visual";
  const meta = document.createElement("span");
  meta.textContent = item.categoryTitle;
  caption.append(title, meta);

  const reaction = document.createElement("button");
  reaction.className = "reaction";
  reaction.type = "button";
  reaction.innerHTML = heartIcon;
  reaction.setAttribute("aria-label", "Marcar como favorito");
  reaction.setAttribute("aria-pressed", String(state.liked.has(item.src)));
  reaction.addEventListener("click", () => {
    if (state.liked.has(item.src)) {
      state.liked.delete(item.src);
    } else {
      state.liked.add(item.src);
    }
    const selected = state.liked.has(item.src);
    reaction.setAttribute("aria-pressed", String(selected));
    reaction.setAttribute(
      "aria-label",
      selected ? "Quitar de favoritos" : "Marcar como favorito"
    );
  });

  footer.append(caption, reaction);
  article.append(header, mediaButton, footer);
  return article;
}

function renderFeed() {
  elements.grid.replaceChildren();

  const selectedCategory = categories.find(
    (category) => category.id === state.activeCategory
  );
  const context = selectedCategory ? selectedCategory.title : "Todas las categorías";
  const count = state.visibleItems.length;
  elements.resultLabel.textContent =
    count + (count === 1 ? " trabajo" : " trabajos") + " · " + context;

  if (!count) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No hay trabajos disponibles en esta categoría.";
    elements.grid.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.visibleItems.forEach((item, index) => {
    fragment.append(makePost(item, index));
  });
  elements.grid.append(fragment);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  elements.grid.querySelectorAll(".post").forEach((post) => observer.observe(post));
}

function updateLightbox() {
  const item = state.visibleItems[state.modalIndex];
  if (!item) return;

  elements.lightboxMedia.replaceChildren(createMedia(item, true));
  elements.lightboxTitle.textContent = item.label || "Proyecto visual";
  elements.lightboxCategory.textContent = item.categoryTitle;
  elements.lightboxPosition.textContent =
    state.modalIndex + 1 + " / " + state.visibleItems.length;
}

function openLightbox(index) {
  state.modalIndex = index;
  updateLightbox();
  elements.lightbox.showModal();
  document.body.classList.add("modal-open");
}

function moveLightbox(direction) {
  if (!state.visibleItems.length) return;
  state.modalIndex =
    (state.modalIndex + direction + state.visibleItems.length) %
    state.visibleItems.length;
  updateLightbox();
}

elements.closeLightbox.addEventListener("click", () => elements.lightbox.close());
elements.previousWork.addEventListener("click", () => moveLightbox(-1));
elements.nextWork.addEventListener("click", () => moveLightbox(1));
elements.clearFilter.addEventListener("click", () => setFilter("all"));

elements.lightbox.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  elements.lightboxMedia.replaceChildren();
});

elements.lightbox.addEventListener("click", (event) => {
  if (event.target === elements.lightbox) {
    elements.lightbox.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (!elements.lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

elements.stories.replaceChildren(...categories.map(makeStory));
elements.filters.replaceChildren(
  makeFilter("all", "Todo"),
  ...categories.map((category) => makeFilter(category.id, category.title))
);

elements.categoryCount.textContent = categories.length;
elements.workCount.textContent = allItems.length;
document.querySelector("#currentYear").textContent = new Date().getFullYear();

if (!portfolio.cvAvailable) {
  document.querySelectorAll(".js-cv-link").forEach((link) => link.remove());
}

const firstPortfolioImage = categories.map(firstImage).find(Boolean);
if (firstPortfolioImage) {
  elements.avatar.src = firstPortfolioImage.src;
  elements.avatar.hidden = false;
}

renderFeed();
