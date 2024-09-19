const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());


const products = [
    {id: 1, name: "choco", quantity: 20, price: 100},
    {id: 2, name: "cheese", quantity: 30, price: 200}
]

app.get('/', (req, res) => {
    res.send('Welcome to the Product Service');
});

app.post('/products', (req, res) => {
    try{
        const {name, quantity, price} = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Invalid name. Must be a non-empty string.' });
        }

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: name.trim()
        };

        // Optional quantity
        if (quantity !== undefined) {
            if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
                return res.status(400).json({ message: 'Invalid quantity. Must be a non-negative integer.' });
            }
            newProduct.quantity = Number(quantity);
        }

        // Optional price
        if (price !== undefined) {
            if (isNaN(Number(price)) || Number(price) < 0) {
                return res.status(400).json({ message: 'Invalid price. Must be a non-negative number.' });
            }
            newProduct.price = parseFloat(Number(price).toFixed(2));
        }


        products.push(newProduct);
        res.status(200).json({ message: 'Product created successfully', product: newProduct });

    } catch (error){
        res.status(500).json({message: error.message});
    }
});

app.get('/products', (req, res) => {
    try{
        res.send(products);
    } catch (error){
        res.status(500).json({message: error.message});
    }
});

app.get('/products/:id', (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const product = products.find(p => p.id === id);
        
        if(!product){
            return res.status(404).json({message: "Product not found"});
        }
        res.status(200).json(product);
        
    } catch (error){
        res.status(500).json({message: error.message});
    }
});



app.put('/products/:id', (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === id);

        if(!productIndex){
            return res.status(404).json({message: "Product not found"});
        }
        
        const product = products[productIndex];

        if (typeof req.body.name === 'string' && req.body.name.trim()) {
            product.name = req.body.name.trim();
        }

        if (req.body.quantity !== undefined) {
            if (Number.isInteger(req.body.quantity) && req.body.quantity >= 0) {
                product.quantity = req.body.quantity;
            } else {
                return res.status(400).json({ message: 'Invalid quantity. Must be a non-negative integer.' });
            }
        }

        if (req.body.price !== undefined) {
            if (typeof req.body.price === 'number' && req.body.price >= 0) {
                product.price = parseFloat(req.body.price.toFixed(2));
            } else {
                return res.status(400).json({ message: 'Invalid price. Must be a non-negative number.' });
            }
        }

        products[productIndex] = product;
        res.status(200).json({message: "Product updated",product});

    } catch(error){
        res.status(500).json({message: error.message});
    }
});



app.delete('/products/:id', (req,res) => {
    try{
        const id = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === id);

        if(!productIndex){
            return res.status(404).json({message: "Product not found"});
        }
          products.splice(productIndex, 1);
        //   products.deleted = true;

          res.status(200).json({ message: `Product with id ${id} has been deleted` });
    } catch (error){
        res.status(500).json({message: error.message});
    }
})


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});