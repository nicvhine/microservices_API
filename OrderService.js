const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3003;

app.use(express.json());

let orders = [];

app.post('/orders', async (req, res) => {
    try {
        const { customerId, productId, quantity } = req.body;

        let customer;
        try {
            const customerResponse = await axios.get(`http://localhost:3002/customers/${customerId}`);
            customer = customerResponse.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(404).json({ message: "Customer not found" });
            }
            return res.status(500).json({ message: "Error contacting Customer Service" });
        }

        let product;
        try {
            const productResponse = await axios.get(`http://localhost:3001/products/${productId}`);
            product = productResponse.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(404).json({ message: "Product not found" });
            }
            return res.status(500).json({ message: "Error contacting Product Service" });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient product quantity" });
        }

        const newOrder = {
            id: orders.length + 1,
            customerId,
            productId,
            quantity,
            totalPrice: product.price * quantity
        };

        await axios.put(`http://localhost:3001/products/${productId}`, { quantity: product.quantity - quantity });

        orders.push(newOrder);

        res.status(201).json({
            message: "Order placed successfully!",
            order: newOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/orders', (req, res) => {
    try{
        res.send(orders);
    } catch (error){
        res.status(500).json({message: error.message});
    }
});

app.get('/orders/:orderId', (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/orders/:orderId', (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[orderIndex];

        if (req.body.customerId) {
            order.customerId = req.body.customerId;
        }
        if (req.body.productId) {
            order.productId = req.body.productId;
        }
        if (req.body.quantity) {
            order.quantity = req.body.quantity;
            order.totalPrice = req.body.quantity * order.totalPrice / order.quantity; 
        }

        orders[orderIndex] = order;

        res.status(200).json({
            message: "Order updated successfully",
            order: order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/orders/:orderId', (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ message: "Order not found" });
        }

        orders.splice(orderIndex, 1); 

        res.status(200).json({ message: `Order with id ${orderId} has been deleted` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Service is running on port ${PORT}`);
});
