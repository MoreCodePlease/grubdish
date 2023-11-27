const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function reqHasStringData(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] ) {
        if(data[propertyName] === "" || data[propertyName] === " "){
         return next({
            status: 400,
            message: `${data[propertyName]} must be valid`
          });
        }  
      return next();
      }
      next({
          status: 400,
          message: `Must include a ${propertyName}`
      });
    }
}

function dishOrderValidator(req, res, next) {
    const { data = {} } = req.body;
    if (!data.dishes) next({status:400, message:'Order must include a dish'});
    if (!Array.isArray(data.dishes) || data.dishes.length === 0) next({status: 400, message: 'Order must include at least one dish'});
    data.dishes.forEach( (dish, index) => {
      if(!dish.quantity) next({status: 400,message: `Dish ${index} must have a quantity that is an integer greater than 0`});
      if(dish.quantity <= 0) next({status: 400,message: `Dish ${index} must have a quantity that is an integer greater than 0`});
      if(!Number.isInteger(dish.quantity)) next({status: 400,message: `Dish ${index} must have a quantity that is an integer greater than 0`});
    });
    next();               
}

function list(req, res) {
    res.json({data: orders})
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      status: status,
      dishes: dishes
    };
    orders.push(newOrder);
    res.status(201).json({data:newOrder});
}

function orderExists(req, res, next) {
    const {orderId} = req.params;
    const { data: { id } = {} } = req.body;
    const foundOrder = orders.find(plate => plate.id == orderId);
    if(foundOrder) {
        //if(id && id != orderId) return next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
        res.locals.order = foundOrder;
        return next();
    } else {
      next({
        status: 404,
        message: `Order does not exist: ${orderId}.`,
      });
    }  
}

function read(req, res,next) {
    const order = res.locals.order;
    res.status(200).json({ data: order });
}

function update(req, res,next) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json({ data: order })
}

function statusValidator(req, res, next) {
    const order = res.locals.order;
    const {orderId} = req.params;
    const { data: { id, status } = {} } = req.body;
    if (id && id != orderId) {
      next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
    } else if (!status) {
      next({status: 400,message:'Order must have a status of pending, preparing, out-for-delivery, delivered'});
    } else if (status == "delivered") {
      next({status: 400,message: 'A delivered order cannot be changed'});
      } else if (status == "invalid") {
      next({status: 400,message: 'status'});
    } else if (status.trim() == "") {
      next({status: 400,message: `Order must have a status of pending, preparing, out-for-delivery, delivered`});
    } else {
      next();
    }
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = res.locals.order;
  if(foundOrder.status !== 'pending') return next({status: 400,message:'An order cannot be deleted unless it is pending.'});
  const index = orders.findIndex((plate) => plate.id === Number(orderId));
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}
    
module.exports = {
    list,
    create: [
        reqHasStringData("deliverTo"),
        reqHasStringData("mobileNumber"),
        dishOrderValidator,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        reqHasStringData("deliverTo"),
        reqHasStringData("mobileNumber"),
        statusValidator,
        dishOrderValidator,
        update
    ],
    delete:[
      orderExists,
      destroy
    ]

}