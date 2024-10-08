const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3001;

app.use(express.json());

const SECRET_KEY = 'yourSecretKey';
let products = [
    { id: 1, name: 'Product A', price: 100, stock: 50 },
    { id: 2, name: 'Product B', price: 200, stock: 30 },
];

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
app.get('/products', (req, res) => {
    res.json(products);
});

// Get product by ID 
app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id == id);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Add a new product (Admin only)
app.post('/products', authenticateAdmin, (req, res) => {
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
app.put('/products/:id', authenticateAdmin, (req, res) => {
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
app.delete('/products/:id', authenticateAdmin, (req, res) => {
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
