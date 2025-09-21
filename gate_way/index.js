const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()


app.use('/users', createProxyMiddleware({ target: 'http://users:4001', changeOrigin: true }))
app.use('/auth', createProxyMiddleware({ target: 'http://auth:4002', changeOrigin: true }))
app.use('/transaction', createProxyMiddleware({ target: 'http://transaction:4003', changeOrigin: true }))
app.use('/student', createProxyMiddleware({ target: 'http://student:4004', changeOrigin: true }))
app.use('/tuition', createProxyMiddleware({ target: 'http://tuition:4005', changeOrigin: true }))
app.use('/otp', createProxyMiddleware({ target: 'http://otp:4006', changeOrigin: true }))




app.listen(4000, () => console.log('Gateway running on port 4000'))
