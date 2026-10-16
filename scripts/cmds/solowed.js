const axios = require("axios");

module.exports = {
  config: {
    name: "solowed",
    aliases: ["slow", "slowed"],
    version: "2.1.0",
    author: "SHISHIR",
    countDown: 5,
    role: 0,
    description: {
      en: "Random Slowed Video"
    },
    category: "media",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const videos = [
      "https://files.catbox.moe/2ia0t8.mp4",
      "https://files.catbox.moe/czuo9f.mp4",
      "https://files.catbox.moe/42dzmo.mp4",
      "https://files.catbox.moe/94u4ro.mp4",
      "https://files.catbox.moe/pozq50.mp4",
      "https://files.catbox.moe/rnli9p.mp4",
      "https://files.catbox.moe/ljl8ig.mp4",
      "https://files.catbox.moe/l8pb4g.mp4",
      "https://files.catbox.moe/y1igqp.mp4",
      "https://files.catbox.moe/3lywxz.mp4",
      "https://files.catbox.moe/nek7x5.mp4",
      "https://files.catbox.moe/4pmh79.mp4",
      "https://files.catbox.moe/lwfpuu.mp4",
      "https://files.catbox.moe/53nkn5.mp4",
      "https://files.catbox.moe/fr3utj.mp4",
      "https://files.catbox.moe/pomw7e.mp4",
      "https://files.catbox.moe/ajzpya.mp4",
      "https://files.catbox.moe/4t4wu8.mp4",
      "https://files.catbox.moe/we2j1w.mp4",
      "https://files.catbox.moe/pmkmph.mp4"
    ];

    const url = videos[
      Math.floor(Math.random() * videos.length)
    ];

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxRedirects: 5,
        maxContentLength: 50 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const data = Buffer.from(response.data);
      const contentType =
        response.headers["content-type"] || "";

      if (
        data.length === 0 ||
        contentType.includes("text/html")
      ) {
        throw new Error("Invalid video response");
      }

      return api.sendMessage(
        {
          body:
            "╭━━━『 🎬 𝑺𝑳𝑶𝑾𝑬𝑫 𝑽𝑰𝑫𝑬𝑶 』━━━╮\n" +
            "┃\n" +
            "┃ 𓆩🖤𓆪 𝑹𝒂𝒏𝒅𝒐𝒎 𝑽𝒊𝒅𝒆𝒐\n" +
            "┃\n" +
            "┃ ♡ 𝑬𝒏𝒋𝒐𝒚 𝑻𝒉𝒆 𝑽𝒊𝒃𝒆𝒔 🎧\n" +
            "┃\n" +
            "┃ ⚡ 𝑴𝑨𝑫𝑬 𝑩𝒀 𝑺𝑯𝑰𝑺𝑯𝑰𝑹\n" +
            "┃\n" +
            "╰━━━━━━━━━━━━━━━━━━━━╯",
          attachment: data
        },
        event.threadID,
        event.messageID
      );
    } catch (error) {
      console.error(
        "[SOLOWED ERROR]",
        error.message
      );

      return api.sendMessage(
        "❌ 𝑽𝒊𝒅𝒆𝒐 𝑺𝒆𝒏𝒅 𝑭𝒂𝒊𝒍𝒆𝒅!\n\n" +
        "🖤 𝑪𝒂𝒕𝒃𝒐𝒙 𝒍𝒊𝒏𝒌 𝒄𝒉𝒆𝒄𝒌 𝒌𝒐𝒓𝒐.\n" +
        "⚡ 𝑻𝒓𝒚 𝑨𝒈𝒂𝒊𝒏 𝑳𝒂𝒕𝒆𝒓.",
        event.threadID,
        event.messageID
      );
    }
  }
};
