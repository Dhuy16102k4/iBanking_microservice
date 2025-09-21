const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/create', studentController.createStudent)

router.get('/', studentController.getAllStudents)

router.get('/:studentId', studentController.getStudentById)

router.delete('/:studentId', studentController.deleteStudent)

router.put('/:studentId', studentController.update)

module.exports = router
