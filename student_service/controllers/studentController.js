const Student = require('../models/student')

class StudentController {

    async createStudent(req, res) {
        try {
            const student = await Student.create(req.body)
            res.json(student)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }

    async getStudentById(req, res) {
        try {
            const student = await Student.findOne({ studentId: req.params.studentId })
            if (!student) return res.status(404).json({ message: 'Student not found' })
            res.json(student)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }

    async getAllStudents(req, res) {
        try {
            const students = await Student.find()
            res.json(students)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }

    async deleteStudent(req, res) {
        try {
            const student = await Student.findOneAndDelete({ studentId: req.params })
            if (!student) return res.status(404).json({ message: 'Student not found' })
            res.json({ message: 'Student deleted' })
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }
    async update(req, res) {
        try {
            const student = await Student.findOneAndUpdate({ studentId: req.params.studentId },req.body,{ new: true })
            if (!student) return res.status(404).json({ message: 'Student not found' })
            res.json(student)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }
}

module.exports = new StudentController()