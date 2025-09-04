const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ebayService = require('../services/ebayService');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasEbayCredentials: false
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    const hasEbayCredentials = !!(
      user.ebayCredentials && 
      user.ebayCredentials.clientId && 
      user.ebayCredentials.accessToken
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasEbayCredentials
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.configureEbay = async (req, res) => {
  try {
    const { clientId, clientSecret, accessToken, refreshToken, environment } = req.body;

    if (!clientId || !clientSecret || !accessToken) {
      return res.status(400).json({ error: 'Missing required eBay credentials' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.ebayCredentials = {
      clientId,
      clientSecret,
      accessToken,
      refreshToken: refreshToken || '',
      environment: environment || 'sandbox'
    };

    await user.save();

    res.json({ 
      success: true,
      message: 'eBay credentials configured successfully'
    });

  } catch (error) {
    logger.error('eBay configuration error:', error);
    res.status(500).json({ error: 'Failed to save eBay credentials' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const hasEbayCredentials = !!(
      user.ebayCredentials && 
      user.ebayCredentials.clientId && 
      user.ebayCredentials.accessToken
    );

    const userResponse = {
      ...user.toObject(),
      hasEbayCredentials
    };

    res.json({ user: userResponse });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
