// const { bedrockModelConnection } = require('../services/bedrock.model.connection');
// const { outputRules } = require('../utils/output.rules');
// const { createExpenseFormat } = require('../format/expense.format');

// const bedrockMiddleware = async (text, categories) => {
//     const prompt = `
//        Hi
//     `;
//     // console.log(createExpenseFormat(), "createExpenseFormat-checking-bedrockMiddleware")
//     console.log(prompt, "prompt-checking-bedrockMiddleware")
//     const response = await bedrockModelConnection(prompt);
//     console.log(response, "response-checking-bedrockMiddlewarewithjsonparse")
//     return response;
// }

// module.exports = { bedrockMiddleware };