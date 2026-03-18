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
    const TOKEN = "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"
    const FILE_NAME = "ids.txt"

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
