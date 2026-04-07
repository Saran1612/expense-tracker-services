const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');


const registerUser = async (req, res) => {
  try {
    const { name, email, password, about } = req.body;
    console.log(req.body, "reqbody")

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      about: about || ''
    });
    await newUser.save();

    console.log(newUser, "newUser")
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        about: newUser.about
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password, "email, password")

    // Check if user exists
    const user = await User.findOne({ email });
    console.log(user, "userssssdataaaa")
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid, "isPasswordValid")
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    // Convert to plain object and remove sensitive/unwanted fields
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.createdAt;
    delete userObject.updatedAt;
    delete userObject.__v;

    res.status(200).json({ user: userObject });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

const updateUser = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized - Please login first' });
    }

    const { name, email, password, about } = req.body;

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    // If password is being updated, hash it
    let updateData = { name, email, about };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    
    // Convert to plain object and remove sensitive/unwanted fields
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.createdAt;
    delete userObject.updatedAt;
    delete userObject.__v;
    
    res.status(200).json({ 
      message: 'User updated successfully',
      user: userObject
    });
    
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser
}; 