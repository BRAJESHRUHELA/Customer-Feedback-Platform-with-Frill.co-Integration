const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB (replace 'your_database_uri' with your actual MongoDB URI)
mongoose.connect('your_database_uri', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// Define Feedback Schema
const feedbackSchema = new mongoose.Schema({
    userId: String,
    productFeatures: String,
    productPricing: String,
    productUsability: String,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Routes
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token for authentication
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    res.json({ token });
});

app.post('/api/submit-feedback', async (req, res) => {
    const { token, productFeatures, productPricing, productUsability } = req.body;

    try {
        // Verify the JWT token
        const decodedToken = jwt.verify(token, 'your_secret_key');

        // Create feedback with the user's ID
        const feedback = new Feedback({
            userId: decodedToken.userId,
            productFeatures,
            productPricing,
            productUsability,
        });

        await feedback.save();

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Unauthorized' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
