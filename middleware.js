module.exports = (req, res, next) => {
  const db = req.app.db;

  // ==========================
  // AUTO ID POSTS
  // ==========================
  if (req.method === "POST" && req.path === "/posts") {
    const posts = db.get("posts").value();
    const maxId = posts.length
      ? Math.max(...posts.map((p) => Number(p.id)))
      : 0;

    req.body.id = String(maxId + 1);
    req.body.isDeleted = false;
  }

  // ==========================
  // AUTO ID COMMENTS
  // ==========================
  if (req.method === "POST" && req.path === "/comments") {
    const comments = db.get("comments").value();
    const maxId = comments.length
      ? Math.max(...comments.map((c) => Number(c.id)))
      : 0;

    req.body.id = String(maxId + 1);
    req.body.isDeleted = false;
  }

  next();
};
