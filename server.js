const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ======================
// MongoDB Models
// ======================

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MetricSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  date: String,
  steps: Number,
  calories: Number,
  water: Number,
  sleep: Number,
  weight: Number,
  mood: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);
const Metric = mongoose.model('Metric', MetricSchema);

// ======================
// Routes
// ======================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Health Tracker API is running!'
  });
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      userId: user._id,
      name: user.name
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      password
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    res.json({
      userId: user._id,
      name: user.name
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Get Metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const { userId } = req.query;

    const metrics = await Metric.find(
      userId ? { userId } : {}
    ).sort({ date: -1 });

    res.json(metrics);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Get Stats
app.get('/api/metrics/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const metrics = await Metric.find(
      userId ? { userId } : {}
    );

    if (!metrics.length) {
      return res.json({});
    }

    const avg = key =>
      Math.round(
        metrics.reduce((sum, m) => sum + (+m[key] || 0), 0)
        / metrics.length
      );

    res.json({
      avgSteps: avg('steps'),
      avgCalories: avg('calories'),
      avgWater: avg('water'),
      avgSleep: +(
        metrics.reduce((sum, m) => sum + (+m.sleep || 0), 0)
        / metrics.length
      ).toFixed(1),
      totalEntries: metrics.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Add Metric
app.post('/api/metrics', async (req, res) => {
  try {
    const metric = await Metric.create(req.body);

    res.status(201).json(metric);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Update Metric
app.put('/api/metrics/:id', async (req, res) => {
  try {
    const metric = await Metric.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!metric) {
      return res.status(404).json({
        error: 'Not found'
      });
    }

    res.json(metric);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Delete Metric
app.delete('/api/metrics/:id', async (req, res) => {
  try {
    await Metric.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Metric deleted'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('✅ Using MongoDB Atlas');
  console.log(`🔍 Test: http://localhost:${PORT}/api/health`);
  console.log('');
});
