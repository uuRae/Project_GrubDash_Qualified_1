const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
// add handlers and middleware functions to create, read, update, delete, and list orders.

// List orders
function list(req, res) {
  res.json({ data: orders });
}

// Create order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Check if property value is a blank string
function propertyHasText(propertyName) {
  return function (req, res, next) {
    const { data: { deliverTo, mobileNumber } = {} } = req.body;

    const propertyValue = { deliverTo, mobileNumber }[propertyName];

    if (propertyValue === "") {
      next({ status: 400, message: `Order must include ${propertyName}` });
    }
    return next();
  };
}

// Check is property exists
function propertyExists(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (!data[propertyName]) {
      next({ status: 400, message: `Order must include ${propertyName}` });
    }
    return next();
  };
}

// Check it dishes is an array and includes at least one item
function dishesArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!Array.isArray(dishes) || dishes.length < 1) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  next();
}

// Check that dish quantity is provided and is an integer
function dishesQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const quantity = dish.quantity;

    if (
      quantity <= 0 ||
      quantity === undefined ||
      !Number.isInteger(quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

// Get order
function read(req, res) {
  //   const orderId = req.params.orderId;
  //   const foundOrder = orders.find((order) => order.id === orderId);
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

// Update order
function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  (order.deliverTo = deliverTo),
    (order.mobileNumber = mobileNumber),
    (order.status = status),
    (order.dishes = dishes),
    res.json({ data: order });
}

// Check that order id matches route id to properly update order
function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;

  if (!id || id === orderId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

// Check that order exists
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  });
}

// Check that status is not delivered and is valid so that order can be updated
function statusProvided(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  } else if (!status || status === "" || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery",
    });
  }

  return next();
}

// Check that status is in pending status so that order can be deleted
function statusPending(req, res, next) {
  const status = res.locals.order.status;
  if (status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  return next();
}

// Delete order
function destroy(req, res, next) {
  const orderId = res.locals.order.id;

  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  destroy: [orderExists, statusPending, destroy],
  create: [
    propertyHasText("deliverTo"),
    propertyHasText("mobileNumber"),
    propertyExists("deliverTo"),
    propertyExists("mobileNumber"),
    propertyExists("dishes"),
    dishesArrayIsValid,
    dishesQuantityIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    idMatches,
    propertyHasText("deliverTo"),
    propertyHasText("mobileNumber"),
    propertyExists("deliverTo"),
    propertyExists("mobileNumber"),
    propertyExists("dishes"),
    dishesArrayIsValid,
    dishesQuantityIsValid,
    statusProvided,
    update,
  ],
};
