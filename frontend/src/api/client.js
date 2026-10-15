const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export async function request(path, body, options = {}) {
  let response;
  try {
    response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "We couldn’t reach the game server. Your progress is safe. Please try again.",
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      response.status >= 500
        ? "The game server needs a moment. Please try again."
        : error.message || "That request could not be completed.",
    );
  }
  return options.download ? response.blob() : response.json();
}
