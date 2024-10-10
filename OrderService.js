const express = require('express');
const jwt = require('jsonwebtoken');
// const {body, validationResult} = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3003;

app.use(express.json());

const SECRET_KEY = 'yourSecretKey'; 
let orders = [];
let products = [
    { id: 1, name: 'Product A', price: 100, stock: 50 },
    { id: 2, name: 'Product B', price: 200, stock: 30 },
];

const orderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5, 
    message:'Too many orders placed, please try again later.'
});

const fetchOrdersLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many requests, please wait before fetching orders again.'
});

const editOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: 'Too many edit requests, please try again later.'
});

const deleteOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: 'Too many delete requests, please try again later.'
});

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded; 
            next(); 
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send('Token expired');
            }
            res.status(403).send('Invalid token');
        }
    } else {
        res.status(401).send('No token provided');
    }
};

// Place order
app.post('/orders', orderLimiter, authenticateUser, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;
    console.log(`Received order request: productId = ${productId}, quantity = ${quantity}`); 

    const product = products.find(p => p.id === Number(productId)); 

    if (!product) {
        console.log(`Product not found: ${productId}`); 
        return res.status(400).json({ message: 'Product not found' });
    }

    console.log(`Current stock for ${product.name}: ${product.stock}`);

    if (product.stock < quantity) {
        return res.status(400).json({ message: `Not enough stock for product: ${product.name}` });
    }

    const totalAmount = product.price * quantity;

    const newOrder = {
        id: orders.length + 1,
        userId: req.user.id,
        products: [{ id: product.id, name: product.name, quantity }],
        totalAmount,
        status: 'pending'
    };

    product.stock -= quantity; 
    console.log(`Stock after placing order: ${product.stock}`); 

    orders.push(newOrder);
    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
});


// Admin can fetch all orders; Customers can see their own orders
app.get('/orders', fetchOrdersLimiter, authenticateUser, (req, res) => {
    if (req.user.role === 'admin') {
        res.json(orders);
    } else {
        const userOrders = orders.filter(order => order.userId === req.user.id);
        res.json(userOrders);
    }
});

// Admin can edit any order; Customers can edit their own orders only if status is pending
app.put('/orders/:id', editOrderLimiter, authenticateUser, (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o.id == id);

    if (order) {
        if (req.user.role === 'admin') {
            const { status } = req.body;
            if (status && (status === 'pending' || status === 'completed')) {
                order.status = status;

                if (status === 'completed') {
                    order.products.forEach(prod => {
                        const product = products.find(p => p.id === prod.id); 
                        if (product) {
                            product.stock -= prod.quantity; 
                            console.log(`Stock updated for ${product.name}: ${product.stock}`); 
                        }
                    });
                }
                
                res.json({ message: 'Order status updated', order });
            } else {
                return res.status(400).send('Invalid status: Must be "pending" or "completed"');
            }
        } else if (order.userId == req.user.id) {
            if (order.status !== 'pending') {
                return res.status(403).send('Access denied: You can only edit orders with pending status');
            }

            const { productId, quantity } = req.body;

            if (productId) {
                const product = products.find(p => p.id === productId); 
                if (!product) {
                    return res.status(400).json({ message: 'Product not found' });
                }
                if (product.stock < quantity) {
                    return res.status(400).json({ message: `Not enough stock for product: ${product.name}` });
                }
                order.products[0].id = product.id;
                order.products[0].name = product.name; 
            }

            if (quantity) {
                const oldQuantity = order.products[0].quantity;
                order.products[0].quantity = quantity; 

                const product = products.find(p => p.id === order.products[0].id); 
                if (product) {
                    product.stock += oldQuantity; 
                    product.stock -= quantity; 
                    console.log(`Stock after updating quantity for ${product.name}: ${product.stock}`); 
                }
            }

            order.totalAmount = products.find(p => p.id === order.products[0].id).price * quantity; 
            res.json({ message: 'Order updated successfully', order });
        } else {
            res.status(403).send('Access denied: You can only edit your own orders');
        }
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});


// Admin can delete any orders; Customers can delete their own orders if status is pending
app.delete('/orders/:id', deleteOrderLimiter, authenticateUser, (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id == id);

    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        if (req.user.role === 'admin' || (order.userId === req.user.id && order.status === 'pending')) {
            orders.splice(orderIndex, 1);
            res.json({ message: 'Order deleted successfully' });
        } else {
            res.status(403).send('Access denied: You can only delete your own pending orders');
        }
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
}, 
app
)

sslServer.listen(PORT, ()=> {
console.log(`Order Service on Secure Server running on port ${PORT}`);
});


// app.listen(PORT, () => {
//     console.log(`Order Service running on port ${PORT}`);
// });
