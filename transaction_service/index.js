const express = require('express')
const mongoose = require('mongoose')
//const  transactionRoute = require('./routes/transaction')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Transaction Service DB connected'))
  .catch(err => console.error(err))

//app.use('/transaction', authRoutes)

app.listen(4003, () => console.log('Transaction Service running on port 4003'))
