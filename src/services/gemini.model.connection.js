const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const geminiLLM = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta"
});

module.exports = geminiLLM;
