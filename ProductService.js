const express = require('express');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = 3001;

app.use(express.json());

const SECRET_KEY = 'yourSecretKey';
let products = [
    { id: 1, name: 'Product A', price: 100, stock: 50 },
    { id: 2, name: 'Product B', price: 200, stock: 30 },
];

const getLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many get requests, please try again later'
});

const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many post requests, please try again later'
});

const editLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: 'Too many edit requests, please try again later.'
});

const deleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: 'Too many delete requests, please try again later.'
});

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1]; 
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            if (decoded.role === 'admin') {
                next(); 
            } else {
                res.status(403).send('Access denied: Admins only');
            }
        } catch (err) {
            res.status(403).send('Invalid token');
        }
    } else {
        res.status(401).send('No token provided');
    }
};

// Get all products (Public access)
app.get('/products', getLimiter, (req, res) => {
    res.json(products);
});

// Get product by ID 
app.get('/products/:id', getLimiter, (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id == id);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Add a new product (Admin only)
app.post('/products', createLimiter, authenticateAdmin, [
    body('name')
        .isString()
        .notEmpty().withMessage('Product name is required'),
    body('price')
        .isFloat({ gte: 0 }).withMessage('Price must be not be a negative number'),
    body('stock')
        .isInt({ gte: 0 }).withMessage('Stock must not be a negative number'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, price, stock } = req.body;
    const newProduct = {
        id: products.length + 1,
        name,
        price,
        stock
    };
    products.push(newProduct);
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
});

// Update product (Admin only)
app.put('/products/:id', editLimiter, authenticateAdmin, [
    body('name')
        .optional()
        .isString()
        .notEmpty().withMessage('Product name is required'),
    body('price')
        .optional()
        .isFloat({ gte: 0 }).withMessage('Price must be not be a negative number'),
    body('stock')
        .optional()
        .isInt({ gte: 0 }).withMessage('Stock must not be a negative number'),

], (req, res) => {
    const { id } = req.params;
    const { name, price, stock } = req.body;
    const product = products.find(p => p.id == id);

    if (product) {
        // Update product details
        product.name = name || product.name;
        product.price = price || product.price;
        product.stock = stock || product.stock;
        res.json({ message: 'Product updated successfully', product });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Delete product (Admin only)
app.delete('/products/:id', deleteLimiter, authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id == id);

    if (productIndex !== -1) {
        products.splice(productIndex, 1);
        res.json({ message: 'Product deleted successfully' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Product Service running on port ${PORT}`);
});
