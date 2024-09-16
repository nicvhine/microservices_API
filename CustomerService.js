const express = require('express');

const app = express();
const PORT = 3002;

app.use(express.json());

const customers = [
    {id: 1, name: "John", age: 22}, 
    {id: 2, name: "Brian", age: 31} 
];

app.get('/', (req, res) => {
    res.send('Welcome to the Customer Service');
});

app.post('/customers', (req, res) => {
    try{
        const { name, email, age } = req.body;

        const newCustomer = {
            id: customers.length + 1, 
            name: name,
            email: email,
            age: age || null 
        };

        customers.push(newCustomer);

        res.status(200).json(newCustomer);
    } catch (error){
        res.status(500).json({message: error.message});
    }
});

app.get('/customers', (req, res) => {
    try {
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/customers/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const customer = customers.find(c => c.id === id);
        
        if (!customer) {
            return res.status(404).json({message: "Customer not found"});
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});


app.put('/customers/:id', (req, res) => {
    try{
      const id = parseInt(req.params.id);
      const customerIndex = customers.findIndex(c => c.id === id);
      if (!customerIndex) {
        return res.status(404).json({message: "Customer not found"});
      }

      const customer = customers[customerIndex];
        if (req.body.name) {
            customer.name = req.body.name;
        }
        if (req.body.age) {
            customer.age = req.body.age;
        }
        if (req.body.email) {
            customer.email = req.body.email;
        }
        
        customers[customerIndex] = customer;
        res.status(200).json(customer);
      
    } catch (error){
        res.status(500).json({message: error.message});
    }
});


app.delete('/customers/:id', (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const customerIndex = customers.find(c => c.id === id);
        if (!customerIndex) {
            return res.status(404).json({message: "Customer not found"});
        }

            // customers.splice(customerIndex, 1);
            customers.deleted = true;

          res.status(200).json({ message: `Customer with id ${id} has been deleted` });
    } catch (error){
        res.status(500).json({message: error.message})
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});