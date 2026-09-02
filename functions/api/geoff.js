export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

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
