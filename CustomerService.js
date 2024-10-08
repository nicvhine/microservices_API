const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3002;

app.use(express.json());

const SECRET_KEY = 'yourSecretKey';
let users = [
    { id: 1, username: 'John', password: 'john', role: 'customer', email: 'john@gmail.com' },
    { id: 2, username: 'Brian', password: 'brian', role: 'admin', email: 'brian@gmail.com' }
];

// Register user
app.post('/register', (req, res) => {
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
app.post('/login', (req, res) => {
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
app.get('/profile', (req, res) => {
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
app.delete('/user/:id', (req, res) => {
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
app.put('/user/:id', (req, res) => {
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
