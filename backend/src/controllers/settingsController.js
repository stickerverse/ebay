const User = require('../models/User');
const logger = require('../utils/logger');

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings');
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.settings = { ...user.settings, ...settings };
    await user.save();

    res.json({ success: true, settings: user.settings });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
