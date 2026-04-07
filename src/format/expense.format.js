const createExpenseFormat = () => {
    return `
        Expected JSON Format:
        {
            "action": "add_expense",
            "note": "",
            "amount": "",
            "category": "",
            "tags": "",
        }
    `
}

module.exports = { createExpenseFormat };

