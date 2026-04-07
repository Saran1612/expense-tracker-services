const {
  createAgent,
  getToolCalls,
} = require("../middleware/ai.agent.middleware");
const Expense = require("../models/expense.model");
const Category = require("../models/category.model");
const {
  saveExpenseInternal,
  deleteExpenseInternal,
} = require("./expense.controller");

async function askAI(req, res) {
  try {
    const { message } = req.body;
    console.log(message, "req.body-checking askAI");

    // Step 1: Fetch existing categories to inform the AI
    const categories = await Category.find({ user: req.user._id });

    // Step 2: Create agent with user context and category knowledge
    const agentExecutor = await createAgent(req.user._id, categories);

    const response = await agentExecutor.invoke({
      input: message,
    });
    console.log(response, "response-checking askAI");

    // Get tool calls from context store
    const toolCalls = getToolCalls(req.user._id);

    // Execute tool operations
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        console.log(
          `Tool called: ${toolCall.name}`,
          toolCall.args,
          "tool-checking askAI",
        );
        await handleTool(
          toolCall.name,
          toolCall.args,
          req.user._id,
          categories,
        );
      }
    }

    return res.json({ reply: response.output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
}

async function handleTool(toolName, toolInput, userId, categories) {
  console.log(toolName, toolInput, "handleTool-checking");

  switch (toolName) {
    case "add_expense":
      try {
        const targetCategory = await getOrCreateCategory(
          userId,
          toolInput.category,
          categories,
          toolInput.note,
        );

        // Step 4: Create expense using the standard internal helper
        // This handles budget updates, total spent, etc.
        const createdExpenses = await saveExpenseInternal(userId, {
          amount: toolInput.amount,
          category: targetCategory._id,
          note: toolInput.note || "",
          date: toolInput.date ? new Date(toolInput.date) : new Date(),
          tags: toolInput.tags || [],
        });

        // console.log("Expense created via AI helper:", createdExpenses[0]);
      } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
      }
      break;

    case "delete_expense":
      try {
        let expenseId = toolInput.expenseId;

        console.log(expenseId, "expenseId-checking delete_expense");

        // If AI didn't provide an ID, search by criteria
        if (!expenseId) {
          const query = { user: userId };
          if (toolInput.amount) query.amount = toolInput.amount;
          if (toolInput.note)
            query.note = { $regex: new RegExp(toolInput.note, "i") };

          console.log(query, "query-checking delete_expense");

          if (toolInput.category) {
            const category = categories.find((c) =>
              c.name.toLowerCase().includes(toolInput.category.toLowerCase()),
            );
            console.log(category, "category-checking delete_expense");
            if (category) query.category = category._id;
          }

          const foundExpense = await Expense.findOne(query).sort({ date: -1 });
          if (!foundExpense) {
            throw new Error(
              `No matching expense found for: ${JSON.stringify(toolInput)}`,
            );
          }
          console.log(foundExpense, "foundExpense-checking delete_expense");
          expenseId = foundExpense._id;
        }

        const deletedExpense = await deleteExpenseInternal(userId, expenseId);
        console.log(
          "Expense deleted successfully via AI:",
          deletedExpense.note,
        );
      } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
      }
      break;

    default:
      console.log(`Unknown tool: ${toolName}`);
  }
}

async function getOrCreateCategory(
  userId,
  categoryName,
  existingCategories,
  note = "",
) {
  // Fuzzy match logic: check if existing category fits the LLM input
  let targetCategory = existingCategories.find(
    (c) =>
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      categoryName.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(categoryName.toLowerCase()),
  );

  // If no match found, CREATE the new category automatically
  if (!targetCategory) {
    console.log(`Auto-creating new category: ${categoryName}`);
    targetCategory = new Category({
      user: userId,
      name: categoryName,
      description: `Auto-created by AI for ${note || "this expense"}`,
    });
    await targetCategory.save();
  }

  return targetCategory;
}

module.exports = { askAI };
