const express = require('express')
const mongoose = require('mongoose')
const tuitionRoutes = require('./routes/tuition')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Tuition Service DB connected'))
  .catch(err => console.error(err))

app.use('/', tuitionRoutes)

app.listen(4005, () => console.log('Tuition Service running on port 4005'))
