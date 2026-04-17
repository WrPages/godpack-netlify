const fetch = require("node-fetch")

const TOKEN = process.env.GITHUB_TOKEN

const GROUPS = {
  Trainer: {
    ids: "4edcf4d341cd4f7d5d0fb8a50f8b8c3c",
    users: "1c066922bc39ac136b6f234fad6d9420",
    vip: "16541fd83785a49ad4a0f22bbeb06000",
    fileIds: "trainer_ids.txt",
    fileUsers: "trainer_users.json",
    fileVip: "trainer_vip.txt"
  },
  Gym_Leader: {
    ids: "e110c37b3e0b8de83a33a1b0a5eb64e8",
    users: "a3f5f3d8a2e6ddf2378fb3481dff49f6",
    vip: "79a0e30c401cfd63e78d9ec5a9210091",
    fileIds: "gym_ids.txt",
    fileUsers: "gym_users.json",
    fileVip: "gym_vip.txt"
  },
  Elite_Four: {
    ids: "d9db3a72fed74c496fd6cc830f9ca6e9",
    users: "bb18eda2ea748723d8fe0131dd740b70",
    vip: "5f2f23e0391882ab4e255bd67e98334a",
    fileIds: "elite_ids.txt",
    fileUsers: "elite_users.json",
    fileVip: "elite_vip.txt"
  }
}

exports.handler = async (event) => {
  try {

    const { action, id, group, userId, name } = event.queryStringParameters

    if (!GROUPS[group]) {
      return res("Invalid group", 400)
    }

    const cfg = GROUPS[group]

    // ===== HELPERS =====
    const getGist = async (gistId) => {
      const r = await fetch(`https://api.github.com/gists/${gistId}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json"
        }
      })
      return await r.json()
    }

    const updateGist = async (gistId, file, content) => {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          files: { [file]: { content } }
        })
      })
    }

    // ===== IDS =====
    if (["online","offline","toggle"].includes(action)) {

      if (!/^\d{16}$/.test(id)) return res("Invalid ID", 400)

      const gist = await getGist(cfg.ids)
      let ids = (gist.files[cfg.fileIds].content || "")
        .split("\n")
        .map(x=>x.trim())
        .filter(x=>x)

      if (action === "online") {
        if (!ids.includes(id)) ids.push(id)
      }

      if (action === "offline") {
        ids = ids.filter(x => x !== id)
      }

      if (action === "toggle") {
        ids = ids.includes(id)
          ? ids.filter(x => x !== id)
          : [...ids, id]
      }

      await updateGist(cfg.ids, cfg.fileIds, ids.join("\n") || "\u200B")

      return res("OK")
    }

    // ===== USERS =====
    if (["register","change","add_sec"].includes(action)) {

      const gist = await getGist(cfg.users)
      let users = JSON.parse(gist.files[cfg.fileUsers].content || "{}")

      if (!userId) return res("Missing userId", 400)

      if (action === "register") {
        users[userId] = {
          main_id: id,
          sec_id: null,
          name: name || "User"
        }
      }

      if (action === "change") {
        if (!users[userId]) return res("User not found", 400)
        users[userId].main_id = id
      }

      if (action === "add_sec") {
        if (!users[userId]) return res("User not found", 400)
        users[userId].sec_id = id
      }

      await updateGist(cfg.users, cfg.fileUsers, JSON.stringify(users, null, 2))

      return res("OK")
    }

    // ===== VIP =====
    if (action === "vip") {

      const gist = await getGist(cfg.vip)

      let ids = (gist.files[cfg.fileVip].content || "")
        .split("\n")
        .filter(x=>x)

      if (!ids.includes(id)) ids.push(id)

      await updateGist(cfg.vip, cfg.fileVip, ids.join("\n"))

      return res("OK")
    }

    return res("Invalid action", 400)

  } catch (err) {
    return res(err.message, 500)
  }
}

function res(msg, code=200){
  return {
    statusCode: code,
    body: msg
  }
}
