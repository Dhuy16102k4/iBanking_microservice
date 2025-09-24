const express = require('express')
const mongoose = require('mongoose')
const  otpRoutes = require('./routes/otp')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Otp Service DB connected'))
  .catch(err => console.error(err))

app.use('/', otpRoutes)

app.listen(4006, () => console.log('Otp Service running on port 4006'))
