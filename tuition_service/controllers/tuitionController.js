

const Tuition = require('../models/tuition')
const axios = require('axios')

class TuitionController {
  async createTuition(req, res) {
    try {
      const tuition = new Tuition(req.body)
      await tuition.save()
      res.status(201).json(tuition)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getStudentWithTuition(req, res) {
    try {
        const { studentId } = req.params;
        const studentRes = await axios.get(`http://gateway:4000/student/${studentId}`);
        const student = studentRes.data;

        if (!student) return res.status(404).json({ message: 'Student not found' });
        
        const tuitions = await Tuition.find({ studentId })

      
        res.json({ student, tuitions});

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  

  async deleteTuition(req, res) {
    try {
      const tuition = await Tuition.findByIdAndDelete(req.params.id)
      if (!tuition) return res.status(404).json({ message: 'Tuition not found' })
      res.json({ message: 'Tuition deleted' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = new TuitionController()
