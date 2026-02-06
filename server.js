const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const server = express();
const DB_FILE = path.join(__dirname, 'db.json');

server.use(cors());
server.use(express.json());
server.use(express.static(path.join(__dirname)));

// Load database
function loadDB() {
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save database
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Helper functions
function getMaxId(items) {
  if (!items || items.length === 0) return 0;
  return Math.max(...items.map(item => parseInt(item.id, 10) || 0));
}

function generateId(items) {
  return String(getMaxId(items) + 1);
}

function formatDeletedItem(item) {
  if (item.isDeleted) {
    return {
      ...item,
      title: item.title ? `~~${item.title}~~` : undefined,
      text: item.text ? `~~${item.text}~~` : undefined
    };
  }
  return item;
}

// POST - Create new post with auto-increment ID
server.post('/posts', (req, res) => {
  try {
    const data = loadDB();
    const posts = data.posts;
    
    if (!req.body.id) {
      req.body.id = generateId(posts);
    }
    req.body.isDeleted = req.body.isDeleted || false;
    
    posts.push(req.body);
    saveDB(data);
    
    res.json(formatDeletedItem(req.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Create new comment with auto-increment ID
server.post('/comments', (req, res) => {
  try {
    const data = loadDB();
    const comments = data.comments;
    
    if (!req.body.id) {
      req.body.id = generateId(comments);
    }
    req.body.isDeleted = req.body.isDeleted || false;
    
    comments.push(req.body);
    saveDB(data);
    
    res.json(formatDeletedItem(req.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Display posts with soft delete styling
server.get('/posts', (req, res) => {
  try {
    const data = loadDB();
    const posts = data.posts;
    const formattedPosts = posts.map(formatDeletedItem);
    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Display comments with soft delete styling
server.get('/comments', (req, res) => {
  try {
    const data = loadDB();
    const comments = data.comments;
    const formattedComments = comments.map(formatDeletedItem);
    res.json(formattedComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get single post by ID with soft delete styling
server.get('/posts/:id', (req, res) => {
  try {
    const data = loadDB();
    const posts = data.posts;
    const post = posts.find(p => p.id === req.params.id);
    if (post) {
      res.json(formatDeletedItem(post));
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get single comment by ID with soft delete styling
server.get('/comments/:id', (req, res) => {
  try {
    const data = loadDB();
    const comments = data.comments;
    const comment = comments.find(c => c.id === req.params.id);
    if (comment) {
      res.json(formatDeletedItem(comment));
    } else {
      res.status(404).json({ error: 'Comment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Soft delete for posts (set isDeleted: true)
server.patch('/posts/:id', (req, res) => {
  try {
    const data = loadDB();
    const posts = data.posts;
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    Object.assign(post, req.body);
    saveDB(data);
    
    res.json(formatDeletedItem(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Soft delete for comments
server.patch('/comments/:id', (req, res) => {
  try {
    const data = loadDB();
    const comments = data.comments;
    const comment = comments.find(c => c.id === req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    Object.assign(comment, req.body);
    saveDB(data);
    
    res.json(formatDeletedItem(comment));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Soft delete for posts
server.delete('/posts/:id', (req, res) => {
  try {
    const data = loadDB();
    const posts = data.posts;
    const index = posts.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    posts[index].isDeleted = true;
    saveDB(data);
    
    res.json({ message: 'Post soft deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Soft delete for comments
server.delete('/comments/:id', (req, res) => {
  try {
    const data = loadDB();
    const comments = data.comments;
    const index = comments.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comments[index].isDeleted = true;
    saveDB(data);
    
    res.json({ message: 'Comment soft deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;
const app = server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

// Error handling
app.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
