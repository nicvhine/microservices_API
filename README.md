# MICROSERVICES API PROJECT

## **Objective**

The goal of this exercise is to gain hands-on experience with microservice API design by implementing a simple system of intercommunicating services. The system will manage Products, Customers, and Orders, each through independent microservices.

## **System Overview**

The project consists of three independent microservices
  * **Product Service:** Handles product-related data.
  * **Customer Service:** Handles customer-related data.
  * **Order Service:** Handles order-related data and communicates with the Product and Customer Services to validate data before creating an order.

## **API Endpoints**

### Product Service - Port: 3001
  * **POST /products:** Add a new product.
   ```json
   {
     "name": "",
     "quantity": ,
     "price": 
   }
   ```
  * **GET /products:** Get all products.
  * **GET /products/:id:** Get product details by ID.
  * **PUT /products/:id:** Update a product.
  * **DELETE /products/:id:** Delete a product

### Customer Service - Port: 3002
  * **POST /customers:** Add a new customer.
    ```json
    {
      "name": "",
      "email": "",
      "age": 
    }
    ```
  * **GET /customers:** Get all customers.
  * **GET /customers/:id:** Get customer details by ID.
  * **PUT /customers/:id:** Update customer information.
  * **DELETE /customers/:id:** Delete a customer.

### Order Service - Port: 3003
  * **POST /orders:** Create a new order. Validates customer and product data by communicating with the Customer and Product Services.
    ```json
    {
      "customerId": ,
      "productId": ,
      "quantity": 
    }
    ```
  * **GET /orders:** Get all orders.
  * **GET /orders/:id:** Get order details by ID.
  * **PUT /orders/:id:** Update an order.
  * **DELETE /orders/:id:** Delete an order.
    
## **Setup and Installation**
**1. Clone the repository:**
```
git clone https://github.com/nicvhine/microservices_API.git
```
**2. Install dependencies:**
```
npm i express
npm i axios
```
**3. Start each service**
Run each service in separate terminal windows:
* **Customer Service**
  ```
  node CustomerService.js
  ```
* **Product Service**
  ```
  node ProductService.js
  ```
* **Order Service**
  ```
  node OrderService.js
  ```



