const outputRules = (categories) => {
    return `
        Strictly follow these rules:
        - Return clean JSON only without any backticks or prefixes
        - No explanation
        - Category must be one of: ${categories.join(', ')}
        - Amount should be a number
        - Tags should be an array of string
    `
}

module.exports = {  outputRules };