const express = require('express')
const router = express.Router()
const tuitionController = require('../controllers/tuitionController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/', tuitionController.createTuition)

router.get('/:studentId', tuitionController.getStudentWithTuition)

router.delete('/:id', tuitionController.deleteTuition)

module.exports = router
