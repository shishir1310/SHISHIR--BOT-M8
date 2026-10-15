const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");

const FOLDER_ID = "1U4yM0YILj0dTx1tpYxK2Vasc3SSuoADC";
const TRIGGER_EMOJI = "🏯";
const CACHE_TTL = 10 * 60 * 1000;        // file list cache: 10 minutes
const COOLDOWN = 5 * 1000;               // per-thread cooldown: 5 seconds
const MAX_SIZE = 25 * 1024 * 1024;       // 25 MB attachment limit
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";

const VIDEO_EXT = [".mp4", ".mkv", ".mov", ".3gp", ".webm", ".avi"];
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const AUDIO_EXT = [".mp3", ".wav", ".m4a", ".ogg"];

module.exports.config = {
    name: "onlyanimevideo",
    aliases: ["oav"],
    version: "5.0.0",
    author: "𝔐𝔯.𝔎𝔦𝔫𝔤 ☠️✌🏼",
    role: 0,
    category: "media",
    guide: {
        en: `Use {p}oav for a random video, {p}oav sync to count files, or send '${TRIGGER_EMOJI}' to get a random video.`
    }
};

const state = { cache: null, cachedAt: 0, cooldowns: new Map() };

const react = (api, emoji, messageID) => api.setMessageReaction(emoji, messageID, () => {}, true);
const hasExt = (name, list) => list.some(ext => name.toLowerCase().endsWith(ext));
const decodeHtml = s =>
    s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
     .replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function fetchFileList(force = false) {
    if (!force && state.cache && Date.now() - state.cachedAt < CACHE_TTL) return state.cache;

    const headers = { "User-Agent": UA };
    let html;
    try {
        html = (await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`, { headers, timeout: 20000 })).data;
    } catch {
        html = (await axios.get(`https://docs.google.com/uc?export=list&id=${FOLDER_ID}`, { headers, timeout: 20000 })).data;
    }

    const files = new Map();

    // Primary: embedded folder view entries
    const entryRegex = /id="entry-([\w-]+)"[\s\S]*?class="flip-entry-title">([^<]*)</g;
    for (const m of html.matchAll(entryRegex)) {
        files.set(m[1], decodeHtml(m[2]));
    }

    // Fallback: old data format
    if (!files.size) {
        for (const m of html.matchAll(/"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g)) {
            files.set(m[1], m[2]);
        }
    }

    // Last fallback: raw links (names unknown, treated as video)
    if (!files.size) {
        for (const m of html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)) {
            files.set(m[1], "unknown.mp4");
        }
    }

    state.cache = [...files].map(([id, name]) => ({ id, name }));
    state.cachedAt = Date.now();
    return state.cache;
}

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    const msg = event.body ? event.body.trim() : "";
    if (msg === TRIGGER_EMOJI) return handleDriveMedia(api, event);
};

module.exports.onStart = async ({ api, event, args }) => {
    if (args[0] && args[0].toLowerCase() === "sync") return handleDriveSync(api, event);
    return handleDriveMedia(api, event);
};

async function handleDriveSync(api, event) {
    const { threadID, messageID } = event;
    try {
        react(api, "⏳", messageID);
        const files = await fetchFileList(true);

        const videos = files.filter(f => hasExt(f.name, VIDEO_EXT)).length;
        const pictures = files.filter(f => hasExt(f.name, IMAGE_EXT)).length;
        const music = files.filter(f => hasExt(f.name, AUDIO_EXT)).length;

        react(api, "✅", messageID);
        return api.sendMessage(
            `📁 Sync Successful!\n\n` +
            `• Total Files: ${files.length}\n` +
            `• Video Files: ${videos}\n` +
            `• Picture Files: ${pictures}\n` +
            `• Music Files: ${music}`,
            threadID, messageID
        );
    } catch (err) {
        console.error("[oav sync]", err.message);
        react(api, "❌", messageID);
        return api.sendMessage("❌ Sync failed!", threadID, messageID);
    }
}

async function handleDriveMedia(api, event) {
    const { threadID, messageID } = event;

    const last = state.cooldowns.get(threadID) || 0;
    if (Date.now() - last < COOLDOWN) return;
    state.cooldowns.set(threadID, Date.now());

    let filePath = null;
    const cleanup = () => { if (filePath) fs.remove(filePath).catch(() => {}); };

    try {
        react(api, "⏳", messageID);

        const files = await fetchFileList();
        const videos = files.filter(f => hasExt(f.name, VIDEO_EXT));

        if (!videos.length) {
            react(api, "❌", messageID);
            return api.sendMessage("📁 Couldn't find any video files 😒", threadID, messageID);
        }

        const pick = videos[Math.floor(Math.random() * videos.length)];
        react(api, "👀", messageID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);
        const ext = path.extname(pick.name) || ".mp4";
        filePath = path.join(cacheDir, `oav_${pick.id}_${Date.now()}${ext}`);

        const res = await axios({
            url: `https://drive.usercontent.google.com/download?id=${pick.id}&export=download&confirm=t`,
            method: "GET",
            responseType: "stream",
            headers: { "User-Agent": UA },
            timeout: 60000,
            maxRedirects: 5
        });

        const type = String(res.headers["content-type"] || "");
        const size = parseInt(res.headers["content-length"] || "0", 10);

        if (type.includes("text/html")) {
            res.data.destroy();
            throw new Error("Drive returned an HTML page instead of the file (quota or permission issue).");
        }
        if (size > MAX_SIZE) {
            res.data.destroy();
            react(api, "❌", messageID);
            cleanup();
            return api.sendMessage("❌ This video is too large to send. Try again for another one!", threadID, messageID);
        }

        await pipeline(res.data, fs.createWriteStream(filePath));

        return api.sendMessage(
            {
                body: `Here is a video from S H I S H I R ☠️✌🏼`,
                attachment: fs.createReadStream(filePath)
            },
            threadID,
            err => {
                cleanup();
                if (err) {
                    console.error("[oav send]", err);
                    react(api, "❌", messageID);
                    api.sendMessage("❌ Failed to send the video (it may be too large)!", threadID, messageID);
                } else {
                    react(api, "🔥", messageID);
                }
            },
            messageID
        );
    } catch (err) {
        console.error("[oav]", err.message);
        cleanup();
        react(api, "❌", messageID);
        api.sendMessage("❌ Failed to load a video from Drive.", threadID, messageID);
    }
}
