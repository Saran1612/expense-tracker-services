// const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// const client = new BedrockRuntimeClient({
//   region: process.env.AWS_REGION,
// });

// function extractJson(text) {
//   return text
//     .trim()
//     .replace(/^```json/, "")
//     .replace(/^```/, "")
//     .replace(/```$/, "")
//     .trim();
// }


// const bedrockModelConnection = async (prompt) => {
//   try {
//     const payload = {
//       inputText: prompt,
//       textGenerationConfig: {
//         temperature: 0.2,
//         maxTokenCount: 50, // Increased from 200 to allow for longer JSON responses
//         topP: 0.9
//       }
//     };

//     console.log(payload, "payload-checking")

//     const command = new InvokeModelCommand({
//       modelId: process.env.AWS_BEDROCK_MODEL_ID,
//       contentType: "application/json",
//       accept: "application/json",
//       body: JSON.stringify(payload),
//     });

//     console.log(command, "command-checking")

//     const response = await client.send(command);
//     // console.log(response, "response-checking")

//     const responseBody = JSON.parse(
//       new TextDecoder().decode(response.body)
//     );

//     const rawOutput = responseBody.results[0].outputText;
//     console.log(rawOutput, "rawOutput-checking")
//     const cleanedJson = extractJson(rawOutput);
//     console.log(cleanedJson, "cleanedJson-checking")
//     const parsed = JSON.parse(cleanedJson);
//     console.log(parsed, "parsed-checking")

//     return parsed;
//   } catch (error) {
//     console.error("Bedrock API Error:", error);
//     // Log the full error details for debugging
//     if (error.message) {
//       console.error("Error message:", error.message);
//     }
//     if (error.$metadata) {
//       console.error("Error metadata:", error.$metadata);
//     }
//     throw error; // Re-throw to let the caller handle it
//   }
// }

// module.exports = { bedrockModelConnection };
