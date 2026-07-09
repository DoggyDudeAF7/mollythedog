export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/posts") {
      return handlePostsApi(request, env);
    }

    if (url.hostname === "blog.mollyandshaina.com") {
      const assetUrl = new URL(request.url);

      if (assetUrl.pathname === "/") {
        assetUrl.pathname = "/blog/";
      }

      if (assetUrl.pathname === "/admin" || assetUrl.pathname.startsWith("/admin/")) {
        const authResponse = requireBlogAuth(request, env);
        if (authResponse) return authResponse;
        assetUrl.pathname = assetUrl.pathname.replace(/^\/admin\/?/, "/blog/admin/");
      }

      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (url.pathname === "/blog/admin" || url.pathname.startsWith("/blog/admin/")) {
      const authResponse = requireBlogAuth(request, env);
      if (authResponse) return authResponse;
    }

    if (url.pathname === "/dog-breeds/") {
      url.pathname = "/molly-dog-breeds/";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handlePostsApi(request, env) {
  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "cache-control": "no-store",
      },
    });
  }

  if (request.method === "GET") {
    return jsonResponse(await loadPosts(request, env));
  }

  if (request.method !== "PUT") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { allow: "GET, HEAD, PUT" },
    });
  }

  const authResponse = requireBlogAuth(request, env);
  if (authResponse) return authResponse;

  if (!env.BLOG_POSTS) {
    return jsonResponse({ error: "BLOG_POSTS KV binding is not configured." }, 503);
  }

  let posts;

  try {
    posts = await request.json();
  } catch {
    return jsonResponse({ error: "Posts must be valid JSON." }, 400);
  }

  if (!Array.isArray(posts)) {
    return jsonResponse({ error: "Posts must be an array." }, 400);
  }

  const cleanPosts = posts.map(cleanPost).filter((post) => post.title && post.body);

  await env.BLOG_POSTS.put("posts", JSON.stringify(cleanPosts));

  return jsonResponse(cleanPosts);
}

async function loadPosts(request, env) {
  if (env.BLOG_POSTS) {
    const storedPosts = await env.BLOG_POSTS.get("posts", "json");
    if (Array.isArray(storedPosts)) return storedPosts.map(cleanPost);
  }

  const fallbackUrl = new URL("/blog/posts.json", request.url);
  const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl, request));

  if (!fallbackResponse.ok) return [];

  try {
    const fallbackPosts = await fallbackResponse.json();
    return Array.isArray(fallbackPosts) ? fallbackPosts.map(cleanPost) : [];
  } catch {
    return [];
  }
}

function cleanPost(post) {
  return {
    id: String(post.id || slugify(post.title || `post-${Date.now()}`)),
    date: String(post.date || ""),
    title: String(post.title || ""),
    tag: String(post.tag || "Post"),
    body: String(post.body || ""),
    linkText: String(post.linkText || ""),
    linkUrl: String(post.linkUrl || ""),
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function requireBlogAuth(request, env) {
  const password = env.BLOG_ADMIN_PASSWORD;

  if (!password) {
    return new Response("Blog admin password is not configured.", {
      status: 503,
      headers: { "content-type": "text/plain;charset=UTF-8" },
    });
  }

  const authorization = request.headers.get("Authorization") || "";
  const [scheme, encoded] = authorization.split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    const enteredPassword = separator >= 0 ? decoded.slice(separator + 1) : "";

    if (enteredPassword === password) {
      return null;
    }
  }

  const realm = `Molly & Shaina Blog ${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}"`,
      "content-type": "text/plain;charset=UTF-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
    },
  });
}
