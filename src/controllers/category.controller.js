const Category = require("../models/category.model");
const Expense = require("../models/expense.model");

const getCategories = async (req, res) => {
  try {
    const { id } = req.params;

    // If ID is provided, get specific category (only active ones)
    if (id) {
      const category = await Category.findOne({
        _id: id,
        $or: [{ user: req.user._id }],
        // status: { $ne: false } // Matches true or null/undefined
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      return res.status(200).json({
        message: "Category retrieved successfully",
        category,
      });
    }

    // If no ID, get all active categories
    const userCategories = await Category.find({
      $or: [{ user: req.user._id }],
      // status: { $ne: false } // Matches true or null/undefined
    });

    if (!userCategories || userCategories.length === 0) {
      return res.status(200).json({
        message: "No categories found",
        categories: [],
      });
    }

    // Get totalSpent and transactionCount for each category from expenses
    const categoryStats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $group: {
          _id: "$category",
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);
    console.log(categoryStats, "categoryStats");

    // Create a map of category stats for quick lookup
    const statsMap = {};
    categoryStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        totalSpent: stat.totalSpent,
        transactionCount: stat.transactionCount,
      };
    });
    // console.log(statsMap, "statsMap");

    // Map categories with their stats
    const categoriesWithStats = userCategories.map((category) => {
      const categoryObj = category.toObject();
      const stats = statsMap[category._id.toString()] || {
        totalSpent: 0,
        transactionCount: 0,
      };

      return {
        ...categoryObj,
        totalSpent: stats.totalSpent,
        transactionCount: stats.transactionCount,
      };
    });
    // console.log(categoriesWithStats, "categoriesWithStats");

    res.status(200).json({
      message: "Categories retrieved successfully",
      categories: categoriesWithStats,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const categories = Array.isArray(req.body) ? req.body : [req.body];
    console.log(req.user._id, "req.userincreate");

    // Get all existing active categories for this user
    const existingCategories = await Category.find({
      user: req.user._id,
      status: { $ne: false }, // Matches true or null/undefined
    });
    console.log(existingCategories, "existingCategories");
    const existingCategoryNames = new Set(
      existingCategories.map((cat) => cat.name.toLowerCase()),
    );

    // Validate all categories
    for (const category of categories) {
      const { name, icon, color } = category;

      if (!name) {
        return res.status(400).json({
          message: "Category name is required for all categories",
        });
      }

      // Check if category with same name already exists for this user
      if (existingCategoryNames.has(name.toLowerCase())) {
        return res.status(400).json({
          message: `Category with name "${name}" already exists for your account`,
        });
      }
    }

    // Create all categories
    const createdCategories = await Promise.all(
      categories.map((category) => {
        const { name, icon, color } = category;
        return new Category({
          user: req.user._id,
          name,
          icon: icon || "",
          color: color || "",
        }).save();
      }),
    );

    res.status(200).json({
      message: "Categories created successfully",
      categories: createdCategories,
    });
  } catch (error) {
    console.error("Error creating categories:", error);
    res.status(500).json({
      message: "Error creating categories",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id, "id");
    const { name, icon, color } = req.body;

    // Check if category exists and is active
    const existingCategory = await Category.findOne({
      _id: id,
      status: { $ne: false }, // Matches true or null/undefined
    });
    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, icon, color },
      { new: true },
    );

    res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "aiigettingiddddddd");

    // Check if category exists and is active
    const existingCategory = await Category.findOne({
      _id: id,
      user: req.user._id,
      status: { $ne: false }, // Matches true or null/undefined
    });
    console.log(existingCategory, "existingCategory");
    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Soft delete: set status to false instead of actually deleting
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: { status: false } },
      { new: true },
    );

    res.status(200).json({
      message: "Category deleted successfully",
      category,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

const deleteAllCategories = async (req, res) => {
  try {
    const categories = await Category.deleteMany({ user: req.user._id });
    res.status(200).json({
      message: "All categories deleted successfully",
      categories,
    });
  } catch (error) {
    console.error("Error deleting all categories:", error);
    res.status(500).json({
      message: "Error deleting all categories",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteAllCategories,
};
