const express = require('express')
const { getDb, connectToDb } = require('./db')
const { ObjectId } = require('mongodb')

// init app & middleware
const app = express()
app.use(express.json())

// db connection
let db

connectToDb((err) => {
  if(!err){
    app.listen('3000', () => {
      console.log('app listening on port 3000');
    });
    db = getDb();
    console.log('connected to database');
  }
});

// routes
app.get('/dogs', (req, res) => {
  // current page
  const page = req.query.p || 0
  const dogsPerPage = 3

  let dogs = []

  db.collection('dogs')
    .find()
    .sort({author: 1})
    .skip(page * dogsPerPage)
    .limit(dogsPerPage)
    .forEach(dog => dogs.push(dog))
    .then(() => {
      res.status(200).json(dogs)
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the documents'})
    })
})

app.post('/dogs', (req, res) => {
  const dog = req.body

  db.collection('dogs')
    .insertOne(dog)
    .then(result => {
      res.status(201).json(result)
    })
    .catch(err => {
      res.status(500).json({err: 'Could not create add dog'})
    })
})