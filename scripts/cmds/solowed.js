const axios = require("axios");

module.exports = {
  config: {
    name: "solowed",
    aliases: ["slow", "slowed"],
    version: "3.0.0",
    author: "SHISHIR",
    countDown: 5,
    role: 0,
    description: {
      en: "Random Slowed Video from Catbox"
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

    const send = (message) => {
      return new Promise((resolve, reject) => {
        api.sendMessage(
          message,
          event.threadID,
          (err, info) => {
            if (err) return reject(err);
            resolve(info);
          },
          event.messageID
        );
      });
    };

    try {
      // প্রথমেই কাজ শুরু হওয়ার খবর পাঠাবে
      await send("🎬 𝑺𝑯𝑰𝑺𝑯𝑰𝑹 | 𝑺𝑳𝑶𝑾𝑬𝑫\n\n⏳ Video loading...");

      // Random video নির্বাচন
      const url =
        videos[Math.floor(Math.random() * videos.length)];

      console.log("[SOLOWED] Downloading:", url);

      // Catbox থেকে video stream নেওয়া
      const response = await axios.get(url, {
        responseType: "stream",
        timeout: 120000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const contentType =
        response.headers["content-type"] || "";

      if (contentType.toLowerCase().includes("text/html")) {
        response.data.destroy();
        throw new Error("Catbox returned an HTML page, not a video");
      }

      let streamError = null;

      response.data.on("error", (err) => {
        streamError = err;
        console.error("[SOLOWED STREAM ERROR]", err.message);
      });

      // Messenger-এ video পাঠানো
      await send({
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
        attachment: response.data
      });

      console.log(
        "[SOLOWED] Video send request completed.",
        streamError ? streamError.message : ""
      );
    } catch (error) {
      console.error("[SOLOWED ERROR]", error.stack || error.message);

      try {
        await send(
          "╭━━━『 ⚠️ 𝑺𝑳𝑶𝑾𝑬𝑫 』━━━╮\n" +
          "┃ ❌ Video send failed!\n" +
          "┃ 🖤 Catbox/API error check করো।\n" +
          "┃ ⚡ MADE BY SHISHIR\n" +
          "╰━━━━━━━━━━━━━━━━━━━━╯"
        );
      } catch (sendError) {
        console.error(
          "[SOLOWED MESSAGE ERROR]",
          sendError.stack || sendError.message
        );
      }
    }
  }
};
