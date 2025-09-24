const express = require('express')
const router = express.Router()
const tuitionController = require('../controllers/tuitionController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/', tuitionController.createTuition)

// Lấy học phí theo studentId
router.get('/student/:studentId', tuitionController.getStudentWithTuition)

// Lấy học phí theo tuition _id
router.get('/id/:id', tuitionController.getTuitionById)



router.delete('/:id', tuitionController.deleteTuition)


router.patch('/:tuitionId', tuitionController.updateTuition)

module.exports = router
