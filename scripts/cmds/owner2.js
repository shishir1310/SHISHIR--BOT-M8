const axios = require("axios");
const moment = require("moment-timezone");

const API_CONFIG_URL =
  "https://raw.githubusercontent.com/goatbotnx/xalmanx210/refs/heads/main/apis.json";

const API_KEY = "xalman-hub";
let apiBaseUrl = null;
let apiConfigRequest = null;

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;

  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const baseUrl = data?.[API_KEY];

        if (typeof baseUrl !== "string" || !baseUrl.trim()) {
          throw new Error(`Missing API key in apis.json: ${API_KEY}`);
        }

        apiBaseUrl = baseUrl.replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }

  return apiConfigRequest;
}

module.exports = {
  config: {
    name: "owner2",
    aliases: ["admininfo", "info", "ownerinfo"],
    version: "3.0",
    author: "SHISHIR",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Show owner information"
    },
    category: "owner",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, message }) {

    const ownerName = "Ahmed’s SHI'SHIR";
    const ownerAge = "17";
    const fbName = "AhmeD’z SHI'SHIR";
    const messenger = "https://www.facebook.com/profile.php?id=61592841571046&mibextid=ZbWKwL";
    const whatsapp = "01749--26";
    const telegram = "@AhmeD'z shi'shir";
    const address = "Sirajganj, Dhaka, Bangladesh";
    const religion = "Islam";
    const relationship = "Single";
    const videoLink = "https://files.catbox.moe/mz89py.mp4";

    let apiServer = "SHISHIR ";

    try {
      apiServer = await getApiBaseUrl();
    } catch (e) {
      apiServer = "SHISHIR ";
    }

    const timeBD = moment().tz("Asia/Dhaka");

    const infoMsg =
`╭━━━〔 𝑶𝑾𝑵𝑬𝑹 𝑰𝑵𝑭𝑶 〕━━━╮
┃
┃ 👑 𝑨𝑩𝑶𝑼𝑻 𝑴𝑬
┃ ─────────────────
┃ ✦ 𝑵𝒂𝒎𝒆 : ${ownerName}
┃ ✦ 𝑨𝒈𝒆 : ${ownerAge}
┃ ✦ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏 : ${relationship}
┃ ✦ 𝑹𝒆𝒍𝒊𝒈𝒊𝒐𝒏 : ${religion}
┃ ✦ 𝑨𝒅𝒅𝒓𝒆𝒔𝒔 : ${address}
┃
┃ 📱 𝑪𝑶𝑵𝑻𝑨𝑪𝑻
┃ ─────────────────
┃ ✦ 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 : ${fbName}
┃ ✦ 𝑭𝒃 𝑳𝒊𝒏𝒌 : ${messenger}
┃ ✦ 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 : ${whatsapp}
┃ ✦ 𝑻𝒆𝒍𝒆𝒈𝒓𝒂𝒎 : ${telegram}
┃
┃ ⚡ 𝑺𝑬𝑹𝑽𝑬𝑹
┃ ─────────────────
┃ ✦ 𝑨𝑷𝑰 : ${apiServer}
┃
┃ 🕐 𝑫𝑨𝑻𝑬 & 𝑻𝑰𝑴𝑬
┃ ─────────────────
┃ ✦ ${timeBD.format("DD MMMM, YYYY")}
┃ ✦ ${timeBD.format("hh:mm:ss A")}
┃
╰━━━〔 𝑴𝑨𝑫𝑬 𝑩𝒀 𝑺𝑯𝑰𝑺𝑯𝑰𝑹 〕━━━╯`;

    try {
      return message.reply({
        body: infoMsg,
        attachment: await global.utils.getStreamFromURL(videoLink)
      });
    } catch (e) {
      return message.reply(infoMsg);
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "info") {
      return this.onStart({ message, event });
    }
  }
};
