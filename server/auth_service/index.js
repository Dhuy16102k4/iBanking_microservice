const express = require('express')
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Auth Service DB connected'))
  .catch(err => console.error(err))

app.use('/', authRoutes)

app.listen(4002, () => console.log('Auth Service running on port 4002'))
