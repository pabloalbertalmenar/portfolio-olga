import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

const root = process.cwd();
const source = path.join(root, "site");
const output = path.join(root, "dist");
const mediaOutput = path.join(output, "media");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(mediaOutput, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js"]) {
  const from = path.join(source, file);
  if (!fs.existsSync(from)) {
    throw new Error("Falta el archivo de la web: site/" + file);
  }
  fs.copyFileSync(from, path.join(output, file));
}

const rootFiles = fs.readdirSync(root);
const zipFile = rootFiles.find((name) =>
  /\.zip$/i.test(name) && /(portfolio|olga)/i.test(name)
);

if (!zipFile) {
  throw new Error(
    "Falta PORTFOLIO OLGA.zip en la raíz del repositorio. Súbelo sin descomprimir."
  );
}

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov"]);
const zip = new AdmZip(path.join(root, zipFile));

let media = zip
  .getEntries()
  .filter((entry) => !entry.isDirectory)
  .map((entry) => {
    const normalized = entry.entryName.replaceAll("\\", "/");
    const parts = normalized
      .split("/")
      .filter(Boolean)
      .filter((part) => part !== "__MACOSX" && !part.startsWith("._"));
    const extension = path.extname(parts.at(-1) || "").toLowerCase();
    return { entry, parts, extension };
  })
  .filter(
    (item) =>
      item.parts.length > 0 &&
      (imageExtensions.has(item.extension) || videoExtensions.has(item.extension))
  );

if (!media.length) {
  throw new Error("El ZIP no contiene imágenes o vídeos compatibles.");
}

const firstFolders = new Set(media.map((item) => item.parts[0]));
if (firstFolders.size === 1 && media.every((item) => item.parts.length > 1)) {
  media = media.map((item) => ({ ...item, parts: item.parts.slice(1) }));
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function pretty(value) {
  return value
    .replace(/^\s*\d+\s*[.\-_)·]+\s*/, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function labelFromFilename(filename) {
  return pretty(path.parse(filename).name.replace(/^(img|dsc|foto|photo)[-_ ]*\d*/i, ""));
}

const portfolioGroups = [
  {
    id: "gastronomia",
    title: "Gastronomía",
    order: 1,
    folders: ["cafeteria", "restaurante"],
  },
  {
    id: "musica",
    title: "Música",
    order: 2,
    folders: ["cantantes", "dj1", "dj2"],
  },
  {
    id: "bienestar",
    title: "Pilates & bienestar",
    order: 3,
    folders: ["estudio-pilates", "evento-pilates"],
  },
  {
    id: "marca-negocio",
    title: "Marca & negocio",
    order: 4,
    folders: ["marca", "negocio"],
  },
  {
    id: "moda-pasarela",
    title: "Moda & pasarela",
    order: 5,
    folders: ["moda", "pasarela"],
  },
  {
    id: "danza",
    title: "Danza",
    order: 6,
    folders: ["sesion-de-baile"],
  },
];

function groupForFolder(folder) {
  const folderId = slug(folder);
  return (
    portfolioGroups.find((group) => group.folders.includes(folderId)) || {
      id: folderId || "seleccion",
      title: pretty(folder),
      order: 999,
      folders: [folderId],
    }
  );
}

const categoryMap = new Map();

for (const item of media) {
  const filename = item.parts.at(-1);
  const rawCategory = item.parts.length > 1 ? item.parts[0] : "Selección";
  const group = groupForFolder(rawCategory);
  let category = categoryMap.get(group.id);

  if (!category) {
    category = {
      id: group.id,
      title: group.title,
      order: group.order,
      items: [],
    };
    categoryMap.set(group.id, category);
    fs.mkdirSync(path.join(mediaOutput, group.id), { recursive: true });
  }

  const extension = item.extension === ".jpeg" ? ".jpg" : item.extension;
  const cleanBase = slug(path.parse(filename).name) || "media";
  let outputName = cleanBase.slice(0, 58) + extension;
  let suffix = 2;
  const usedNames = new Set(category.items.map((entry) => path.basename(entry.src)));
  while (usedNames.has(outputName)) {
    outputName = cleanBase.slice(0, 54) + "-" + suffix++ + extension;
  }

  fs.writeFileSync(
    path.join(mediaOutput, category.id, outputName),
    item.entry.getData()
  );

  category.items.push({
    src: "media/" + category.id + "/" + outputName,
    type: videoExtensions.has(item.extension) ? "video" : "image",
    label: labelFromFilename(filename) || category.title,
  });
}

const categories = [...categoryMap.values()]
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "es"))
  .map(({ order, ...category }) => category);

const cvFile = rootFiles.find(
  (name) => /\.pdf$/i.test(name) && /(cv|olga)/i.test(name)
);
if (cvFile) {
  fs.copyFileSync(path.join(root, cvFile), path.join(output, "cv-olga-alvarez.pdf"));
}

const data = {
  categories,
  cvAvailable: Boolean(cvFile),
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(output, "gallery-data.js"),
  "window.OLGA_PORTFOLIO = " + JSON.stringify(data, null, 2) + ";\n"
);

console.log(
  "Portfolio preparado: " +
    categories.length +
    " categorías y " +
    categories.reduce((sum, category) => sum + category.items.length, 0) +
    " archivos."
);
console.log(
  "Categorías detectadas: " +
    categories.map((category) => category.title + " (" + category.items.length + ")").join(", ")
);
