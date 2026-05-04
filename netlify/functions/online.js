const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const group = params.get("group");

    const allowedGroups = ["Trainer", "Gym_Leader", "Elite_Four"];

    if (!group || !allowedGroups.includes(group)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: "Invalid group"
      };
    }

    const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: "Missing Upstash environment variables"
      };
    }

    const key = `online:${group}`;

    const res = await fetch(
      `${UPSTASH_URL}/smembers/${encodeURIComponent(key)}`,
      {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`
        }
      }
    );

    const text = await res.text();

    if (!res.ok) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: "Redis error:\n" + text
      };
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: "Invalid Redis response"
      };
    }

    const ids = Array.isArray(data.result)
      ? data.result
          .map(x => String(x).trim())
          .filter(x => /^\d{16}$/.test(x))
      : [];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      },
      body: ids.join("\n")
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: "ERROR:\n" + err.message
    };
  }
};
