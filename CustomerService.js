const express = require('express');
const jwt = require('jsonwebtoken');
const https = require('https');
const {body, validationResult} = require('express-validator');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = 3002;

app.use(express.json());

const SECRET_KEY = 'yourSecretKey';
let users = [
    { id: 1, username: 'John', password: 'john', role: 'customer', email: 'john@gmail.com' },
    { id: 2, username: 'Brian', password: 'brian', role: 'admin', email: 'brian@gmail.com' }
];

// rate limiters
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 5, 
    message: 'Too many requests from this IP, please try again after 10 minutes'
  });

const profileLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  message: 'Too many profile requests, please try again later.'
});

const deleteUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: 'Too many delete requests, please try again later.'
  });

  const updateUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: 'Too many update requests, please try again later.'
  });

// Register user
app.post('/register', limiter, [
    body('username')
        .isAlphanumeric().withMessage('Username is Invalid'),
    body('password')
        .trim()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    body('email')
        .trim()
        .isEmail().withMessage('Email must be a valid email')
        .normalizeEmail().toLowerCase(),
], (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, password, email, role } = req.body;
    const newUser = {
        id: users.length + 1,
        username,
        password,
        email,
        role: role || 'customer'
    };
    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Login user
app.post('/login', limiter, [
    body('username').isAlphanumeric().withMessage('Username is Invalid'),
    body('password').trim().isLength({ min: 8 }).withMessage('Password mustbe at least 8 characters long'),
], (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Admin can fetch all users, excluding passwords; Customers can fetch own information
app.get('/profile', profileLimiter, (req, res) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            const requestingUser = users.find(u => u.id === decoded.id);

            if (requestingUser) {
                if (requestingUser.role === 'admin') {
                    // Filter out passwords for admin response
                    const filteredUsers = users.map(({ password, ...user }) => user);
                    res.json({ users: filteredUsers });
                } else {
                    res.json({ user: requestingUser });
                }
            } else {
                res.status(404).send('User not found');
            }
        } catch (err) {
            res.status(403).send('Invalid token');
        }
    } else {
        res.status(401).send('No token provided');
    }
});

// Admin can delete any users; Customers can delete own profile
app.delete('/user/:id',deleteUserLimiter, (req, res) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            const requestingUser = users.find(u => u.id === decoded.id);

            if (requestingUser) {
                const userIdToDelete = parseInt(req.params.id);

                if (requestingUser.role === 'admin') {
                    users = users.filter(u => u.id !== userIdToDelete);
                    res.json({ message: 'User deleted successfully' });
                } else if (requestingUser.id === userIdToDelete) {
                    users = users.filter(u => u.id !== userIdToDelete);
                    res.json({ message: 'Your account has been deleted successfully' });
                } else {
                    res.status(403).send('Access denied: You can only delete your own account');
                }
            } else {
                res.status(404).send('User not found');
            }
        } catch (err) {
            res.status(403).send('Invalid token');
        }
    } else {
        res.status(401).send('No token provided');
    }
});

//Admin can edit any user; Customers can edit their own profile
app.put('/user/:id',updateUserLimiter, [
    body('username')
        .optional()
        .isAlphanumeric().withMessage('Username is Invalid'),
    body('password')
        .optional()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail()
        .toLowerCase(),
],(req, res) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            const requestingUser = users.find(u => u.id === decoded.id);

            if (requestingUser) {
                const userIdToUpdate = parseInt(req.params.id);

                if (requestingUser.role === 'admin') {
                    const userToUpdate = users.find(u => u.id === userIdToUpdate);

                    if (userToUpdate) {
                        const { username, password, email, role } = req.body;
                        userToUpdate.username = username || userToUpdate.username;
                        userToUpdate.password = password || userToUpdate.password;
                        userToUpdate.email = email || userToUpdate.email;
                        userToUpdate.role = role || userToUpdate.role;

                        res.json({ message: 'User updated successfully', user: userToUpdate });
                    } else {
                        res.status(404).send('User not found');
                    }
                } else if (requestingUser.id === userIdToUpdate) {
                    const userToUpdate = users.find(u => u.id === requestingUser.id);

                    if (userToUpdate) {
                        const { username, password, email } = req.body;
                        userToUpdate.username = username || userToUpdate.username;
                        userToUpdate.password = password || userToUpdate.password;
                        userToUpdate.email = email || userToUpdate.email;

                        res.json({ message: 'Your profile has been updated successfully', user: userToUpdate });
                    } else {
                        res.status(404).send('User not found');
                    }
                } else {
                    res.status(403).send('Access denied: You can only update your own account');
                }
            } else {
                res.status(404).send('User not found');
            }
        } catch (err) {
            res.status(403).send('Invalid token');
        }
    } else {
        res.status(401).send('No token provided');
    }
});

app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
