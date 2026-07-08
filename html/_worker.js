export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    if (url.pathname === "/") {
      url.pathname = "/molly/";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/dog-breeds/") {
      url.pathname = "/molly-dog-breeds/";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};

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

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Molly & Shaina Blog"',
      "content-type": "text/plain;charset=UTF-8",
    },
  });
}
