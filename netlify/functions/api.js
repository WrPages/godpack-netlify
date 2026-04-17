const fetch = require("node-fetch")

exports.handler = async (event) => {
  try {

    const { action, id, group } = event.queryStringParameters

    if (!id || !/^\d{16}$/.test(id)) {
      return { statusCode: 400, body: "Invalid ID" }
    }

    if (!group) {
      return { statusCode: 400, body: "Missing group" }
    }

    const GROUP_GISTS = {
      Trainer: "4edcf4d341cd4f7d5d0fb8a50f8b8c3c",
      Gym_Leader: "e110c37b3e0b8de83a33a1b0a5eb64e8",
      Elite_Four: "d9db3a72fed74c496fd6cc830f9ca6e9"
    }

    const GROUP_FILES = {
      Trainer: "trainer_ids.txt",
      Gym_Leader: "gym_ids.txt",
      Elite_Four: "elite_ids.txt"
    }

    const GIST_ID = GROUP_GISTS[group]
    const FILE_NAME = GROUP_FILES[group]

    if (!GIST_ID) {
      return { statusCode: 400, body: "Invalid group" }
    }

    const TOKEN = process.env.GITHUB_TOKEN

    // 🔥 LEER GIST
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}?t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "Cache-Control": "no-cache"
      }
    })

    const gist = await gistRes.json()

    let content = gist.files[FILE_NAME]?.content || ""

    let ids = content
      .split("\n")
      .map(x => x.trim())
      .filter(x => x && x !== "\u200B")

    // ===== LÓGICA =====

    if (action === "online") {
      if (!ids.includes(id)) ids.push(id)
    }

    else if (action === "offline") {
      ids = ids.filter(x => x !== id)
    }

    else if (action === "toggle") {
      if (ids.includes(id)) {
        ids = ids.filter(x => x !== id)
      } else {
        ids.push(id)
      }
    }

    else {
      return { statusCode: 400, body: "Invalid action" }
    }

    let newContent = ids.join("\n") || "\u200B"

    // 🔥 GUARDAR
    const updateRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        files: {
          [FILE_NAME]: { content: newContent }
        }
      })
    })

    if (!updateRes.ok) {
      const err = await updateRes.text()
      return { statusCode: 500, body: err }
    }

    return { statusCode: 200, body: "OK" }

  } catch (err) {
    return {
      statusCode: 500,
      body: err.message
    }
  }
}
