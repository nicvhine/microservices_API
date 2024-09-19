const express = require('express');

const app = express();
const PORT = 3002;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

app.use(express.json());

function validateEmail(email){
    return emailRegex.test(email);
}

const customers = [
    {id: 1, name: "John", age: 22, email: "john@gmail.com"}, 
    {id: 2, name: "Brian", age: 31} 
];

app.get('/', (req, res) => {
    res.send('Welcome to the Customer Service');
});

app.post('/customers', (req, res) => {
    try {
        const { name, email, age } = req.body;
        
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: "Invalid name" });
        }

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        if (age !== undefined && (!Number.isInteger(age) || age <= 0)) {
            return res.status(400).json({ message: "Invalid age" });
        }

        const newCustomer = {
            id: customers.length + 1, 
            name: name.trim(),
            email: email,
            age: age || null 
        };

        customers.push(newCustomer);

        res.status(201).json({message: "Customer created successfully",newCustomer});
    } catch (error) {
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
    try {
        const id = parseInt(req.params.id);
        const customerIndex = customers.findIndex(c => c.id === id);

        if (customerIndex === -1) {
            return res.status(404).json({message: "Customer not found"});
        }

        const customer = customers[customerIndex];

        if (req.body.name !== undefined) {
            if (typeof req.body.name === 'string' && req.body.name.trim()) {
                customer.name = req.body.name.trim();
            } else {
                return res.status(400).json({ message: 'Invalid name' });
            }
        }

        if (req.body.age !== undefined) {
            if (Number.isInteger(req.body.age) && req.body.age > 0) {
                customer.age = req.body.age; 
            } else {
                return res.status(400).json({ message: 'Invalid age' });
            }
        }

        if (req.body.email !== undefined) {
            if (typeof req.body.email === 'string' && validateEmail(req.body.email)) {
                customer.email = req.body.email;   
            } else {
                return res.status(400).json({ message: "Invalid email" });
            }
        }
        
        customers[customerIndex] = customer;
        res.status(200).json({message: "Customer details updated",customer});
      
    } catch (error) {
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

            customers.splice(customerIndex, 1);
           // customers.deleted = true;

          res.status(200).json({ message: `Customer with id ${id} has been deleted` });
    } catch (error){
        res.status(500).json({message: error.message})
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});