export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/posts") {
      return handlePostsApi(request, env);
    }

    if (url.pathname.startsWith("/api/images/")) {
      return handleImageApi(request, env);
    }

    if (url.pathname === "/api/login") {
      return handleLoginApi(request, env);
    }

    if (url.pathname === "/api/logout") {
      return handleLogoutApi();
    }

    if (url.hostname === "blog.mollyandshaina.com") {
      const assetUrl = new URL(request.url);

      if (assetUrl.pathname === "/") {
        assetUrl.pathname = "/blog/";
      }

      if (assetUrl.pathname === "/admin/login" || assetUrl.pathname.startsWith("/admin/login/")) {
        assetUrl.pathname = assetUrl.pathname.replace(/^\/admin\/?/, "/blog/admin/");
      } else if (assetUrl.pathname === "/admin" || assetUrl.pathname.startsWith("/admin/")) {
        const authResponse = await requireBlogAuth(request, env, "/admin/login/");
        if (authResponse) return authResponse;
        assetUrl.pathname = assetUrl.pathname.replace(/^\/admin\/?/, "/blog/admin/");
      }

      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (
      (url.pathname === "/blog/admin" || url.pathname.startsWith("/blog/admin/")) &&
      !(url.pathname === "/blog/admin/login" || url.pathname.startsWith("/blog/admin/login/"))
    ) {
      const authResponse = await requireBlogAuth(request, env, "/blog/admin/login/");
      if (authResponse) return authResponse;
    }

    if (url.pathname === "/dog-breeds/") {
      url.pathname = "/molly-dog-breeds/";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/dog-breeds") {
      url.pathname = "/molly-dog-breeds/";
      return Response.redirect(url.toString(), 301);
    }

    if (shouldServeNotFound(url.pathname)) {
      return fetchNotFoundPage(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

const pagePaths = new Set([
  "/",
  "/404/",
  "/blog/",
  "/blog/admin/",
  "/blog/admin/login/",
  "/breed-quiz/",
  "/certificate-editor/",
  "/dog-breeds/",
  "/html/",
  "/kitchen-game/",
  "/molly/",
  "/molly-dog-breeds/",
  "/molly-faq/",
  "/molly-gallery/",
  "/molly-habits/",
  "/molly-mind/",
  "/molly-traits/",
  "/secret-control-panel/",
  "/shaina/",
  "/shaina-faq/",
  "/shaina-gallery/",
  "/shaina-habits/",
  "/shaina-home/",
  "/shaina-mind/",
  "/shaina-traits/",
  "/test/",
]);

const assetPathPrefixes = [
  "/assets/",
  "/css/",
  "/images/",
  "/js/",
];

function shouldServeNotFound(pathname) {
  if (pathname.startsWith("/api/")) return false;
  if (assetPathPrefixes.some(prefix => pathname.startsWith(prefix))) return false;
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;

  const normalizedPath = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
  return !pagePaths.has(normalizedPath);
}

async function fetchNotFoundPage(request, env) {
  const notFoundUrl = new URL("/404/", request.url);
  const response = await env.ASSETS.fetch(new Request(notFoundUrl, request));
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");

  return new Response(response.body, {
    status: 404,
    statusText: "Not Found",
    headers,
  });
}

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

  const authResponse = await requireBlogAuth(request, env);
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

  const cleanPosts = [];

  for (const post of posts) {
    const clean = cleanPost(post);
    if (!clean.title || !clean.body) continue;

    if (clean.image.startsWith("data:image/")) {
      await env.BLOG_POSTS.put(`image:${clean.id}`, clean.image);
      clean.image = `/api/images/${encodeURIComponent(clean.id)}`;
    } else if (!clean.image) {
      await env.BLOG_POSTS.delete(`image:${clean.id}`);
    }

    cleanPosts.push(clean);
  }

  await env.BLOG_POSTS.put("posts", JSON.stringify(cleanPosts));

  return jsonResponse(cleanPosts);
}

async function handleImageApi(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  if (!env.BLOG_POSTS) {
    return new Response("Image storage is not configured.", { status: 503 });
  }

  const url = new URL(request.url);
  const id = decodeURIComponent(url.pathname.replace("/api/images/", ""));
  const image = await env.BLOG_POSTS.get(`image:${id}`);

  if (!image || !image.startsWith("data:image/")) {
    return new Response("Image not found.", { status: 404 });
  }

  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return new Response("Invalid image.", { status: 415 });
  }

  const [, contentType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Response(request.method === "HEAD" ? null : bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

async function handleLoginApi(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const password = env.BLOG_ADMIN_PASSWORD;
  if (!password) {
    return jsonResponse({ error: "Blog admin password is not configured." }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter the admin password." }, 400);
  }

  if (String(body.password || "") !== password) {
    return jsonResponse({ error: "Wrong password." }, 401);
  }

  const token = await createSessionToken(env);

  return jsonResponse({ ok: true }, 200, {
    "set-cookie": buildSessionCookie(token),
  });
}

function handleLogoutApi() {
  return jsonResponse({ ok: true }, 200, {
    "set-cookie": "blog_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
  });
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
    image: String(post.image || ""),
    imageAlt: String(post.imageAlt || ""),
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

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

async function requireBlogAuth(request, env, loginPath = null) {
  const password = env.BLOG_ADMIN_PASSWORD;

  if (!password) {
    return new Response("Blog admin password is not configured.", {
      status: 503,
      headers: { "content-type": "text/plain;charset=UTF-8" },
    });
  }

  if (await hasValidSession(request, env)) {
    return null;
  }

  if (loginPath) {
    const loginUrl = new URL(loginPath, request.url);
    return Response.redirect(loginUrl.toString(), 302);
  }

  return jsonResponse({ error: "Authentication required." }, 401);
}

async function hasValidSession(request, env) {
  const token = getCookie(request, "blog_session");
  if (!token) return false;

  const [expires, signature] = token.split(".");
  const expiryTime = Number(expires);

  if (!expires || !signature || !Number.isFinite(expiryTime) || expiryTime < Date.now()) {
    return false;
  }

  const expectedSignature = await signSessionValue(expires, env);
  return timingSafeEqual(signature, expectedSignature);
}

async function createSessionToken(env) {
  const expires = String(Date.now() + 1000 * 60 * 60 * 12);
  const signature = await signSessionValue(expires, env);
  return `${expires}.${signature}`;
}

async function signSessionValue(value, env) {
  const secret = env.BLOG_ADMIN_PASSWORD;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(signature);
}

function buildSessionCookie(token) {
  return `blog_session=${token}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Lax`;
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : "";
}

function base64UrlEncode(buffer) {
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return result === 0;
}
