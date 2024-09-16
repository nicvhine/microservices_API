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

        const newProduct = {
            id: products.length + 1, 
            name: name,
            quantity: Number(quantity),
            price: Number(price)
        };

        products.push(newProduct);
        res.status(200).json(newProduct);

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

        if (req.body.name) {
            product.name = req.body.name;
        }
        if (req.body.quantity) {
            product.quantity = Number(req.body.quantity);
        }
        if (req.body.price) {
            product.price = Number(req.body.price);
        }

        products[productIndex] = product;
        res.status(200).json(product);

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