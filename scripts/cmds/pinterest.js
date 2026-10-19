const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const API_CONFIG_URL =
  "https://raw.githubusercontent.com/goatbotnx/xalmanx210/refs/heads/main/apis.json";
const API_KEY = "xalman-hub";

let apiBaseUrl = null;
let apiConfigRequest = null;

const STYLE = {
  title: "📌 𝗣𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗦𝗘𝗔𝗥𝗖𝗛",
  line: "━━━━━━━━━━━━━━━━━━",
  powered: "👑 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗛𝗜𝗦𝗛𝗜𝗥 𝗕𝗢𝗧"
};

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;

  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const url = data?.[API_KEY];

        if (typeof url !== "string" || !url.trim()) {
          throw new Error("API URL not found in apis.json");
        }

        apiBaseUrl = url.trim().replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }

  return apiConfigRequest;
}

function getImageUrl(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  return item.url || item.image || item.imageUrl ||
    item.src || item.original || item.link || "";
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function fetchImage(url) {
  if (!isValidUrl(url)) throw new Error("Invalid image URL");

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    maxContentLength: 12 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const type = String(response.headers["content-type"] || "")
    .toLowerCase();

  if (!type.startsWith("image/")) {
    throw new Error("URL did not return an image");
  }

  return Buffer.from(response.data);
}

async function renderImages(items) {
  const images = [];

  for (const item of items) {
    const url = getImageUrl(item);
    if (!isValidUrl(url)) continue;

    try {
      const buffer = await fetchImage(url);
      const img = await loadImage(buffer);

      if (img.width && img.height) {
        images.push({
          img,
          url,
          index: images.length + 1
        });
      }
    } catch (err) {
      console.error("[SHISHIR PIN]", err.message);
    }
  }

  return images;
}

async function createCollage(images, query, page) {
  const columns = 3;
  const cardWidth = 330;
  const gap = 16;
  const padding = 24;
  const headerHeight = 155;
  const bottomHeight = 65;
  const width = padding * 2 + columns * cardWidth + gap * 2;

  const heights = Array(columns).fill(headerHeight + padding);
  const positions = [];

  for (const item of images) {
    let column = 0;

    for (let i = 1; i < columns; i++) {
      if (heights[i] < heights[column]) column = i;
    }

    const ratio = item.img.height / item.img.width;
    const cardHeight = Math.max(
      120,
      Math.min(650, Math.round(cardWidth * ratio))
    );

    positions.push({
      ...item,
      x: padding + column * (cardWidth + gap),
      y: heights[column],
      width: cardWidth,
      height: cardHeight
    });

    heights[column] += cardHeight + gap;
  }

  const height = Math.max(...heights) + bottomHeight + padding;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Pinterest logo
  ctx.fillStyle = "#e60023";
  ctx.beginPath();
  ctx.arc(padding + 24, 45, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", padding + 24, 45);

  // Search bar
  const searchX = padding + 60;
  const searchWidth = width - searchX - padding;

  ctx.fillStyle = "#f1f1f1";
  ctx.beginPath();
  ctx.roundRect(searchX, 20, searchWidth, 50, 25);
  ctx.fill();

  ctx.fillStyle = "#222222";
  ctx.font = "17px sans-serif";
  ctx.textAlign = "left";

  let displayQuery = query;
  while (
    displayQuery.length > 4 &&
    ctx.measureText(displayQuery).width > searchWidth - 35
  ) {
    displayQuery = displayQuery.slice(0, -1);
  }

  if (displayQuery !== query) displayQuery += "...";
  ctx.fillText(displayQuery, searchX + 18, 45);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("Pinterest Image Results", padding, 108);

  ctx.fillStyle = "#777777";
  ctx.font = "15px sans-serif";
  ctx.fillText(
    `Page ${page} | ${images.length} images`,
    padding,
    132
  );

  // Image cards
  for (const item of positions) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(item.x, item.y, item.width, item.height, 18);
    ctx.clip();

    const scale = Math.max(
      item.width / item.img.width,
      item.height / item.img.height
    );

    const drawWidth = item.img.width * scale;
    const drawHeight = item.img.height * scale;

    ctx.drawImage(
      item.img,
      item.x + (item.width - drawWidth) / 2,
      item.y + (item.height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.beginPath();
    ctx.arc(item.x + 28, item.y + 28, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(item.index), item.x + 28, item.y + 28);
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

  ctx.strokeStyle = "#eeeeee";
  ctx.beginPath();
  ctx.moveTo(0, height - bottomHeight);
  ctx.lineTo(width, height - bottomHeight);
  ctx.stroke();

  ctx.fillStyle = "#777777";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(STYLE.powered, width / 2, height - 28);

  return {
    buffer: canvas.toBuffer("image/png"),
    positions
  };
}

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin", "pinimg"],
    version: "4.1.0",
    author: "SHISHIR",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Pinterest image search"
    },
    longDescription: {
      en: "Search and download Pinterest images"
    },
    category: "image",
    guide: {
      en: "{pn} <query>\nExample: {pn} anime"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").trim();

    if (!query) {
      return message.reply(
        `${STYLE.title}\n${STYLE.line}\n` +
        "📝 𝗨𝘀𝗮𝗴𝗲: /pin <query>\n" +
        "💡 𝗘𝘅𝗮𝗺𝗽𝗹𝗲: /pin anime\n\n" +
        STYLE.powered
      );
    }

    api.setMessageReaction("🔍", event.messageID, () => {}, true);

    return this.renderPage({
      api,
      event,
      message,
      query,
      pageNum: 1
    });
  },

  renderPage: async function ({
    api,
    event,
    message,
    query,
    pageNum
  }) {
    let imagePath;

    try {
      const baseUrl = await getApiBaseUrl();
      const response = await axios.get(`${baseUrl}/api/pinimg`, {
        params: { search: query, count: 60 },
        timeout: 30000
      });

      const items = response.data?.result;

      if (!Array.isArray(items) || !items.length) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        return message.reply(
          `❌ 𝗡𝗼 𝗜𝗺𝗮𝗴𝗲𝘀 𝗙𝗼𝘂𝗻𝗱!\n` +
          `${STYLE.line}\n🔎 𝗤𝘂𝗲𝗿𝘆: ${query}`
        );
      }

      const perPage = 12;
      const totalPages = Math.ceil(items.length / perPage);
      const currentPage = Math.max(
        1,
        Math.min(Number(pageNum) || 1, totalPages)
      );

      const pageItems = items.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
      );

      const images = await renderImages(pageItems);

      if (!images.length) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        return message.reply(
          `⚠️ 𝗜𝗺𝗮𝗴𝗲 𝗟𝗼𝗮𝗱 𝗙𝗮𝗶𝗹𝗲𝗱!\n${STYLE.line}\n` +
          "API response and image URLs check koro."
        );
      }

      const collage = await createCollage(
        images,
        query,
        currentPage
      );

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      imagePath = path.join(
        cacheDir,
        `pin_${Date.now()}_${Math.random().toString(36).slice(2)}.png`
      );

      await fs.writeFile(imagePath, collage.buffer);

      return message.reply(
        {
          body:
            `${STYLE.title}\n${STYLE.line}\n` +
            `🔎 𝗤𝘂𝗲𝗿𝘆: ${query}\n` +
            `📄 𝗣𝗮𝗴𝗲: ${currentPage}/${totalPages}\n` +
            `${STYLE.line}\n` +
            "🔢 𝗜𝗺𝗮𝗴𝗲: 1, 2,3 অথবা 1-4\n" +
            "➡️ 𝗡𝗘𝗫𝗧 | ⬅️ 𝗣𝗥𝗘𝗩\n" +
            `${STYLE.line}\n${STYLE.powered}`,
          attachment: fs.createReadStream(imagePath)
        },
        async (err, info) => {
          if (imagePath) await fs.remove(imagePath).catch(() => {});
          if (err || !info?.messageID) {
            console.error("[pinterest] Send error:", err?.message);
            return;
          }

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: String(event.senderID),
            query,
            currentPage,
            totalPages,
            imageMap: Object.fromEntries(
              collage.positions.map(item => [item.index, item.url])
            )
          });

          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      );
    } catch (err) {
      if (imagePath) await fs.remove(imagePath).catch(() => {});

      console.error("[pinterest] Error:", err.stack || err.message);

      api.setMessageReaction("❌", event.messageID, () => {}, true);

      return message.reply(
        `❌ 𝗣𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗘𝗥𝗥𝗢𝗥\n${STYLE.line}\n` +
        `📌 𝗥𝗲𝗮𝘀𝗼𝗻: ${err.response?.status || err.message}\n` +
        "🔧 𝗖𝗵𝗲𝗰𝗸: Railway logs / API URL"
      );
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (String(event.senderID) !== String(Reply.author)) return;

    const input = String(event.body || "").trim().toLowerCase();

    if (input === "next" || input === "prev" || input === "previous") {
      const page = input === "next"
        ? Reply.currentPage + 1
        : Reply.currentPage - 1;

      if (page < 1 || page > Reply.totalPages) {
        return message.reply(
          page < 1
            ? `⚠️ 𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗢𝗻 𝗙𝗶𝗿𝘀𝘁 𝗣𝗮𝗴𝗲!`
            : `⚠️ 𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗢𝗻 𝗟𝗮𝘀𝘁 𝗣𝗮𝗴𝗲!`
        );
      }

      return this.renderPage({
        api,
        event,
        message,
        query: Reply.query,
        pageNum: page
      });
    }

    let indices = [];

    if (/^\d+$/.test(input)) {
      indices = [Number(input)];
    } else if (/^\d+(,\s*\d+)+$/.test(input)) {
      indices = input.split(",").map(Number);
    } else if (/^\d+\s*-\s*\d+$/.test(input)) {
      const [a, b] = input.split("-").map(Number);

      if (Math.abs(b - a) > 11) {
        return message.reply(
          "⚠️ 𝗠𝗮𝘅𝗶𝗺𝘂𝗺 𝟭𝟮 𝗜𝗺𝗮𝗴𝗲𝘀 𝗣𝗲𝗿 𝗥𝗲𝗽𝗹𝘆!"
        );
      }

      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        indices.push(i);
      }
    } else {
      return message.reply(
        `❌ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗜𝗻𝗽𝘂𝘁!\n${STYLE.line}\n` +
        "Use: 1 | 1,2,3 | 1-4 | next | prev"
      );
    }

    indices = [...new Set(indices)];

    if (
      indices.some(i => i < 1 || i > 12 || !Reply.imageMap[i])
    ) {
      return message.reply(
        "⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗜𝗺𝗮𝗴𝗲 𝗡𝘂𝗺𝗯𝗲𝗿!"
      );
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const attachments = [];

    try {
      for (const index of indices) {
        try {
          attachments.push(await fetchImage(Reply.imageMap[index]));
        } catch (err) {
          console.error("[pinterest] Download:", err.message);
        }
      }

      if (!attachments.length) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        return message.reply(
          `❌ 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗙𝗮𝗶𝗹𝗲𝗱!\n${STYLE.line}\n` +
          "Image links may have expired."
        );
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      return message.reply({
        body:
          `📥 𝗜𝗠𝗔𝗚𝗘𝗦 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗\n${STYLE.line}\n` +
          `✅ 𝗦𝗲𝗻𝘁: ${attachments.length} image(s)\n` +
          `${STYLE.line}\n${STYLE.powered}`,
        attachment: attachments
      });
    } catch (err) {
      console.error("[pinterest] Reply error:", err.message);

      return message.reply(
        `❌ 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗘𝗿𝗿𝗼𝗿!\n${STYLE.line}`
      );
    }
  }
};
