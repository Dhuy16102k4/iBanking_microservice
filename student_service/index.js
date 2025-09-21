const express = require('express')
const mongoose = require('mongoose')
const  studentRoute = require('./routes/student')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Student Service DB connected'))
  .catch(err => console.error(err))

app.use('/', studentRoute)

app.listen(4004, () => console.log('Student Service running on port 4004'))
