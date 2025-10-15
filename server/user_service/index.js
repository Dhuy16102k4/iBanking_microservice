const express = require('express')
const mongoose = require('mongoose')
const userRoutes = require('./routes/user')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('User Service DB connected'))
  .catch(err => console.error(err))

app.use('/', userRoutes)

app.listen(4001, () => console.log('User Service running on port 4001'))