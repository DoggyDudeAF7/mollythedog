export async function onRequestPost(context) {
  try {
    const apiKey = String(context.env.OLLAMA_API_KEY || "").trim();
    if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 503 });

    const body = await context.request.json();
    const incoming = Array.isArray(body?.messages) ? body.messages.slice(-40) : [];
    const messages = incoming.flatMap((message) => {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") return [];
      const clean = { role: message.role, content: message.content.slice(0, 12000) };
      if (message.role === "user" && Array.isArray(message.images)) {
        const images = message.images.filter((image) => typeof image === "string" && image.length <= 8_000_000).slice(0, 4);
        if (images.length) clean.images = images;
      }
      return [clean];
    });

    if (!messages.length) return Response.json({ error: "A message is required." }, { status: 400 });
    const hasImages = messages.some((message) => message.images?.length);
    const system = {
      role: "system",
      content: "You are a general-purpose AI assistant. You are not Geoff and you are not a website character. Never claim to be Geoff. Answer as a normal, helpful AI: accurate, friendly, clear, and direct. Use GitHub-flavoured Markdown whenever it improves readability. If images are supplied, examine them carefully and answer the user's question about them. If uncertain, say so instead of inventing facts."
    };

    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: hasImages ? "gemma3:4b-cloud" : "gpt-oss:20b-cloud",
        messages: [system, ...messages],
        stream: false,
        think: false
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("AI provider error:", response.status, data?.error || "Unknown error");
      return Response.json({ error: "The AI could not answer." }, { status: 502 });
    }

    return Response.json({ answer: data?.message?.content || "I didn't receive an answer." });
  } catch (error) {
    console.error("AI chat error:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
