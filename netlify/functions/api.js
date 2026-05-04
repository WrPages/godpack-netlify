const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});

    const action = params.get("action");
    const id = String(params.get("id") || "").trim();
    const group = params.get("group");

    if (!action) {
      return { statusCode: 400, body: "Missing action" };
    }

    if (!["online", "offline"].includes(action)) {
      return { statusCode: 400, body: "Invalid action" };
    }

    if (!/^\d{16}$/.test(id)) {
      return { statusCode: 400, body: "Invalid ID. Must be 16 digits." };
    }

    if (!group) {
      return { statusCode: 400, body: "Missing group" };
    }

    const GROUP_GISTS = {
      Trainer: "4edcf4d341cd4f7d5d0fb8a50f8b8c3c",
      Gym_Leader: "e110c37b3e0b8de83a33a1b0a5eb64e8",
      Elite_Four: "d9db3a72fed74c496fd6cc830f9ca6e9"
    };

    const GROUP_FILES = {
      Trainer: "trainer_ids.txt",
      Gym_Leader: "gym_ids.txt",
      Elite_Four: "elite_ids.txt"
    };

    const GIST_ID = GROUP_GISTS[group];
    const FILE_NAME = GROUP_FILES[group];

    if (!GIST_ID || !FILE_NAME) {
      return { statusCode: 400, body: "Invalid group" };
    }

    const TOKEN = process.env.GITHUB_TOKEN;

    if (!TOKEN) {
      return {
        statusCode: 500,
        body: "Missing GITHUB_TOKEN in Netlify environment variables"
      };
    }

    // 1) Leer Gist
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Zenith-Rise-Netlify-API"
      }
    });

    const gistText = await gistRes.text();

    if (!gistRes.ok) {
      return {
        statusCode: gistRes.status,
        body:
          "GITHUB READ ERROR:\n" +
          gistText
      };
    }

    let gist;

    try {
      gist = JSON.parse(gistText);
    } catch (e) {
      return {
        statusCode: 500,
        body: "Invalid JSON from GitHub:\n" + gistText
      };
    }

    if (!gist.files || !gist.files[FILE_NAME]) {
      return {
        statusCode: 500,
        body: `File ${FILE_NAME} not found in gist ${GIST_ID}`
      };
    }

    const oldContent = gist.files[FILE_NAME].content || "";

    let ids = oldContent
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(x => x !== "" && x !== "\u200B");

    // Quitar duplicado antes de modificar
    ids = ids.filter(x => x !== id);

    if (action === "online") {
      ids.push(id);
    }

    if (action === "offline") {
      // ya fue removido arriba
    }

    let newContent = ids.join("\n");

    if (newContent.trim() === "") {
      newContent = "\u200B";
    }

    // 2) Si no cambió nada, no gastes PATCH
    if (newContent === oldContent) {
      return {
        statusCode: 200,
        body: "OK - No changes needed"
      };
    }

    // 3) Guardar Gist
    const updateRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Zenith-Rise-Netlify-API"
      },
      body: JSON.stringify({
        files: {
          [FILE_NAME]: {
            content: newContent
          }
        }
      })
    });

    const updateText = await updateRes.text();

    if (!updateRes.ok) {
      return {
        statusCode: updateRes.status,
        body: "GITHUB UPDATE ERROR:\n" + updateText
      };
    }

    return {
      statusCode: 200,
      body: "OK"
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "ERROR:\n" + err.stack
    };
  }
};
