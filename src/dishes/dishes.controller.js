const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
//const { read } = require("fs");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyHasProperty(property) {
  return function validateProperty(req, res, next) {
      const { data = {} } = req.body;
      if (data[property] && data[property] !== "") {
          return next();
      }
      next({ status: 400, message: `Dish must include a ${property}` });
  };
}

function hasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number(price) > 0 && Number.isInteger(price)) {
      return next();
  }
  next({ status: 400, message: `Dish must have a price that is an integer greater than 0` });
}

function list(req, res) {
  res.json({data: dishes})
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url
  };
  dishes.push(newDish);
  res.status(201).json({data:newDish});
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);

  if (foundDish) {
      res.locals.dish = foundDish;
      return next();
  }

  next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

function hasValidId(req, res, next) {

  const { dishId } = req.params;
  const { data: {id} = {}} = req.body;
  if(id && id !== dishId){
       next({
       status: 400,
       message: `doesn't match id ${id}`
       });
   }
   next();
}
function read(req, res, next) {
  res.json({ data: res.locals.dish });
};


function update(req, res, next) {
  const { dishId } = req.params;
  const dish = res.locals.dish;
  const { data: {id, name, description, image_url, price} = {}} = req.body;
  dish.name = name;
  dish.description = description;
  dish.image_url = image_url;
  dish.price = price;
  res.json({ data: res.locals.dish });
};

module.exports = {
  create: [
    bodyHasProperty("name"),
    bodyHasProperty("description"),
    bodyHasProperty("image_url"),
    bodyHasProperty("price"),
    hasValidPrice,

    create
    ], 
    list, 
    read: [
      dishExists,
      read
    ],
    update:[
      dishExists,
      hasValidId,
      bodyHasProperty("name"),
      bodyHasProperty("description"),
      bodyHasProperty("image_url"),
      bodyHasProperty("price"),
      hasValidPrice,
      update
    ]
}
  