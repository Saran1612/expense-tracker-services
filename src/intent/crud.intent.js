const { z } = require("zod");

const crudIntents = [
  {
    name: "add_expense",
    description: "Add a new expense",
    schema: z.object({
      amount: z.number(),
      category: z.string(),
      note: z.string(),
      date: z.string().optional().default(new Date().toISOString().split('T')[0]),
      tags: z.array(z.string()).optional()
    })
  },
  {
    name: "delete_expense",
    description: "Delete an expense by ID or search criteria (note, amount, category)",
    schema: z.object({
      expenseId: z.string().optional(),
      amount: z.number().optional(),
      category: z.string().optional(),
      note: z.string().optional()
    })
  }
];

module.exports = crudIntents;
