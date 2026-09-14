const portfolio = window.OLGA_PORTFOLIO || {
  categories: [],
  cvAvailable: false,
  stats: {},
};

const categories = Array.isArray(portfolio.categories)
  ? portfolio.categories.filter(function (category) {
      return Array.isArray(category.projects);
    })
  : [];

const allProjects = categories.flatMap(function (category) {
  return category.projects.map(function (project) {
    return Object.assign({}, project, {
      categoryId: category.id,
      categoryTitle: category.title,
    });
  });
});

const allItems = allProjects.flatMap(function (project) {
  return project.items || [];
});

const elements = {
  categoryPicker: document.querySelector("#categoryPicker"),
  projectGrid: document.querySelector("#projectGrid"),
  resultLabel: document.querySelector("#resultLabel"),
  resetFilter: document.querySelector("#resetFilter"),
  projectCount: document.querySelector("#projectCount"),
  imageCount: document.querySelector("#imageCount"),
  categoryCount: document.querySelector("#categoryCount"),
  heroImagePrimary: document.querySelector("#heroImagePrimary"),
  heroImageSecondary: document.querySelector("#heroImageSecondary"),
  heroPrimaryCategory: document.querySelector("#heroPrimaryCategory"),
  heroPrimaryTitle: document.querySelector("#heroPrimaryTitle"),
  heroSecondaryCategory: document.querySelector("#heroSecondaryCategory"),
  heroSecondaryTitle: document.querySelector("#heroSecondaryTitle"),
  viewer: document.querySelector("#viewer"),
  closeViewer: document.querySelector("#closeViewer"),
  viewerCategory: document.querySelector("#viewerCategory"),
  viewerTitle: document.querySelector("#viewerTitle"),
  viewerDescription: document.querySelector("#viewerDescription"),
  viewerTags: document.querySelector("#viewerTags"),
  viewerPosition: document.querySelector("#viewerPosition"),
  viewerMedia: document.querySelector("#viewerMedia"),
  viewerThumbs: document.querySelector("#viewerThumbs"),
  previousImage: document.querySelector("#previousImage"),
  nextImage: document.querySelector("#nextImage"),
};

const state = {
  activeCategory: "all",
  visibleProjects: allProjects,
  viewerProject: null,
  viewerIndex: 0,
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (typeof text === "string") element.textContent = text;
  return element;
}

function firstItem(project) {
  return project && Array.isArray(project.items) ? project.items[0] : null;
}

function firstImage(project) {
  if (!project || !Array.isArray(project.items)) return null;
  return (
    project.items.find(function (item) {
      return item.type === "image";
    }) || project.items[0]
  );
}

function makeMedia(item, context) {
  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.playsInline = true;
    video.preload = "metadata";
    video.muted = context !== "viewer";
    video.controls = context === "viewer";
    if (context === "card") video.loop = true;
    video.setAttribute("aria-label", item.alt || "Vídeo del proyecto");
    return video;
  }

  const image = document.createElement("img");
  image.src = item.src;
  image.alt = item.alt || "Fotografía del proyecto";
  image.decoding = "async";
  if (context !== "hero") image.loading = "lazy";
  return image;
}

function setHero() {
  if (!allProjects.length) return;

  const primaryProject =
    allProjects.find(function (project) {
      return project.id === "actitud-editorial";
    }) || allProjects[0];

  const secondaryProject =
    allProjects.find(function (project) {
      return project.id === "rituales-de-cafe";
    }) ||
    allProjects[1] ||
    primaryProject;

  const primaryItem = firstImage(primaryProject);
  const secondaryItem = firstImage(secondaryProject);

  if (primaryItem && primaryItem.type === "image") {
    elements.heroImagePrimary.src = primaryItem.src;
    elements.heroImagePrimary.alt = primaryItem.alt;
  }
  if (secondaryItem && secondaryItem.type === "image") {
    elements.heroImageSecondary.src = secondaryItem.src;
    elements.heroImageSecondary.alt = secondaryItem.alt;
  }

  elements.heroPrimaryCategory.textContent = primaryProject.categoryTitle;
  elements.heroPrimaryTitle.textContent = primaryProject.title;
  elements.heroSecondaryCategory.textContent = secondaryProject.categoryTitle;
  elements.heroSecondaryTitle.textContent = secondaryProject.title;
}

function makeCategoryTab(category, index) {
  const button = makeElement("button", "category-tab");
  button.type = "button";
  button.setAttribute("role", "tab");
  button.setAttribute(
    "aria-selected",
    String(state.activeCategory === category.id)
  );
  button.dataset.category = category.id;

  const imageWrap = makeElement("span", "category-tab__image");
  const coverProject = category.projects[0];
  const cover = firstImage(coverProject);
  if (cover) {
    imageWrap.append(makeMedia(cover, "thumbnail"));
  }

  const meta = makeElement("span", "category-tab__meta");
  meta.append(
    makeElement("span", "", pad(index + 1)),
    makeElement("strong", "", category.title)
  );

  button.append(imageWrap, meta);
  button.addEventListener("click", function () {
    setFilter(category.id);
    document.querySelector("#proyectos").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  return button;
}

function makeTagList(tags, className) {
  const container = makeElement("div", className);
  (tags || []).forEach(function (tag) {
    container.append(makeElement("span", "", tag));
  });
  return container;
}

function makeProjectCard(project, index) {
  const article = makeElement("article", "project-card");

  const social = makeElement("header", "project-card__social");
  social.append(makeElement("span", "project-card__avatar", "OA"));

  const identity = makeElement("span", "project-card__identity");
  identity.append(
    makeElement("strong", "", "@ol.olgaa"),
    makeElement("span", "", project.categoryTitle)
  );
  social.append(identity, makeElement("span", "project-card__number", pad(index + 1)));

  const mediaButton = makeElement("button", "project-card__open");
  mediaButton.type = "button";
  mediaButton.setAttribute("aria-label", "Abrir galería: " + project.title);

  (project.items || []).slice(0, 3).forEach(function (item) {
    const media = makeMedia(item, "card");
    media.classList.add("project-card__asset");
    mediaButton.append(media);
  });

  mediaButton.addEventListener("click", function () {
    openViewer(project, 0);
  });

  const body = makeElement("div", "project-card__body");
  const heading = makeElement("div");
  const kicker = makeElement("div", "project-card__kicker");
  kicker.append(
    makeElement("span", "", project.categoryTitle),
    makeElement(
      "span",
      "",
      String((project.items || []).length) +
        ((project.items || []).length === 1 ? " imagen" : " imágenes")
    )
  );
  heading.append(kicker, makeElement("h3", "", project.title));

  const description = makeElement(
    "p",
    "project-card__description",
    project.description
  );

  const footer = makeElement("footer", "project-card__footer");
  footer.append(
    makeTagList(project.tags, "project-card__tags"),
    makeElement("span", "project-card__link", "Abrir galería ↗")
  );

  body.append(heading, description, footer);
  article.append(social, mediaButton, body);
  return article;
}

function setFilter(categoryId) {
  state.activeCategory = categoryId;
  state.visibleProjects =
    categoryId === "all"
      ? allProjects
      : allProjects.filter(function (project) {
          return project.categoryId === categoryId;
        });

  document.querySelectorAll(".category-tab").forEach(function (button) {
    button.setAttribute(
      "aria-selected",
      String(button.dataset.category === categoryId)
    );
  });

  elements.resetFilter.hidden = categoryId === "all";
  renderProjects();
}

function renderProjects() {
  elements.projectGrid.replaceChildren();

  const selectedCategory = categories.find(function (category) {
    return category.id === state.activeCategory;
  });
  const count = state.visibleProjects.length;
  const label = selectedCategory ? selectedCategory.title : "Todas las categorías";
  elements.resultLabel.textContent =
    count +
    (count === 1 ? " serie" : " series") +
    " · " +
    label;

  if (!count) {
    elements.projectGrid.append(
      makeElement(
        "p",
        "empty-state",
        "No hay proyectos disponibles en esta categoría."
      )
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  state.visibleProjects.forEach(function (project, index) {
    fragment.append(makeProjectCard(project, index));
  });
  elements.projectGrid.append(fragment);

  if (!("IntersectionObserver" in window)) {
    elements.projectGrid.querySelectorAll(".project-card").forEach(function (card) {
      card.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  elements.projectGrid.querySelectorAll(".project-card").forEach(function (card) {
    observer.observe(card);
  });
}

function updateViewer() {
  const project = state.viewerProject;
  if (!project || !project.items.length) return;

  const item = project.items[state.viewerIndex];
  elements.viewerCategory.textContent = project.categoryTitle;
  elements.viewerTitle.textContent = project.title;
  elements.viewerDescription.textContent = project.description;
  elements.viewerPosition.textContent =
    "Imagen " + pad(state.viewerIndex + 1) + " de " + pad(project.items.length);
  elements.viewerMedia.replaceChildren(makeMedia(item, "viewer"));
  elements.viewerTags.replaceChildren(
    ...Array.from(makeTagList(project.tags, "").children)
  );

  elements.viewerThumbs
    .querySelectorAll(".viewer__thumb")
    .forEach(function (button, index) {
      button.setAttribute("aria-current", String(index === state.viewerIndex));
    });
}

function buildViewerThumbs(project) {
  elements.viewerThumbs.replaceChildren();
  project.items.forEach(function (item, index) {
    const button = makeElement("button", "viewer__thumb");
    button.type = "button";
    button.setAttribute("aria-label", "Ver imagen " + (index + 1));
    button.setAttribute("aria-current", String(index === state.viewerIndex));
    button.append(makeMedia(item, "thumbnail"));
    button.addEventListener("click", function () {
      state.viewerIndex = index;
      updateViewer();
    });
    elements.viewerThumbs.append(button);
  });
}

function openViewer(project, index) {
  state.viewerProject = project;
  state.viewerIndex = index || 0;
  buildViewerThumbs(project);
  updateViewer();
  elements.viewer.showModal();
  document.body.classList.add("viewer-open");
}

function moveViewer(direction) {
  const project = state.viewerProject;
  if (!project || !project.items.length) return;
  state.viewerIndex =
    (state.viewerIndex + direction + project.items.length) %
    project.items.length;
  updateViewer();
}

elements.closeViewer.addEventListener("click", function () {
  elements.viewer.close();
});
elements.previousImage.addEventListener("click", function () {
  moveViewer(-1);
});
elements.nextImage.addEventListener("click", function () {
  moveViewer(1);
});
elements.resetFilter.addEventListener("click", function () {
  setFilter("all");
});

elements.viewer.addEventListener("close", function () {
  document.body.classList.remove("viewer-open");
  elements.viewerMedia.replaceChildren();
});

elements.viewer.addEventListener("click", function (event) {
  if (event.target === elements.viewer) {
    elements.viewer.close();
  }
});

document.addEventListener("keydown", function (event) {
  if (!elements.viewer.open) return;
  if (event.key === "ArrowLeft") moveViewer(-1);
  if (event.key === "ArrowRight") moveViewer(1);
});

elements.categoryPicker.replaceChildren(
  ...categories.map(function (category, index) {
    return makeCategoryTab(category, index);
  })
);

elements.projectCount.textContent =
  portfolio.stats.projects || allProjects.length;
elements.imageCount.textContent =
  portfolio.stats.items || allItems.length;
elements.categoryCount.textContent = categories.length;
document.querySelector("#currentYear").textContent = new Date().getFullYear();

if (!portfolio.cvAvailable) {
  document.querySelectorAll(".js-cv-link").forEach(function (link) {
    link.remove();
  });
}

setHero();
renderProjects();
