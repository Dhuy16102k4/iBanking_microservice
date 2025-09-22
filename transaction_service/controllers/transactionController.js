const mongoose = require('mongoose')
const Transaction = require('../models/transaction')
const axios = require('axios')
const { head } = require('../../otp_service/routes/otp')

async function getTuition(tuitionId) {
    try {
        const response = await axios.get(`http://localhost:4000/tuition/${tuitionId}`)
        return response.data
    } catch (err) {
        throw new Error('Failed to fetch tuition details')
    }
}
async function getUserInfo(userId) {
    try {
        const response = await axios.get(`http://localhost:4000/users/${userId}`)
        return response.data
    } catch (error) {
        throw new Error('Failed to fetch user info: ' + error.message)
    }
}

async function revertUserBalance(userId, originalBalance) {
    try {
        await axios.patch(
            `http://localhost:4000/users/users/${userId}/balance`,
            { newBalance: originalBalance },
        );
    } catch (error) {
        console.error('Failed to revert balance:', error.message);
    }
}

async function updateUserBalance(userId, newBalance) {
    try {
        await axios.patch(
            `http://localhost:4000/users/${userId}/balance`,
            { newBalance },
        );  
    } catch (error) {
        throw new Error('Failed to update user balance: ' + error.message);
    }
}

class Transaction {
    async createTransaction(req, res) {

    }

}

module.exports = new Transaction()