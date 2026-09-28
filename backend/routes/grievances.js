const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Grievance = require('../models/Grievance');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (files sent to AI service)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/grievances
 * @desc    Submit a new grievance with AI analysis
 * @access  Private
 */
router.post('/', protect, upload.array('photos', 5), async (req, res) => {
  try {
    const { title, description, location, userCategory } = req.body;

    // Validation
    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description and location are required'
      });
    }

    // Prepare data for AI service
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location', location);
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        formData.append('photos', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });
    }

    // Call AI service with timeout and error handling
    let aiResult = {};
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/analyze_with_images`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000 // 60 seconds
        }
      );
      aiResult = aiResponse.data;
    } catch (aiError) {
      console.error('⚠️ AI service error:', aiError.message);
      
      // Fallback values if AI service fails
      aiResult = {
        category: userCategory || 'Other',
        category_confidence: 0,
        urgency_level: 'medium',
        urgency_score: 0.4,
        sentiment: 'NEUTRAL',
        sentiment_confidence: 0.5,
        key_terms: [],
        entities: {},
        image_analysis: [],
        image_description: null
      };
    }

    // Create grievance document
    const grievance = new Grievance({
      user: req.user._id,
      title,
      description,
      location,
      userCategory: userCategory || '',
      aiCategory: aiResult.category || 'Other',
      aiCategoryConfidence: aiResult.category_confidence || 0,
      urgencyLevel: aiResult.urgency_level || 'medium',
      urgencyScore: aiResult.urgency_score || 0.4,
      sentiment: aiResult.sentiment || 'NEUTRAL',
      sentimentConfidence: aiResult.sentiment_confidence || 0.5,
      keyTerms: aiResult.key_terms || [],
      entities: aiResult.entities || {},
      imageAnalysis: aiResult.image_analysis || [],
      imageDescription: aiResult.image_description || ''
    });

    await grievance.save();

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      grievance: {
        _id: grievance._id,
        trackingId: grievance.trackingId,
        title: grievance.title,
        status: grievance.status,
        aiCategory: grievance.aiCategory,
        urgencyLevel: grievance.urgencyLevel
      },
      aiAnalysis: {
        category: aiResult.category,
        confidence: aiResult.category_confidence,
        urgency: aiResult.urgency_level
      }
    });
  } catch (error) {
    console.error('❌ Grievance submission error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB per file.'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 photos allowed.'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error submitting grievance'
    });
  }
});

/**
 * @route   GET /api/grievances/my
 * @desc    Get all grievances submitted by the logged-in user
 * @access  Private
 */
router.get('/my', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user._id };
    if (status && ['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const grievances = await Grievance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Grievance.countDocuments(query);

    res.json({
      success: true,
      data: grievances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching grievances'
    });
  }
});

/**
 * @route   GET /api/grievances/track/:trackingId
 * @desc    Track a grievance by tracking ID (public)
 * @access  Public
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const grievance = await Grievance.findOne({ trackingId: req.params.trackingId })
      .select('title description location status aiCategory urgencyLevel createdAt updatedAt');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    res.json({
      success: true,
      grievance
    });
  } catch (error) {
    console.error('Error tracking grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking grievance'
    });
  }
});

/**
 * @route   GET /api/grievances/:id
 * @desc    Get single grievance by ID (owner or admin only)
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('user', 'name email');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && grievance.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      grievance
    });
  } catch (error) {
    console.error('Error fetching grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching grievance'
    });
  }
});

module.exports = router;