const express = require('express')
const router = express.Router()
const client = require('../db')
const postList = require('../views/postList')
const postDetails = require('../views/postDetails')
const addPost = require('../views/addPost')

const baseQuery = "SELECT posts.*, users.name, counting.upvotes FROM posts INNER JOIN users ON users.id = posts.userId INNER JOIN (SELECT postId, COUNT(*) as upvotes FROM upvotes GROUP BY postId) AS counting ON posts.id = counting.postId\n";

router.get("/", async (req, res, next) => {
  try {
    const data = await client.query(baseQuery);
    res.send(postList(data.rows));
  } catch (error) { next(error) }
});

router.get('/add', (req, res, next) => {
  res.send(addPost())
})

router.get("/:id", async (req, res, next) => {
  try {
    const data = await client.query(baseQuery + "WHERE posts.id = $1", [req.params.id]);
    const post = data.rows[0];
    res.send(postDetails(post));
  } catch (error) { next(error) }
});

router.get("/add", (req, res) => {
  res.send(addPost());
});

router.post('/', async (req, res, next) => {
  const {name, title, content} = req.body
  try {
    let userData = await client.query('SELECT * FROM users WHERE users.name = $1', [req.body.name])
    if (!userData.rows.length){
      const userData = await client.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [req.body.name]);
    }
    const userId = userData.rows[0].id
    const postData = await client.query('INSERT INTO posts (userId, title, content) VALUES ($1, $2, $3) RETURNING *', [userId, req.body.title, req.body.content])
    const postId = postData.rows[0].id
    const upvoteData = await client.query('INSERT INTO upvotes (userId, postId) VALUES ($1, $2) RETURNING *', [userId, postId])
    res.redirect(`/posts/${postId}`)
  } catch (error) {
    next(error)
  }
})

module.exports = router
