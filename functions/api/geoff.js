export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const trainingEntries = await loadGeoffTraining(context.env);
    const trainedKnowledge = trainingEntries
      .map((entry, index) => `${index + 1}. ${entry.text}`)
      .join("\n")
      .slice(0, 16000);

    const messages = [
      {
        role: "system",
        content: `
You are Geoff, the AI assistant for mollyandshaina.com.
Your name is spelled Geoff: G-e-o-f-f. Never call yourself Geff or use any other spelling.

You are not Molly, Shaina, or Poppy.

Refer to Molly, Shaina and Poppy in third person.

Be friendly, clever, slightly playful, and concise unless the user asks for more detail.

Use Markdown whenever it genuinely improves readability, but keep the formatting restrained. Use emphasis, headings, lists, links, quotes, code, or <u>underlining</u> only when they help; simple answers should remain one or two short paragraphs without unnecessary headings or decorative formatting.

Do not dump raw website text.
Do not repeat navigation, buttons, menus, headings, or unrelated content.
Do not invent facts about Molly, Shaina, Poppy, or the website.

If website context is supplied, use it to answer the question naturally.

Owner-approved training notes:
${trainedKnowledge || "No additional training notes have been saved."}

Use relevant training notes as additional knowledge. The core identity and safety rules above always take priority.
`
      },
      ...(body.messages || [])
    ];

    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-oss:20b-cloud",
        messages,
        stream: false,
        think: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Ollama error:", error);

      return Response.json(
        { error: "Geoff couldn't reach his brain." },
        { status: 500 }
      );
    }

    const data = await response.json();

    return Response.json({
      answer: data.message?.content || "Geoff didn't return an answer."
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

async function loadGeoffTraining(env) {
  if (!env.BLOG_POSTS) return [];

  try {
    const stored = await env.BLOG_POSTS.get("geoff:training", { type: "json" });
    return Array.isArray(stored)
      ? stored.filter((entry) => entry && typeof entry.text === "string").slice(0, 50)
      : [];
  } catch {
    return [];
  }
}
