// const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const { AgentExecutor, createToolCallingAgent } = require("langchain/agents");
// const { DynamicStructuredTool } = require("@langchain/core/tools");

// const geminiLLM = require("./gemini.model.connection");
// const crudIntents = require("../intent/crud.intent");
// // const queryIntents = require("../intent/query.intent");
// const { SYSTEM_PROMPT } = require("../prompt/system.prompt");

// // Context store to pass user context to tools
// const userContextStore = new Map();

// // Convert Zod schemas to LangChain DynamicStructuredTools
// function createToolFromIntent(intent, userId) {
//   return new DynamicStructuredTool({
//     name: intent.name,
//     description: intent.description,
//     schema: intent.schema,
//     func: async (input) => {
//       // Store tool call info for controller to handle
//       const contextKey = userId?.toString() || "default";
//       if (!userContextStore.has(contextKey)) {
//         userContextStore.set(contextKey, []);
//       }
//       userContextStore.get(contextKey).push({
//         name: intent.name,
//         args: input,
//         timestamp: Date.now(),
//       });

//       console.log(input, "input-checking createToolFromIntent");

//       // Return a simple message - actual execution happens in controller
//       return `Tool ${intent.name} called with input: ${JSON.stringify(input)}`;
//     },
//   });
// }

// console.log(userContextStore, "userContextStore-checking createToolFromIntent");

// async function createAgent(userId = null, categories = []) {
//   // Dynamic prompt that includes the user's categories
//   const categoryList = categories.map(c => c.name).join(", ");
//   const dynamicPrompt = ChatPromptTemplate.fromMessages([
//     ["system", `${SYSTEM_PROMPT}\n\nAvailable Categories: ${categoryList || "None yet"}\n\nRules for Categories:\n1. Use an existing category if it fits the input.\n2. Only suggest a NEW category name if none of the existing ones are remotely relevant.`],
//     ["human", "{input}"],
//     ["placeholder", "{agent_scratchpad}"],
//   ]);

//   // Create tools with user context
//   const tools = crudIntents.map((intent) =>
//     createToolFromIntent(intent, userId),
//   );

//   const agent = await createToolCallingAgent({
//     llm: geminiLLM,
//     tools,
//     prompt: dynamicPrompt,
//   });

//   return new AgentExecutor({
//     agent,
//     tools,
//     verbose: true,
//   });
// }

// // // Function to get tool calls for a user
// function getToolCalls(userId) {
//   const contextKey = userId?.toString() || "default";
//   const calls = userContextStore.get(contextKey) || [];
//   // Clear after reading
//   userContextStore.delete(contextKey);
//   return calls;
// }

// module.exports = { createAgent, getToolCalls };
