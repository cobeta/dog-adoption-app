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
app.use('/dogs', require('./routes/dogs'))

app.use('/auth', require('./routes/authRoutes'))