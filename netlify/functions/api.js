export async function handler(event) {
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
    const TOKEN = "T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"
    const FILE_NAME = "ids.txt"

    // 🔹 obtener gist
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`)
    const gist = await gistRes.json()

    let content = gist.files[FILE_NAME].content

    let ids = content.split("\n").filter(x => x.trim() !== "")

    if (action === "online") {
      if (!ids.includes(id)) ids.push(id)
    }

    if (action === "offline") {
      ids = ids.filter(x => x !== id)
    }

    const newContent = ids.join("\n")

    // 🔹 actualizar gist
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
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

    return {
      statusCode: 200,
      body: "OK"
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: "ERROR: " + err.message
    }
  }
}
