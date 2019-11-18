# Warehouse App

Warehouse app for desktop use.

With this app you can:

* Create, read, update and delete products in stock
* Get Excel report of your stock
* Add important notes for example products that have been reserved
* See activity log of stock by product
* Relate products to each other for better overview
* See the total value of stock by product category
* Add pending product returns and mark them returned
* Manage shippers if you ship by using multiple service providers
* Give users authorizations: admin or employee with limited rights

## Backend

* Node.js
* Express.js
* Mongodb w/ Mongoose.js

## Frontend

* Embedded JavaScript Templates
* Vanilla JavaScript

## External services

* AWS S3

## Security

* JSON Web Tokens
* Bcrypt hashing

### To start using

Create *config.json* file in directory *config*. File content should be similar to:

```
{
    "test": {
        "PORT": PORT NUMBER HERE,
        "MONGODB_URI": "MONGO_URI HERE",
        "JWT_SECRET": "JWT SECRET HERE",
        "BUCKET_KEYID": "BUCKET KEY ID HERE",
        "BUCKET_ACCESSKEY": "BUCKET ACCESS KEY HERE" 
    },
    "development": {
        "PORT": PORT NUMBER HERE,
        "MONGODB_URI": "MONGO_URI HERE",
        "JWT_SECRET": "JWT SECRET HERE",
        "BUCKET_KEYID": "BUCKET KEY ID HERE",
        "BUCKET_ACCESSKEY": "BUCKET ACCESS KEY HERE" 
    }
}
```

