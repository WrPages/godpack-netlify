const fetch = require("node-fetch")
  exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters)
    const action = params.get("action")
    const id = params.get("id")

    if (!id) {
      return {
        statusCode: 400,
        body: "Falta ID"
      }
    }

    const GIST_ID = "1fc02ff0921e82b3af1d3101cee44e4c"
    const TOKEN = process.env.GITHUB_TOKEN
    const FILE_NAME = "ids.txt"

const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Cache-Control": "no-cache"
  }
})

const gist = await gistRes.json()

let content = gist.files[FILE_NAME]?.content || ""
let ids = content.split("\n").filter(x => x.trim() !== "")
    
if (action === "online") {
  ids = ids.filter(x => x !== id) // 🔥 limpiar duplicados
  ids.push(id)
}

if (action === "offline") {
  ids = ids.filter(x => x !== id) // 🔥 eliminar SIEMPRE
}
    let newContent = ids.join("\n")

// 🔥 evitar archivo vacío SIN mostrar texto
if (newContent.trim() === "") {
  newContent = "\u200B" // invisible
}



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
