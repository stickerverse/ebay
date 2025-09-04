const Message = require('../models/Message');
const logger = require('../utils/logger');

exports.getStats = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const totalMessages = await Message.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: startDate }
    });

    const autoResponded = await Message.countDocuments({
      userId: req.user.id,
      status: 'auto_responded',
      createdAt: { $gte: startDate }
    });

    const respondedMessages = await Message.find({
      userId: req.user.id,
      responseTime: { $exists: true },
      createdAt: { $gte: startDate }
    }).select('createdAt responseTime');

    let averageResponseTime = 0;
    if (respondedMessages.length > 0) {
      const totalResponseTime = respondedMessages.reduce((sum, msg) => {
        const responseTime = new Date(msg.responseTime) - new Date(msg.createdAt);
        return sum + responseTime;
      }, 0);
      averageResponseTime = Math.round(totalResponseTime / respondedMessages.length / (1000 * 60));
    }

    const responseRate = totalMessages > 0 ? 
      ((totalMessages - await Message.countDocuments({
        userId: req.user.id,
        status: 'pending',
        createdAt: { $gte: startDate }
      })) / totalMessages * 100).toFixed(1) : '0';

    res.json({
      totalMessages,
      autoResponded,
      averageResponseTime: `${averageResponseTime} minutes`,
      responseRate: `${responseRate}%`
    });

  } catch (error) {
    logger.error('Analytics stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getChartData = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let days = 7;
    switch (timeRange) {
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          messages: { $sum: 1 },
          responses: {
            $sum: {
              $cond: [
                { $ne: ["$status", "pending"] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const data = await Message.aggregate(pipeline);

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayData = data.find(d => d._id === dateString);
      chartData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateString,
        messages: dayData ? dayData.messages : 0,
        responses: dayData ? dayData.responses : 0
      });
    }

    res.json(chartData);

  } catch (error) {
    logger.error('Chart data error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
