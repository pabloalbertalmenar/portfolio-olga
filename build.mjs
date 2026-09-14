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
const zipFile = rootFiles.find(function (name) {
  return /\.zip$/i.test(name) && /(portfolio|olga)/i.test(name);
});

if (!zipFile) {
  throw new Error(
    "Falta PORTFOLIO OLGA.zip en la raíz del repositorio. Súbelo sin descomprimir."
  );
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

const categoryDefinitions = [
  {
    id: "eventos",
    title: "Eventos",
    description: "Cobertura en directo, ambiente y momentos que definen la experiencia.",
  },
  {
    id: "retrato-movimiento",
    title: "Retrato & movimiento",
    description: "Personas, expresión y cuerpo como centro de la imagen.",
  },
  {
    id: "gastronomia",
    title: "Gastronomía",
    description: "Producto, espacio y gestos que construyen una experiencia de mesa.",
  },
  {
    id: "moda-estilo",
    title: "Moda & estilo",
    description: "Dirección visual, estilismo y ritmo editorial.",
  },
  {
    id: "marca-producto",
    title: "Marca & producto",
    description: "Contenido diseñado para comunicar una identidad en canales digitales.",
  },
  {
    id: "espacios-negocios",
    title: "Espacios & negocios",
    description: "Lugares y servicios fotografiados desde su carácter propio.",
  },
];

const projectDefinitions = [
  {
    folder: "dj1",
    id: "pulso-nocturno",
    categoryId: "eventos",
    title: "Tardeo en la playa",
    description: "Crónica visual de una sesión DJ: cabina, luces y energía compartida.",
    tags: ["Evento", "Directo", "Social"],
  },
  {
    folder: "dj2",
    id: "frecuencia-colectiva",
    categoryId: "eventos",
    title: "Frecuencia colectiva",
    description: "Una segunda mirada a la noche, centrada en el público y la atmósfera.",
    tags: ["Música", "Ambiente", "Reportaje"],
  },
  {
    folder: "evento-pilates",
    id: "respirar-juntas",
    categoryId: "eventos",
    title: "Respirar juntas",
    description: "Cobertura de una experiencia de pilates en grupo, del gesto al ambiente.",
    tags: ["Bienestar", "Evento", "Movimiento"],
  },
  {
    folder: "cantantes",
    id: "voces-en-escena",
    categoryId: "retrato-movimiento",
    title: "Voces en escena",
    description: "Retratos de actuación que conservan presencia, emoción y carácter.",
    tags: ["Retrato", "Música", "Directo"],
  },
  {
    folder: "sesion-de-baile",
    id: "cuerpo-y-ritmo",
    categoryId: "retrato-movimiento",
    title: "Cuerpo y ritmo",
    description: "Una sesión construida desde el movimiento, la expresión y el espacio.",
    tags: ["Danza", "Retrato", "Movimiento"],
  },
  {
    folder: "cafeteria",
    id: "rituales-de-cafe",
    categoryId: "gastronomia",
    title: "Rituales de café",
    description: "Producto y atmósfera para contar la experiencia cotidiana de una cafetería.",
    tags: ["Producto", "Lifestyle", "Social"],
  },
  {
    folder: "restaurante",
    id: "mesa-abierta",
    categoryId: "gastronomia",
    title: "Mesa abierta",
    description: "Fotografía gastronómica que reúne platos, detalles y experiencia de sala.",
    tags: ["Gastronomía", "Espacio", "Marca"],
  },
  {
    folder: "moda",
    id: "actitud-editorial",
    categoryId: "moda-estilo",
    title: "Actitud editorial",
    description: "Retrato de moda con atención al estilismo, el gesto y la dirección visual.",
    tags: ["Editorial", "Retrato", "Moda"],
  },
  {
    folder: "pasarela",
    id: "ritmo-de-pasarela",
    categoryId: "moda-estilo",
    title: "Ritmo de pasarela",
    description: "Cobertura de moda en directo: looks, movimiento y detalles de escena.",
    tags: ["Pasarela", "Evento", "Estilo"],
  },
  {
    folder: "marca",
    id: "identidad-cotidiana",
    categoryId: "marca-producto",
    title: "Identidad cotidiana",
    description: "Contenido de marca pensado para comunicar con coherencia en redes sociales.",
    tags: ["Branding", "Producto", "Contenido"],
  },
  {
    folder: "negocio",
    id: "espacio-con-proposito",
    categoryId: "espacios-negocios",
    title: "Espacio con propósito",
    description: "Fotografía de negocio para mostrar el lugar, el servicio y su personalidad.",
    tags: ["Negocio", "Espacio", "Comunicación"],
  },
  {
    folder: "estudio-pilates",
    id: "calma-en-movimiento",
    categoryId: "espacios-negocios",
    title: "Calma en movimiento",
    description: "Espacio y práctica para presentar un estudio de pilates desde dentro.",
    tags: ["Interior", "Bienestar", "Servicio"],
  },
];

const imageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const videoExtensions = new Set([".mp4", ".webm", ".mov"]);
const zip = new AdmZip(path.join(root, zipFile));

let media = zip
  .getEntries()
  .filter(function (entry) {
    return !entry.isDirectory;
  })
  .map(function (entry) {
    const normalized = entry.entryName.replaceAll("\\", "/");
    const originalParts = normalized.split("/").filter(Boolean);

    if (
      originalParts.includes("__MACOSX") ||
      (originalParts.at(-1) || "").startsWith("._")
    ) {
      return null;
    }

    const extension = path.extname(originalParts.at(-1) || "").toLowerCase();
    return { entry: entry, parts: originalParts, extension: extension };
  })
  .filter(function (item) {
    return (
      item &&
      (imageExtensions.has(item.extension) ||
        videoExtensions.has(item.extension))
    );
  });

if (!media.length) {
  throw new Error("El ZIP no contiene imágenes o vídeos compatibles.");
}

const firstFolders = new Set(
  media.map(function (item) {
    return item.parts[0];
  })
);
if (
  firstFolders.size === 1 &&
  media.every(function (item) {
    return item.parts.length > 1;
  })
) {
  media = media.map(function (item) {
    return Object.assign({}, item, { parts: item.parts.slice(1) });
  });
}

const definitionByFolder = new Map(
  projectDefinitions.map(function (project) {
    return [project.folder, project];
  })
);
const itemsByProject = new Map();

media
  .sort(function (a, b) {
    return a.entry.entryName.localeCompare(b.entry.entryName, "es", {
      numeric: true,
    });
  })
  .forEach(function (item) {
    const rawFolder = item.parts.length > 1 ? item.parts[0] : "";
    const folderId = slug(rawFolder);
    const project = definitionByFolder.get(folderId);

    if (!project) {
      throw new Error(
        "Carpeta no reconocida en el portfolio: " +
          (rawFolder || "(sin carpeta)")
      );
    }

    const projectItems = itemsByProject.get(project.id) || [];
    projectItems.push(item);
    itemsByProject.set(project.id, projectItems);
  });

const categories = categoryDefinitions.map(function (category) {
  const projects = projectDefinitions
    .filter(function (project) {
      return project.categoryId === category.id;
    })
    .map(function (project) {
      const projectItems = itemsByProject.get(project.id) || [];
      const targetDirectory = path.join(
        mediaOutput,
        category.id,
        project.id
      );
      fs.mkdirSync(targetDirectory, { recursive: true });

      const items = projectItems.map(function (item, index) {
        const extension = item.extension === ".jpeg" ? ".jpg" : item.extension;
        const outputName =
          project.id + "-" + String(index + 1).padStart(2, "0") + extension;
        fs.writeFileSync(
          path.join(targetDirectory, outputName),
          item.entry.getData()
        );

        return {
          src:
            "media/" +
            category.id +
            "/" +
            project.id +
            "/" +
            outputName,
          type: videoExtensions.has(item.extension) ? "video" : "image",
          alt:
            project.title +
            " — " +
            (videoExtensions.has(item.extension) ? "vídeo " : "fotografía ") +
            (index + 1),
        };
      });

      if (!items.length) {
        throw new Error(
          "La carpeta del proyecto está vacía o no existe: " + project.folder
        );
      }

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        tags: project.tags,
        items: items,
      };
    });

  return {
    id: category.id,
    title: category.title,
    description: category.description,
    projects: projects,
  };
});

const cvFile = rootFiles.find(function (name) {
  return /\.pdf$/i.test(name) && /(cv|olga)/i.test(name);
});
if (cvFile) {
  fs.copyFileSync(
    path.join(root, cvFile),
    path.join(output, "cv-olga-alvarez.pdf")
  );
}

const projectCount = categories.reduce(function (sum, category) {
  return sum + category.projects.length;
}, 0);
const itemCount = categories.reduce(function (categorySum, category) {
  return (
    categorySum +
    category.projects.reduce(function (projectSum, project) {
      return projectSum + project.items.length;
    }, 0)
  );
}, 0);

const data = {
  categories: categories,
  cvAvailable: Boolean(cvFile),
  stats: {
    categories: categories.length,
    projects: projectCount,
    items: itemCount,
  },
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(output, "gallery-data.js"),
  "window.OLGA_PORTFOLIO = " + JSON.stringify(data, null, 2) + ";\n"
);

console.log(
  "Portfolio preparado: " +
    categories.length +
    " categorías, " +
    projectCount +
    " series y " +
    itemCount +
    " archivos."
);
console.log(
  "Categorías: " +
    categories
      .map(function (category) {
        return category.title + " (" + category.projects.length + ")";
      })
      .join(", ")
);
