const fetch = require("node-fetch")

exports.handler = async (event) => {
  try {

    const params = new URLSearchParams(event.queryStringParameters)

    const action = params.get("action")
    const id = params.get("id")
    const group = params.get("group") // 🔥 NUEVO

    if (!id) {
      return {
        statusCode: 400,
        body: "Missing ID"
      }
    }

    if (!group) {
      return {
        statusCode: 400,
        body: "Missing group"
      }
    }

    // 🔥 MAPEO DE GRUPOS A GISTS
    const GROUP_GISTS = {
      Trainer: "GIST_IDS_TRAINER",
      Gym_Leader: "GIST_IDS_GYM",
      Elite_Four: "GIST_IDS_ELITE"
    }

    const GIST_ID = GROUP_GISTS[group]

    if (!GIST_ID) {
      return {
        statusCode: 400,
        body: "Invalid group"
      }
    }

    const TOKEN = process.env.GITHUB_TOKEN
    const FILE_NAME = "ids.txt"

    // 🔎 Obtener gist correcto según grupo
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
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
      .filter(x => x !== "" && x !== "\u200B")

    // 🟢 ONLINE
    if (action === "online") {
      ids = ids.filter(x => x !== id)
      ids.push(id)
    }

    // 🔴 OFFLINE
    if (action === "offline") {
      ids = ids.filter(x => x !== id)
    }

    let newContent = ids.join("\n")

    // 🔥 evitar archivo vacío
    if (newContent.trim() === "") {
      newContent = "\u200B"
    }

    // 🔄 Actualizar gist del grupo
    const updateRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        files: {
          [FILE_NAME]: {
            content: newContent
          }
        }
      })
    })

    const updateText = await updateRes.text()

    if (!updateRes.ok) {
      return {
        statusCode: 500,
        body: "GIST ERROR:\n" + updateText
      }
    }

    return {
      statusCode: 200,
      body: "OK"
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: "ERROR:\n" + err.message
    }
  }
}