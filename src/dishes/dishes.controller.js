const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const notFound = require("../errors/notFound");

// TODO: Implement the /dishes handlers needed to make the tests pass
// add handlers and middleware functions to create, read, update, and list dishes. Note that dishes cannot be deleted.

// List dishes
function list(req, res) {
  res.json({ data: dishes });
}

// Create dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Check that property value is not an empty string
function propertyHasText(propertyName) {
  return function (req, res, next) {
    const { data: { name, description, image_url } = {} } = req.body;

    const propertyValue = { name, description, image_url }[propertyName];

    if (propertyValue.trim() === "") {
      next({ status: 400, message: `Dish must include ${propertyName}` });
    }
    return next();
  };
}

// Check that property exists
function propertyExists(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (!data[propertyName]) {
      next({ status: 400, message: `Dish must include ${propertyName}` });
    }
    return next();
  };
}

// Check that price is > 0 and an integer
function hasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price <= 0 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
    return next();
  }

  next();
}

// Check that dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

// Get dish
function read(req, res) {
  //   const dishId = req.params.dishId;
  //   const foundDish = dishes.find((dish) => dish.id === dishId);
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

// Check that dish id matches route id to properly update order
function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;

  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// Update order
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  create: [
    propertyExists("name"),
    propertyExists("description"),
    propertyExists("price"),
    propertyExists("image_url"),
    propertyHasText("name"),
    propertyHasText("description"),
    propertyHasText("image_url"),
    hasPrice,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    idMatches,
    propertyExists("name"),
    propertyExists("description"),
    propertyExists("price"),
    propertyExists("image_url"),
    propertyHasText("name"),
    propertyHasText("description"),
    propertyHasText("image_url"),
    hasPrice,
    update,
  ],
  list,
};
