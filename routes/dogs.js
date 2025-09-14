//routes for dog adoption app       
const express = require('express')
const { getDb } = require('../db')
const { ObjectId } = require('mongodb') 
const router = express.Router()

// Get all dogs with pagination
router.get('/', (req, res) => {
  const db = getDb()
  const page = parseInt(req.query.p) || 0
  const dogsPerPage = 3     

  let dogs = []
  db.collection('dogs')
    .find()
    .skip(page * dogsPerPage)
    .limit(dogsPerPage)
    .forEach((dog) => {
      dogs.push(dog)
    })
    .then(() => {
      res.json(dogs)
    })
    .catch((err) => {
      console.error(err)
      res.status(500).send('Error fetching dogs')
    })
})

router.post('/dogs', (req, res) => {
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


module.exports = router